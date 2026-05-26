from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import uuid, hashlib, re, qrcode, io, base64


# ── Validación de placa colombiana ──────────────────────────────
def validate_colombian_plate(raw):
    plate = raw.upper().strip().replace('-', '').replace(' ', '')
    if re.match(r'^[A-Z]{3}[0-9]{3}$', plate):
        return plate, 'Automóvil/Camioneta'
    if re.match(r'^[A-Z]{3}[0-9]{2}[A-Z]$', plate):
        return plate, 'Motocicleta'
    raise ValueError('Formato de placa inválido. Automóviles: ABC123 · Motocicletas: ABC12D')


# ── Generación de código QR con SHA-256 ─────────────────────────
def generate_qr_token(plate):
    uid = str(uuid.uuid4())
    raw = f"{uid}-{plate}-{timezone.now().isoformat()}"
    hash_val = hashlib.sha256(raw.encode()).hexdigest()[:8].upper()
    return f"PSU-v2-{uid}-{plate}-{hash_val}"


def generate_qr_image_base64(token):
    """Genera imagen QR en base64 para adjuntar en correos."""
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()


# ── Usuario ─────────────────────────────────────────────────────
class User(AbstractUser):
    ROLES = [('admin', 'Administrador'), ('vigilante', 'Vigilante'), ('estudiante', 'Estudiante')]
    role = models.CharField(max_length=20, choices=ROLES, default='vigilante')
    access_point = models.CharField(max_length=100, default='Entrada Principal')
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    avatar_initials = models.CharField(max_length=3, blank=True)

    def save(self, *args, **kwargs):
        if not self.avatar_initials:
            parts = self.get_full_name().split()
            self.avatar_initials = ''.join(p[0] for p in parts[:2]).upper() or self.username[:2].upper()
        super().save(*args, **kwargs)

    def is_locked(self):
        return self.locked_until and timezone.now() < self.locked_until

    def remaining_lock_seconds(self):
        if not self.is_locked():
            return 0
        return int((self.locked_until - timezone.now()).total_seconds())

    def register_failed_attempt(self):
        self.login_attempts += 1
        if self.login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            self.locked_until = timezone.now() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
        self.save(update_fields=['login_attempts', 'locked_until'])

    def reset_attempts(self):
        self.login_attempts = 0
        self.locked_until = None
        self.last_activity = timezone.now()
        self.save(update_fields=['login_attempts', 'locked_until', 'last_activity'])

    class Meta:
        db_table = 'usuarios'
        ordering = ['first_name', 'last_name']
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'


# ── Vehículo ────────────────────────────────────────────────────
class Vehiculo(models.Model):
    TIPOS = [('Automóvil', 'Automóvil'), ('Motocicleta', 'Motocicleta'),
             ('Camioneta', 'Camioneta'), ('Bicicleta', 'Bicicleta'), ('Otro', 'Otro')]

    placa = models.CharField(max_length=10, unique=True)
    tipo = models.CharField(max_length=30, choices=TIPOS, default='Automóvil')
    marca = models.CharField(max_length=60, blank=True)
    modelo = models.CharField(max_length=60, blank=True)
    color = models.CharField(max_length=40, blank=True)
    propietario = models.CharField(max_length=200)
    documento = models.CharField(max_length=30, blank=True, help_text='CC, NIT del propietario')
    correo = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    codigo_qr = models.TextField(unique=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    expira_en = models.DateTimeField()
    actualizado_en = models.DateTimeField(auto_now=True)
    registrado_por = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True,
        related_name='vehiculos_registrados'
    )
    notas = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.codigo_qr:
            self.codigo_qr = generate_qr_token(self.placa)
        if not self.expira_en:
            self.expira_en = timezone.now() + timedelta(days=settings.QR_VALIDITY_DAYS)
        super().save(*args, **kwargs)

    def dias_vigencia(self):
        return max(0, (self.expira_en - timezone.now()).days)

    def qr_vigente(self):
        return timezone.now() < self.expira_en and self.activo

    def qr_imagen_url(self):
        return f"https://api.qrserver.com/v1/create-qr-code/?data={self.codigo_qr}&size=300x300&margin=10"

    def qr_imagen_base64(self):
        return generate_qr_image_base64(self.codigo_qr)

    @property
    def en_lista_negra(self):
        return ListaNegra.objects.filter(placa=self.placa).exists()

    class Meta:
        db_table = 'vehiculos'
        ordering = ['-creado_en']
        verbose_name = 'Vehículo'
        verbose_name_plural = 'Vehículos'
        indexes = [
            models.Index(fields=['placa']),
            models.Index(fields=['activo']),
            models.Index(fields=['expira_en']),
        ]


