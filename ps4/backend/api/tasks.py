"""
api/tasks.py — Tareas asíncronas con Celery.

Ventajas sobre threading:
- Reintentos automáticos en caso de fallo
- Cola persistente (sobrevive a reinicios)
- Monitoreo con Flower
- Rate limiting por tarea
"""
from celery import shared_task
from django.utils import timezone
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.conf import settings
from datetime import timedelta
import base64
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def enviar_qr_por_correo(self, vehiculo_id: int):
    """Genera imagen QR y la envía por correo con reintentos automáticos."""
    try:
        from api.models import Vehiculo
        v = Vehiculo.objects.get(id=vehiculo_id)
        if not v.correo:
            return {'status': 'skip', 'reason': 'Sin correo registrado'}

        qr_b64 = v.qr_imagen_base64()
        qr_bytes = base64.b64decode(qr_b64)

        texto = f"""
Hola {v.propietario},

Tu código QR de acceso vehicular ha sido generado.

─── Datos del vehículo ───────────────────────────
  Placa:   {v.placa}
  Tipo:    {v.tipo}
  Marca:   {v.marca} {v.modelo}
  Color:   {v.color}

  Vigencia: {v.dias_vigencia()} días
  Vence:    {v.expira_en.strftime('%d de %B de %Y')}
─────────────────────────────────────────────────

Presenta el QR adjunto al personal de portería.

— Sistema Puerta Segura v3.0
   Universidad de Cundinamarca, Seccional Girardot
        """.strip()

        msg = EmailMessage(
            subject=f'🛡️ Código QR de acceso — {v.placa} | Puerta Segura v3.0',
            body=texto,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[v.correo],
        )
        msg.attach('qr-acceso.png', qr_bytes, 'image/png')
        msg.send()
        logger.info(f'QR enviado: {v.placa} → {v.correo}')
        return {'status': 'ok', 'placa': v.placa, 'correo': v.correo}

    except Exception as exc:
        logger.error(f'Error enviando QR vehículo {vehiculo_id}: {exc}')
        raise self.retry(exc=exc)


@shared_task
def verificar_permanencia_prolongada():
    """
    Corre cada 5 minutos (configurado en CELERY_BEAT_SCHEDULE).
    Detecta vehículos con >4h en campus y genera notificaciones.
    """
    from api.models import RegistroAcceso, Notificacion
    from django.db.models import Q

    limite = timezone.now() - timedelta(hours=settings.PROLONGED_STAY_HOURS)
    alertas = 0

    # Vehículos con entrada >4h y sin salida posterior
    entradas = (
        RegistroAcceso.objects
        .filter(movimiento='Entrada', estado='Autorizado', timestamp__lte=limite)
        .order_by('placa', '-timestamp')
    )
    visto = set()
    for e in entradas:
        if e.placa in visto:
            continue
        visto.add(e.placa)
        tiene_salida = RegistroAcceso.objects.filter(
            placa=e.placa, movimiento='Salida', timestamp__gt=e.timestamp
        ).exists()
        if not tiene_salida:
            horas = round((timezone.now() - e.timestamp).total_seconds() / 3600, 1)
            # Solo notificar si no hay notificación reciente (última hora)
            ya_notificado = Notificacion.objects.filter(
                placa=e.placa, tipo='alerta',
                creada_en__gte=timezone.now() - timedelta(hours=1)
            ).exists()
            if not ya_notificado:
                Notificacion.enviar_a_admins(
                    tipo='alerta',
                    titulo=f'⚠️ Permanencia prolongada: {e.placa}',
                    mensaje=f'{e.propietario} lleva {horas}h en el campus (ingresó {e.timestamp.strftime("%H:%M")})',
                    placa=e.placa,
                )
                alertas += 1

    logger.info(f'Verificación permanencia: {alertas} nuevas alertas generadas')
    return {'alertas_generadas': alertas}


