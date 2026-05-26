from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = config('SECRET_KEY', default='django-insecure-ps4-dev-2026-ucundinamarca')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'channels',
    # Local
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'api.User'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'static'],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

# ── Database ──────────────────────────────────────────────────────
DATABASE_URL = config('DATABASE_URL', default=None)
if DATABASE_URL:
    DATABASES = {'default': dj_database_url.parse(DATABASE_URL)}
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': config('DB_NAME', default='puerta_segura'),
            'USER': config('DB_USER', default='root'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='3306'),
            'OPTIONS': {'charset': 'utf8mb4'},
        }
    }

# ── Redis ─────────────────────────────────────────────────────────
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

# ── Cache (Redis) ─────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'IGNORE_EXCEPTIONS': True,  # Fallback si Redis no está disponible
        },
        'TIMEOUT': 60,  # segundos por defecto
    }
}

# ── Django Channels (WebSockets) ──────────────────────────────────
# FIX #3 — Channels: usar Redis si está disponible, sino memoria
try:
    import channels_redis  # noqa
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {'hosts': [REDIS_URL]},
        }
    }
except ImportError:
    CHANNEL_LAYERS = {
        'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}
    }

# ── Celery (tareas asíncronas) ────────────────────────────────────
CELERY_BROKER_URL           = REDIS_URL
CELERY_RESULT_BACKEND       = REDIS_URL
CELERY_ACCEPT_CONTENT       = ['json']
CELERY_TASK_SERIALIZER      = 'json'
CELERY_RESULT_SERIALIZER    = 'json'
CELERY_TIMEZONE             = 'America/Bogota'
CELERY_BEAT_SCHEDULE = {
    'check-prolonged-stay': {
        'task': 'api.tasks.verificar_permanencia_prolongada',
        'schedule': 300.0,  # cada 5 minutos
    },
    'weekly-report': {
        'task': 'api.tasks.enviar_reporte_semanal',
        'schedule': 604800.0,  # cada 7 días
    },
    'notificar-qr-por-vencer': {
        'task': 'api.tasks.notificar_qr_por_vencer',
        'schedule': 86400.0,   # cada 24 horas
    },
}

# ── REST Framework ────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.auth.CookieJWTAuthentication',           # httpOnly cookie
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # header fallback
    ],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'api.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ── JWT (httpOnly cookies) ─────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_COOKIE':            'access_token',
    'AUTH_COOKIE_REFRESH':    'refresh_token',
    'AUTH_COOKIE_SECURE':     not DEBUG,
    'AUTH_COOKIE_HTTP_ONLY':  True,
    'AUTH_COOKIE_SAMESITE':   'Lax',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Puerta Segura v3.0 API',
    'DESCRIPTION': 'Sistema de Control de Acceso Vehicular — Universidad de Cundinamarca, Seccional Girardot.',
    'VERSION': '3.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# ── CORS ──────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS    = DEBUG
CORS_ALLOWED_ORIGINS      = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS    = True

# ── CSRF ──────────────────────────────────────────────────────────
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='http://localhost:3000').split(',')
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE    = not DEBUG

# ── Email ─────────────────────────────────────────────────────────
EMAIL_BACKEND     = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST        = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT        = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS     = True
EMAIL_HOST_USER   = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = 'Puerta Segura v3.0 <noreply@ucundinamarca.edu.co>'

# ── Static / Media ─────────────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL   = '/media/'
MEDIA_ROOT  = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LANGUAGE_CODE = 'es-co'
TIME_ZONE     = 'America/Bogota'
USE_I18N = True
USE_TZ   = True

# ── Constantes del sistema ─────────────────────────────────────────
MAX_LOGIN_ATTEMPTS     = 5
LOCKOUT_DURATION_MINUTES = 5
QR_VALIDITY_DAYS       = 365
PROLONGED_STAY_HOURS   = 4
STATS_CACHE_SECONDS    = 30   # TTL de caché para estadísticas
