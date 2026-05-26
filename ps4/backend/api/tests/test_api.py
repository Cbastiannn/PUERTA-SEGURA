"""
api/tests/test_api.py — Suite de pruebas unitarias e integración.

Ejecutar:
    pytest backend/ -v --cov=api --cov-report=term-missing
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


# ── Fixtures ──────────────────────────────────────────────────────────────────
@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_superuser(
        username='admin_test',
        email='admin@test.com',
        password='Admin2026!',
        first_name='Admin', last_name='Test',
    )
    user.role = 'admin'
    user.access_point = 'Central'
    user.save()
    return user


@pytest.fixture
def vigilante_user(db):
    user = User.objects.create_user(
        username='vig_test',
        email='vigilante@test.com',
        password='Vigil2026!',
        first_name='Juan', last_name='Pérez',
    )
    user.role = 'vigilante'
    user.access_point = 'Entrada Principal'
    user.save()
    return user


@pytest.fixture
def auth_admin(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def auth_vig(api_client, vigilante_user):
    api_client.force_authenticate(user=vigilante_user)
    return api_client


@pytest.fixture
def vehiculo(db, admin_user):
    from api.models import Vehiculo
    return Vehiculo.objects.create(
        placa='TST001',
        tipo='Automóvil',
        marca='Toyota',
        color='Blanco',
        propietario='Persona Test',
        correo='test@test.com',
        registrado_por=admin_user,
    )


# ── Tests: Autenticación ──────────────────────────────────────────────────────
class TestAuth:
    def test_login_exitoso(self, api_client, admin_user):
        resp = api_client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'Admin2026!',
        }, format='json')
        assert resp.status_code == 200
        assert 'token' in resp.data
        assert resp.data['user']['email'] == 'admin@test.com'

    def test_login_password_incorrecta(self, api_client, admin_user):
        resp = api_client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'WrongPassword',
        }, format='json')
        assert resp.status_code == 400
        assert 'error' in resp.data
        assert resp.data['attempts'] == 1

    def test_login_email_inexistente(self, api_client, db):
        resp = api_client.post('/api/auth/login/', {
            'email': 'noexiste@test.com',
            'password': 'cualquiera',
        }, format='json')
        assert resp.status_code == 400

    def test_bloqueo_tras_5_intentos(self, api_client, admin_user):
        for _ in range(5):
            api_client.post('/api/auth/login/', {
                'email': 'admin@test.com',
                'password': 'wrong',
            }, format='json')
        resp = api_client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'wrong',
        }, format='json')
        assert resp.status_code == 403
        assert resp.data.get('locked') is True

    def test_endpoint_me(self, auth_admin, admin_user):
        resp = auth_admin.get('/api/auth/me/')
        assert resp.status_code == 200
        assert resp.data['email'] == admin_user.email

    def test_me_sin_autenticar(self, api_client):
        resp = api_client.get('/api/auth/me/')
        assert resp.status_code == 401

    def test_logout(self, api_client, admin_user):
        login_resp = api_client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'Admin2026!',
        }, format='json')
        refresh_token = login_resp.data['refresh']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_resp.data["token"]}')
        resp = api_client.post('/api/auth/logout/', {'refresh': refresh_token}, format='json')
        assert resp.status_code == 200


# ── Tests: Validación de placas ───────────────────────────────────────────────
class TestValidacionPlaca:
    def test_placa_automovil_valida(self):
        from api.models import validate_colombian_plate
        plate, tipo = validate_colombian_plate('ABC123')
        assert plate == 'ABC123'
        assert 'Automóvil' in tipo

    def test_placa_moto_valida(self):
        from api.models import validate_colombian_plate
        plate, tipo = validate_colombian_plate('ABC12D')
        assert plate == 'ABC12D'
        assert 'Motocicleta' in tipo

    def test_placa_con_guion(self):
        from api.models import validate_colombian_plate
        plate, _ = validate_colombian_plate('ABC-123')
        assert plate == 'ABC123'

    def test_placa_minusculas(self):
        from api.models import validate_colombian_plate
        plate, _ = validate_colombian_plate('abc123')
        assert plate == 'ABC123'

    def test_placa_invalida(self):
        from api.models import validate_colombian_plate
        with pytest.raises(ValueError):
            validate_colombian_plate('12ABC3')

    def test_placa_muy_corta(self):
        from api.models import validate_colombian_plate
        with pytest.raises(ValueError):
            validate_colombian_plate('AB1')


# ── Tests: Vehículos ──────────────────────────────────────────────────────────
class TestVehiculos:
    def test_listar_vehiculos_autenticado(self, auth_vig):
        resp = auth_vig.get('/api/vehiculos/')
        assert resp.status_code == 200

    def test_listar_vehiculos_sin_auth(self, api_client):
        resp = api_client.get('/api/vehiculos/')
        assert resp.status_code == 401

    def test_crear_vehiculo_admin(self, auth_admin, db):
        resp = auth_admin.post('/api/vehiculos/', {
            'placa': 'NEW001',
            'tipo': 'Automóvil',
            'propietario': 'Test Propietario',
            'marca': 'Honda',
        }, format='json')
        assert resp.status_code == 201
        assert resp.data['placa'] == 'NEW001'
        assert resp.data['codigo_qr'] is not None

    def test_crear_vehiculo_vigilante_denegado(self, auth_vig, db):
        resp = auth_vig.post('/api/vehiculos/', {
            'placa': 'NEW002',
            'propietario': 'Test',
        }, format='json')
        assert resp.status_code == 403

    def test_placa_duplicada(self, auth_admin, vehiculo):
        resp = auth_admin.post('/api/vehiculos/', {
            'placa': 'TST001',
            'propietario': 'Otro Propietario',
        }, format='json')
        assert resp.status_code == 400

    def test_obtener_qr(self, auth_vig, vehiculo):
        resp = auth_vig.get(f'/api/vehiculos/{vehiculo.id}/qr/')
        assert resp.status_code == 200
        assert 'codigo_qr' in resp.data
        assert resp.data['placa'] == 'TST001'

    def test_toggle_vehiculo(self, auth_admin, vehiculo):
        assert vehiculo.activo is True
        resp = auth_admin.patch(f'/api/vehiculos/{vehiculo.id}/toggle/')
        assert resp.status_code == 200
        assert resp.data['activo'] is False

    def test_toggle_requiere_admin(self, auth_vig, vehiculo):
        resp = auth_vig.patch(f'/api/vehiculos/{vehiculo.id}/toggle/')
        assert resp.status_code == 403

    def test_buscar_por_placa(self, auth_vig, vehiculo):
        resp = auth_vig.get('/api/vehiculos/?search=TST001')
        assert resp.status_code == 200
        assert resp.data['count'] >= 1

    def test_filtrar_activos(self, auth_vig, vehiculo):
        resp = auth_vig.get('/api/vehiculos/?activo=true')
        assert resp.status_code == 200
        for v in resp.data['results']:
            assert v['activo'] is True


# ── Tests: Control de acceso ──────────────────────────────────────────────────
class TestAcceso:
    def test_acceso_placa_valida(self, auth_vig, vehiculo):
        resp = auth_vig.post('/api/acceso/placa/', {'placa': 'TST001'}, format='json')
        assert resp.status_code == 200
        assert resp.data['autorizado'] is True
        assert resp.data['estado'] == 'Autorizado'

    def test_acceso_placa_no_registrada(self, auth_vig, db):
        resp = auth_vig.post('/api/acceso/placa/', {'placa': 'ZZZ999'}, format='json')
        assert resp.status_code == 200
        assert resp.data['autorizado'] is False
        assert 'no registrada' in resp.data['motivo']

    def test_acceso_vehiculo_inactivo(self, auth_vig, vehiculo):
        vehiculo.activo = False; vehiculo.save()
        resp = auth_vig.post('/api/acceso/placa/', {'placa': 'TST001'}, format='json')
        assert resp.status_code == 200
        assert resp.data['autorizado'] is False

    def test_acceso_placa_invalida(self, auth_vig, db):
        resp = auth_vig.post('/api/acceso/placa/', {'placa': 'INVALIDA'}, format='json')
        assert resp.status_code == 400

    def test_acceso_lista_negra(self, auth_vig, vehiculo, admin_user):
        from api.models import ListaNegra
        ListaNegra.objects.create(placa='TST001', motivo='Test bloqueo', agregado_por=admin_user)
        resp = auth_vig.post('/api/acceso/placa/', {'placa': 'TST001'}, format='json')
        assert resp.status_code == 200
        assert resp.data['autorizado'] is False
        assert 'LISTA NEGRA' in resp.data['motivo']

    def test_registro_salida(self, auth_vig, vehiculo):
        resp = auth_vig.post('/api/acceso/salida/', {'placa': 'TST001'}, format='json')
        assert resp.status_code == 200
        assert 'Salida registrada' in resp.data['message']

    def test_historial_creado_tras_acceso(self, auth_vig, vehiculo, db):
        from api.models import RegistroAcceso
        inicial = RegistroAcceso.objects.count()
        auth_vig.post('/api/acceso/placa/', {'placa': 'TST001'}, format='json')
        assert RegistroAcceso.objects.count() == inicial + 1


# ── Tests: Lista negra ────────────────────────────────────────────────────────
class TestListaNegra:
    def test_listar(self, auth_vig):
        resp = auth_vig.get('/api/lista-negra/')
        assert resp.status_code == 200

    def test_agregar_solo_admin(self, auth_admin, db):
        resp = auth_admin.post('/api/lista-negra/', {
            'placa': 'BLK001',
            'razon': 'robo',
            'motivo': 'Vehículo robado test',
        }, format='json')
        assert resp.status_code == 201

    def test_agregar_requiere_admin(self, auth_vig, db):
        resp = auth_vig.post('/api/lista-negra/', {
            'placa': 'BLK002', 'razon': 'otro', 'motivo': 'Test',
        }, format='json')
        assert resp.status_code == 403


# ── Tests: Barrera ────────────────────────────────────────────────────────────
class TestBarrera:
    def test_obtener_estado(self, auth_vig):
        resp = auth_vig.get('/api/barrera/')
        assert resp.status_code == 200
        assert 'abierta' in resp.data

    def test_cambiar_estado(self, auth_admin):
        resp = auth_admin.post('/api/barrera/', {'abierta': True, 'razon': 'Test'}, format='json')
        assert resp.status_code == 200
        assert resp.data['abierta'] is True


# ── Tests: Stats ──────────────────────────────────────────────────────────────
class TestStats:
    def test_stats_autenticado(self, auth_vig):
        resp = auth_vig.get('/api/stats/')
        assert resp.status_code == 200
        assert 'vehiculos_totales' in resp.data
        assert 'accesos_hoy' in resp.data
        assert 'por_dia' in resp.data

    def test_stats_sin_auth(self, api_client):
        resp = api_client.get('/api/stats/')
        assert resp.status_code == 401

    def test_reporte_fechas(self, auth_admin, db):
        resp = auth_admin.get('/api/reporte/?desde=2026-01-01&hasta=2026-12-31')
        assert resp.status_code == 200
        assert 'total_accesos' in resp.data
        assert 'periodo' in resp.data

    def test_reporte_fecha_invalida(self, auth_admin):
        resp = auth_admin.get('/api/reporte/?desde=fecha-mala')
        assert resp.status_code == 400


# ── Tests: Modelos ────────────────────────────────────────────────────────────
class TestModelos:
    def test_qr_generado_automaticamente(self, vehiculo):
        assert vehiculo.codigo_qr is not None
        assert vehiculo.codigo_qr.startswith('PSU-v2-')

    def test_expiracion_365_dias(self, vehiculo):
        from datetime import timedelta
        from django.utils import timezone
        diff = vehiculo.expira_en - timezone.now()
        assert 363 <= diff.days <= 366

    def test_dias_vigencia(self, vehiculo):
        assert vehiculo.dias_vigencia() >= 0

    def test_qr_imagen_url(self, vehiculo):
        url = vehiculo.qr_imagen_url()
        assert 'qrserver.com' in url
        assert vehiculo.codigo_qr in url

    def test_user_avatar_initials(self, admin_user):
        assert admin_user.avatar_initials in ['AS', 'AT', 'A']

    def test_user_bloqueo(self, db):
        user = User.objects.create_user('ublk', 'ublk@test.com', 'Test1234!')
        for _ in range(5):
            user.register_failed_attempt()
        assert user.is_locked() is True
        assert user.remaining_lock_seconds() > 0

    def test_user_reset_attempts(self, db):
        user = User.objects.create_user('urst', 'urst@test.com', 'Test1234!')
        user.register_failed_attempt()
        user.register_failed_attempt()
        user.reset_attempts()
        assert user.login_attempts == 0
        assert user.locked_until is None


class TestNuevosEndpoints:
    def test_heatmap(self, auth_vig):
        resp = auth_vig.get('/api/stats/heatmap/')
        assert resp.status_code == 200
        assert 'data' in resp.data
        assert 'max' in resp.data
        assert 'dias' in resp.data

    def test_exportar_auditoria_solo_admin(self, auth_vig):
        resp = auth_vig.get('/api/exportar/auditoria-excel/')
        assert resp.status_code == 403

    def test_exportar_auditoria_admin(self, auth_admin):
        resp = auth_admin.get('/api/exportar/auditoria-excel/')
        assert resp.status_code == 200
        assert 'spreadsheetml' in resp['Content-Type']

    def test_registro_salida_placa_invalida(self, auth_vig, db):
        resp = auth_vig.post('/api/acceso/salida/', {'placa': 'INVALIDA'}, format='json')
        assert resp.status_code == 400

    def test_importar_sin_archivo(self, auth_admin, db):
        resp = auth_admin.post('/api/vehiculos/importar_excel/', {}, format='multipart')
        assert resp.status_code == 400