# ── Registro de Acceso ──────────────────────────────────────────
class RegistroAcceso(models.Model):
    MOVIMIENTOS = [('Entrada', 'Entrada'), ('Salida', 'Salida'), ('Intento', 'Intento')]
    ESTADOS = [('Autorizado', 'Autorizado'), ('Denegado', 'Denegado')]
    METODOS = [('QR', 'QR'), ('Manual', 'Manual'), ('Sistema', 'Sistema')]

    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.SET_NULL, null=True, blank=True, related_name='accesos')
    placa = models.CharField(max_length=10)
    propietario = models.CharField(max_length=200, blank=True)
    movimiento = models.CharField(max_length=20, choices=MOVIMIENTOS)
    metodo = models.CharField(max_length=20, choices=METODOS, default='QR')
    punto_acceso = models.CharField(max_length=100)
    estado = models.CharField(max_length=20, choices=ESTADOS)
    motivo_denegacion = models.CharField(max_length=300, blank=True)
    registrado_por = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='accesos_registrados')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'registros_acceso'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['placa', 'timestamp']),
            models.Index(fields=['estado']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['movimiento']),
        ]


# ── Lista Negra ─────────────────────────────────────────────────
class ListaNegra(models.Model):
    RAZONES = [
        ('robo', 'Vehículo reportado como robado'),
        ('deuda', 'Deuda pendiente con la institución'),
        ('sancion', 'Sanción disciplinaria'),
        ('otro', 'Otro motivo'),
    ]
    placa = models.CharField(max_length=10, unique=True)
    razon = models.CharField(max_length=20, choices=RAZONES, default='otro')
    motivo = models.TextField()
    agregado_por = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='lista_negra_registros')
    agregado_en = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'lista_negra'
        ordering = ['-agregado_en']


# ── Visitante ───────────────────────────────────────────────────
class Visitante(models.Model):
    nombre = models.CharField(max_length=200)
    documento = models.CharField(max_length=30, blank=True)
    placa = models.CharField(max_length=10, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    correo = models.EmailField(blank=True)
    anfitrion = models.CharField(max_length=200, blank=True)
    dependencia = models.CharField(max_length=100, blank=True)
    motivo = models.TextField(blank=True)
    hora_entrada = models.DateTimeField(auto_now_add=True)
    hora_salida = models.DateTimeField(null=True, blank=True)
    registrado_por = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='visitantes')
    observaciones = models.TextField(blank=True)

    def horas_en_campus(self):
        fin = self.hora_salida or timezone.now()
        return round((fin - self.hora_entrada).total_seconds() / 3600, 1)

    def en_alerta(self):
        return not self.hora_salida and self.horas_en_campus() > settings.PROLONGED_STAY_HOURS

    class Meta:
        db_table = 'visitantes'
        ordering = ['-hora_entrada']


# ── Estado de la Barrera ────────────────────────────────────────
class EstadoBarrera(models.Model):
    abierta = models.BooleanField(default=False)
    actualizado_en = models.DateTimeField(auto_now=True)
    actualizado_por = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True)
    razon = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'estado_barrera'

    @classmethod
    def get_estado(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj


# ── Bitácora de Auditoría ───────────────────────────────────────
class Auditoria(models.Model):
    ACCIONES = [
        ('login', 'Inicio de sesión'),
        ('logout', 'Cierre de sesión'),
        ('login_failed', 'Intento de login fallido'),
        ('locked', 'Cuenta bloqueada'),
        ('vehiculo_creado', 'Vehículo registrado'),
        ('vehiculo_modificado', 'Vehículo modificado'),
        ('acceso_autorizado', 'Acceso autorizado'),
        ('acceso_denegado', 'Acceso denegado'),
        ('lista_negra_agregado', 'Agregado a lista negra'),
        ('lista_negra_removido', 'Removido de lista negra'),
        ('barrera_abierta', 'Barrera abierta'),
        ('barrera_cerrada', 'Barrera cerrada'),
        ('usuario_creado', 'Usuario creado'),
        ('usuario_modificado', 'Usuario modificado'),
    ]
    usuario = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='auditoria')
    accion = models.CharField(max_length=30, choices=ACCIONES)
    detalle = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    exitoso = models.BooleanField(default=True)

    class Meta:
        db_table = 'auditoria'
        ordering = ['-timestamp']

    @classmethod
    def log(cls, usuario, accion, detalle='', ip=None, exitoso=True):
        cls.objects.create(usuario=usuario, accion=accion, detalle=detalle, ip_address=ip, exitoso=exitoso)


# ── Notificación ────────────────────────────────────────────────
class Notificacion(models.Model):
    TIPOS = [('alerta', 'Alerta'), ('info', 'Información'), ('error', 'Error'), ('exito', 'Éxito')]
    usuario = models.ForeignKey('User', on_delete=models.CASCADE, related_name='notificaciones', null=True)
    tipo = models.CharField(max_length=20, choices=TIPOS, default='info')
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    creada_en = models.DateTimeField(auto_now_add=True)
    placa = models.CharField(max_length=10, blank=True)

    class Meta:
        db_table = 'notificaciones'
        ordering = ['-creada_en']

    @classmethod
    def enviar_a_admins(cls, tipo, titulo, mensaje, placa=''):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        for admin in User.objects.filter(role__in=['admin', 'vigilante'], is_active=True):
            cls.objects.create(usuario=admin, tipo=tipo, titulo=titulo, mensaje=mensaje, placa=placa)