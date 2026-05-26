from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Vehiculo, RegistroAcceso, ListaNegra, Visitante, EstadoBarrera, Auditoria, Notificacion, validate_colombian_plate

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name',
                  'email', 'role', 'access_point', 'phone', 'is_active',
                  'avatar_initials', 'last_activity', 'date_joined']
        read_only_fields = ['last_activity', 'date_joined', 'avatar_initials']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password',
                  'role', 'access_point', 'phone']

    def create(self, validated_data):
        pw = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(pw)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'role', 'access_point', 'phone', 'is_active']


class VehiculoSerializer(serializers.ModelSerializer):
    dias_vigencia = serializers.SerializerMethodField()
    en_lista_negra = serializers.SerializerMethodField()
    qr_imagen_url = serializers.SerializerMethodField()
    registrado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Vehiculo
        fields = ['id', 'placa', 'tipo', 'marca', 'modelo', 'color', 'propietario',
                  'documento', 'correo', 'telefono', 'codigo_qr', 'activo',
                  'creado_en', 'expira_en', 'actualizado_en', 'dias_vigencia',
                  'en_lista_negra', 'qr_imagen_url', 'registrado_por_nombre', 'notas']
        read_only_fields = ['codigo_qr', 'creado_en', 'expira_en', 'actualizado_en']

    def get_dias_vigencia(self, obj): return obj.dias_vigencia()
    def get_en_lista_negra(self, obj): return obj.en_lista_negra
    def get_qr_imagen_url(self, obj): return obj.qr_imagen_url()
    def get_registrado_por_nombre(self, obj):
        return obj.registrado_por.get_full_name() if obj.registrado_por else '—'

    def validate_placa(self, value):
        try:
            plate, _ = validate_colombian_plate(value)
            return plate
        except ValueError as e:
            raise serializers.ValidationError(str(e))


class RegistroAccesoSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = RegistroAcceso
        fields = ['id', 'placa', 'propietario', 'movimiento', 'metodo',
                  'punto_acceso', 'estado', 'motivo_denegacion',
                  'registrado_por_nombre', 'timestamp']

    def get_registrado_por_nombre(self, obj):
        return obj.registrado_por.get_full_name() if obj.registrado_por else '—'


class ListaNegraSerializer(serializers.ModelSerializer):
    agregado_por_nombre = serializers.SerializerMethodField()
    vehiculo_info = serializers.SerializerMethodField()

    class Meta:
        model = ListaNegra
        fields = ['id', 'placa', 'razon', 'motivo', 'agregado_por_nombre',
                  'agregado_en', 'activo', 'vehiculo_info']
        read_only_fields = ['agregado_en']

    def get_agregado_por_nombre(self, obj):
        return obj.agregado_por.get_full_name() if obj.agregado_por else '—'

    def get_vehiculo_info(self, obj):
        try:
            v = Vehiculo.objects.get(placa=obj.placa)
            return {'propietario': v.propietario, 'tipo': v.tipo, 'marca': v.marca}
        except Vehiculo.DoesNotExist:
            return None

    def validate_placa(self, value):
        try:
            plate, _ = validate_colombian_plate(value)
            return plate
        except ValueError as e:
            raise serializers.ValidationError(str(e))


class VisitanteSerializer(serializers.ModelSerializer):
    horas_en_campus = serializers.SerializerMethodField()
    en_alerta = serializers.SerializerMethodField()
    registrado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Visitante
        fields = ['id', 'nombre', 'documento', 'placa', 'telefono', 'correo',
                  'anfitrion', 'dependencia', 'motivo', 'hora_entrada',
                  'hora_salida', 'horas_en_campus', 'en_alerta',
                  'registrado_por_nombre', 'observaciones']
        read_only_fields = ['hora_entrada']

    def get_horas_en_campus(self, obj): return obj.horas_en_campus()
    def get_en_alerta(self, obj): return obj.en_alerta()
    def get_registrado_por_nombre(self, obj):
        return obj.registrado_por.get_full_name() if obj.registrado_por else '—'


class EstadoBarreraSerializer(serializers.ModelSerializer):
    actualizado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = EstadoBarrera
        fields = ['abierta', 'actualizado_en', 'actualizado_por_nombre', 'razon']

    def get_actualizado_por_nombre(self, obj):
        return obj.actualizado_por.get_full_name() if obj.actualizado_por else '—'


class AuditoriaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Auditoria
        fields = ['id', 'usuario_nombre', 'accion', 'detalle', 'ip_address', 'timestamp', 'exitoso']

    def get_usuario_nombre(self, obj):
        return obj.usuario.get_full_name() if obj.usuario else 'Sistema'


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = ['id', 'tipo', 'titulo', 'mensaje', 'leida', 'creada_en', 'placa']
