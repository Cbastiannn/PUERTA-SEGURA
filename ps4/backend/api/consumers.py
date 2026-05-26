"""
api/consumers.py — WebSocket consumers para tiempo real.

Grupos disponibles:
  - dashboard        → stats actualizadas cada vez que hay un acceso
  - notifications_{user_id} → notificaciones personales
  - barrier          → estado de la barrera en tiempo real
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class DashboardConsumer(AsyncWebsocketConsumer):
    """Transmite actualizaciones del dashboard a todos los usuarios conectados."""

    GROUP = 'dashboard'

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP, self.channel_name)
        await self.accept()
        # Enviar stats actuales al conectarse
        stats = await self._get_stats()
        await self.send(text_data=json.dumps({'type': 'stats', 'data': stats}))

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.GROUP, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Ping → Pong para keepalive
        await self.send(text_data=json.dumps({'type': 'pong'}))

    async def stats_update(self, event):
        """Recibe evento del grupo y lo reenvía al cliente."""
        await self.send(text_data=json.dumps({'type': 'stats', 'data': event['data']}))

    async def barrier_update(self, event):
        await self.send(text_data=json.dumps({'type': 'barrier', 'data': event['data']}))

    @database_sync_to_async
    def _get_stats(self):
        from api.models import Vehiculo, RegistroAcceso, ListaNegra, Visitante, Notificacion
        from django.db.models import Count
        from datetime import timedelta

        hoy = timezone.now().date()
        accesos_hoy = RegistroAcceso.objects.filter(timestamp__date=hoy)
        return {
            'vehiculos_totales':   Vehiculo.objects.count(),
            'vehiculos_activos':   Vehiculo.objects.filter(activo=True).count(),
            'accesos_hoy':         accesos_hoy.count(),
            'autorizados_hoy':     accesos_hoy.filter(estado='Autorizado').count(),
            'denegados_hoy':       accesos_hoy.filter(estado='Denegado').count(),
            'en_lista_negra':      ListaNegra.objects.filter(activo=True).count(),
            'visitantes_activos':  Visitante.objects.filter(hora_salida__isnull=True).count(),
            'vehiculos_proximos':  Vehiculo.objects.filter(
                activo=True, expira_en__lte=timezone.now() + timedelta(days=30)
            ).count(),
            'timestamp': timezone.now().isoformat(),
        }


class NotificationConsumer(AsyncWebsocketConsumer):
    """Envía notificaciones personales a cada usuario."""

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return
        self.group_name = f'notifications_{user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notification(self, event):
        await self.send(text_data=json.dumps({'type': 'notification', 'data': event['data']}))


class BarrierConsumer(AsyncWebsocketConsumer):
    """Estado de la barrera en tiempo real."""

    GROUP = 'barrier'

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP, self.channel_name)
        await self.accept()
        state = await self._get_barrier()
        await self.send(text_data=json.dumps({'type': 'barrier', 'data': state}))

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.GROUP, self.channel_name)

    async def barrier_update(self, event):
        await self.send(text_data=json.dumps({'type': 'barrier', 'data': event['data']}))

    @database_sync_to_async
    def _get_barrier(self):
        from api.models import EstadoBarrera
        b = EstadoBarrera.get_estado()
        return {
            'abierta': b.abierta,
            'actualizado_en': b.actualizado_en.isoformat(),
            'razon': b.razon,
        }
