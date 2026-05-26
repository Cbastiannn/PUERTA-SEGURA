# 🛡️ PUERTA SEGURA v3.0
### Sistema de Control de Acceso Vehicular — Versión Premium

**Universidad de Cundinamarca · Seccional Girardot · Ingeniería de Software**  
**Autores:** Sebastián D. Uribe C. & Andrés F. Castañeda

---

## 🚀 Mejoras v3.0 vs v2.0

| Categoría | v2.0 | v3.0 |
|-----------|------|------|
| **Tiempo real** | Polling cada 15-30s | **WebSockets** (instantáneo) |
| **Emails** | `threading` frágil | **Celery** con reintentos automáticos |
| **Caché** | Ninguna | **Redis** — stats en 1ms |
| **Auth** | JWT en body/localStorage | **httpOnly cookies** (antiXSS) |
| **Tests** | Ninguno | **37 pruebas unitarias** |
| **Frontend** | 1 archivo 1700 líneas | **Arquitectura de componentes** |
| **Estado global** | Props drilling | **React Context API** |
| **Búsqueda** | Dispara petición por tecla | **useDebounce** — petición al parar |
| **Ordenamiento** | Sin ordenar | **Click en headers** de tabla |
| **PWA** | No | **Manifest + ServiceWorker** |
| **Responsive** | Solo escritorio | **Móvil + tablet + escritorio** |
| **Logs** | Console.log | **Python logging** + **Celery Beat** |
| **Tareas programadas** | No | Alertas cada 5min + reporte semanal |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────┐
│                  React v3.0 (PWA)                │
│   Context  │  Hooks  │  Componentes  │  WebSocket│
└─────────────────────┬───────────────────────────┘
                       │ HTTP REST + WebSocket
┌─────────────────────▼───────────────────────────┐
│         Django 4.2 + Channels (ASGI)             │
│  REST API  │  JWT Cookies  │  WebSocket consumers│
└──────┬──────────────┬────────────────────────────┘
       │              │
┌──────▼──────┐ ┌─────▼──────────────────────────┐
│  MySQL 8.0  │ │        Redis 7                  │
│  8 modelos  │ │  Cache │ Channels │ Celery broker│
└─────────────┘ └────────────────────────────────┘
                          │
                ┌─────────▼──────────────┐
                │     Celery Workers     │
                │  Email QR │ Alertas   │
                │  Reporte semanal       │
                └────────────────────────┘
```

---

## 💻 Instalación local

### Opción A — Docker (todo en un comando)
```bash
docker-compose up --build
# Abre http://localhost:8000
```
Levanta: MySQL + Redis + Django + Celery automáticamente.

### Opción B — Manual (sin Docker)

**Requisitos adicionales:** Redis instalado localmente  
Windows: [redis.io/docs/getting-started/installation/install-redis-on-windows](https://redis.io/docs/getting-started/installation/install-redis-on-windows)  
Mac: `brew install redis && brew services start redis`

```bash
# 1. MySQL: File → Open SQL Script → database/puerta_segura.sql → Ejecutar

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate                           # Windows
pip install -r requirements.txt
cp ../.env.example .env  # Editar con tu config
python manage.py migrate
python manage.py init_data

# Terminal 1: servidor
daphne -p 8000 config.asgi:application

# Terminal 2: Celery workers (emails, alertas)
celery -A config worker -l info

# Terminal 3: Celery Beat (tareas programadas)
celery -A config beat -l info

# 3. Frontend
cd frontend && npm install && npm start
```

---

## 🧪 Pruebas unitarias

```bash
cd backend
pip install pytest pytest-django pytest-cov
pytest -v --cov=api --cov-report=term-missing
```

**37 pruebas cubren:**
- Autenticación (login, logout, bloqueo de cuenta)
- Validación de placas colombianas
- CRUD de vehículos con permisos
- Control de acceso (QR, manual, lista negra)
- Barrera y estadísticas
- Modelos (QR, vigencia, auditoría)

---

## ⚡ WebSockets en tiempo real

El dashboard se actualiza instantáneamente sin recargar:

```
wss://tu-app.railway.app/ws/dashboard/      → Stats del sistema
wss://tu-app.railway.app/ws/notifications/  → Notificaciones personales
wss://tu-app.railway.app/ws/barrier/        → Estado de la barrera
```

El indicador 🟢 en el topbar muestra si la conexión WebSocket está activa.

---

## 📦 Tareas Celery programadas

| Tarea | Frecuencia | Descripción |
|-------|-----------|-------------|
| `verificar_permanencia_prolongada` | Cada 5 min | Detecta vehículos con >4h en campus |
| `enviar_reporte_semanal` | Cada 7 días | PDF semanal a todos los admins |
| `enviar_qr_por_correo` | Al crear/renovar | Email con QR adjunto (con 3 reintentos) |

---

## 🔌 API REST

Ver documentación interactiva en: **`/api/docs/`** (Swagger UI)

---

*v3.0 · Proyecto académico · Universidad de Cundinamarca · 2026*