@shared_task
def enviar_reporte_semanal():
    """Envía reporte semanal en PDF a todos los admins activos."""
    from api.models import User, RegistroAcceso
    from django.db.models import Count

    hace_7_dias = timezone.now() - timedelta(days=7)
    accesos = RegistroAcceso.objects.filter(timestamp__gte=hace_7_dias)
    total = accesos.count()
    autorizados = accesos.filter(estado='Autorizado').count()
    denegados = accesos.filter(estado='Denegado').count()

    cuerpo = f"""
REPORTE SEMANAL — PUERTA SEGURA v3.0
Universidad de Cundinamarca, Seccional Girardot
Período: {hace_7_dias.strftime('%d/%m/%Y')} — {timezone.now().strftime('%d/%m/%Y')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total de accesos:     {total}
  Autorizados:          {autorizados} ({round(autorizados/max(total,1)*100,1)}%)
  Denegados:            {denegados}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este reporte fue generado automáticamente.
    """.strip()

    admins = User.objects.filter(role='admin', is_active=True).exclude(email='')
    for admin in admins:
        try:
            EmailMessage(
                subject=f'📊 Reporte semanal — Puerta Segura ({timezone.now().strftime("%d/%m/%Y")})',
                body=cuerpo,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[admin.email],
            ).send()
        except Exception as e:
            logger.error(f'Error enviando reporte a {admin.email}: {e}')

    return {'admins_notificados': admins.count(), 'total_accesos': total}


@shared_task
def broadcast_stats_update():
    """Envía stats actualizadas a todos los clientes WebSocket del dashboard."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        from api.models import Vehiculo, RegistroAcceso, ListaNegra, Visitante
        from django.db.models import Count

        hoy = timezone.now().date()
        accesos_hoy = RegistroAcceso.objects.filter(timestamp__date=hoy)
        stats = {
            'vehiculos_activos': Vehiculo.objects.filter(activo=True).count(),
            'accesos_hoy':       accesos_hoy.count(),
            'autorizados_hoy':   accesos_hoy.filter(estado='Autorizado').count(),
            'denegados_hoy':     accesos_hoy.filter(estado='Denegado').count(),
            'en_lista_negra':    ListaNegra.objects.filter(activo=True).count(),
            'visitantes_activos':Visitante.objects.filter(hora_salida__isnull=True).count(),
            'timestamp':         timezone.now().isoformat(),
        }
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)('dashboard', {
            'type': 'stats_update',
            'data': stats,
        })
    except Exception as e:
        logger.warning(f'WebSocket broadcast falló (Redis no disponible?): {e}')


@shared_task
def notificar_qr_por_vencer():
    """
    Corre diariamente (agregar a CELERY_BEAT_SCHEDULE).
    Envía correo a propietarios cuyo QR vence en 7 días.
    """
    from api.models import Vehiculo
    from django.core.mail import EmailMessage

    margen = timezone.now() + timedelta(days=7)
    inicio = timezone.now() + timedelta(days=6)

    por_vencer = Vehiculo.objects.filter(
        activo=True,
        correo__isnull=False,
        expira_en__gte=inicio,
        expira_en__lte=margen,
    ).exclude(correo='')

    enviados = 0
    for v in por_vencer:
        try:
            msg = EmailMessage(
                subject=f'⚠️ Tu QR de acceso vence en 7 días — {v.placa}',
                body=(
                    f'Hola {v.propietario},\n\n'
                    f'Tu código QR de acceso vehicular vencerá el '
                    f'{v.expira_en.strftime("%d de %B de %Y")}.\n\n'
                    f'Placa: {v.placa} | {v.tipo} {v.marca}\n\n'
                    f'Contacta al administrador de Puerta Segura para renovar tu acceso.\n\n'
                    f'— Sistema Puerta Segura v3.0\n'
                    f'   Universidad de Cundinamarca, Seccional Girardot'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[v.correo],
            )
            msg.send()
            enviados += 1
            logger.info(f'QR por vencer notificado: {v.placa} → {v.correo}')
        except Exception as e:
            logger.error(f'Error notificando {v.placa}: {e}')

    return {'notificados': enviados, 'total_por_vencer': por_vencer.count()}
