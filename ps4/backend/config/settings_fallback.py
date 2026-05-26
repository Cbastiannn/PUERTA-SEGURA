"""
settings_fallback.py — Configuración sin Redis (solo para desarrollo local sin Docker).
Usar con: DJANGO_SETTINGS_MODULE=config.settings_fallback
"""
from .settings import *

# Caché en memoria (sin Redis)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'puerta-segura-cache',
    }
}

# Channels en memoria (WebSockets funcionales pero solo en un proceso)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

# Celery en modo eager (tareas se ejecutan síncronamente, sin worker)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
