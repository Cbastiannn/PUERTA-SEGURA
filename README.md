# 🛡️ PUERTA SEGURA v3.0
### Sistema de Control de Acceso Vehicular

**Universidad de Cundinamarca · Seccional Girardot · Ingeniería de Software**  
**Autores:** Sebastián D. Uribe C. & Andrés F. Castañeda  
**Repositorio:** https://github.com/Cbastiannn/PUERTA-SEGURA

---

## 📋 Descripción

Puerta Segura v3.0 es un sistema académico de control de acceso vehicular para la Universidad de Cundinamarca. Permite registrar vehículos con código QR, verificar accesos en tiempo real, gestionar listas negras y generar reportes completos.

---

## 👥 Roles del Sistema

| Rol | Acceso |
|-----|--------|
| **Vigilante** | Dashboard, Vehículos (CRUD), Control de Acceso, Historial, Lista Negra, Visitantes, Reportes, Usuarios, Auditoría |
| **Estudiante** | Registro de vehículos, Ver QR, Mi cuenta |

---

## 🚀 Funcionalidades Principales

- 🔒 **Control de acceso** por QR (cámara real) y placa manual
- 📱 **Código QR** con hash SHA-256, vigencia 365 días
- 📊 **Dashboard** con estadísticas en tiempo real via WebSockets
- 🚫 **Lista negra** con alertas automáticas
- 👥 **Control de visitantes** con alertas de permanencia
- 📋 **Historial** exportable a Excel, CSV y PDF
- 📈 **Reportes ejecutivos** por rango de fechas
- 🎓 **Registro público** de estudiantes sin autenticación previa
- 🔊 **Feedback sonoro** al escanear QR
- 📱 **PWA** instalable con soporte offline

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────┐
│                  React 18 (PWA)                  │
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
│  8 tablas   │ │  Cache │ Channels │ Celery broker│
└─────────────┘ └────────────────────────────────┘
```

---

## 💻 Instalación Local (Windows)

### Requisitos
- Python 3.11+
- Node.js 18+
- MySQL 8.0
- MySQL Workbench

### Paso 1 — Base de datos
Abre MySQL Workbench → File → Open SQL Script → selecciona `database/puerta_segura.sql` → ejecutar con ⚡

### Paso 2 — Backend
```bash
cd ps4/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate --fake-initial
python manage.py init_data
python manage.py runserver
```

### Paso 3 — Frontend
```bash
cd ps4/frontend
npm install
npm install jsqr
npm start
```

Abre **http://localhost:3000**

---

## 🔑 Credenciales de Demo

| Rol | Correo | Contraseña |
|-----|--------|-----------|
| Vigilante | vigilante@ucundinamarca.edu.co | Vigil2026! |
| Admin | admin@ucundinamarca.edu.co | Admin2026! |
| Estudiante | estudiante@ucundinamarca.edu.co | Est2026! |

---

## 🔌 API REST — Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Iniciar sesión |
| POST | `/api/auth/registro/` | Registro público de estudiantes |
| GET | `/api/vehiculos/` | Listar vehículos |
| POST | `/api/vehiculos/` | Registrar vehículo |
| POST | `/api/acceso/qr/` | Verificar QR |
| POST | `/api/acceso/placa/` | Verificar placa manual |
| GET | `/api/stats/` | Estadísticas del dashboard |
| GET | `/api/historial/` | Historial de accesos |
| GET | `/api/lista-negra/` | Lista negra |
| GET | `/api/lista-negra/` | Lista negra |

Documentación interactiva Swagger: **`http://localhost:8000/api/docs/`**

---

## 🗄️ Base de Datos

8 tablas: `usuarios`, `vehiculos`, `registros_acceso`, `lista_negra`, `visitantes`, `estado_barrera`, `auditoria`, `notificaciones`

- Trigger automático en lista negra
- 2 vistas optimizadas
- Índices en campos de búsqueda frecuente

---

## 📁 Estructura del Proyecto

```
PUERTA-SEGURA/
├── ps4/
│   ├── backend/
│   │   ├── api/
│   │   │   ├── models.py       — 8 modelos Django
│   │   │   ├── views.py        — Endpoints REST
│   │   │   ├── serializers.py  — Serialización JSON
│   │   │   ├── urls.py         — Rutas API
│   │   │   ├── consumers.py    — WebSocket consumers
│   │   │   └── tasks.py        — Tareas Celery
│   │   └── config/
│   │       ├── settings.py     — Configuración Django
│   │       └── asgi.py         — Servidor ASGI
│   └── frontend/src/
│       ├── App.jsx             — Landing + Roles + Paneles
│       ├── api.js              — Capa de servicios HTTP
│       ├── context/            — Estado global React
│       ├── hooks/              — Hooks personalizados
│       ├── utils/              — Tokens de diseño
│       └── components/
│           ├── Dashboard/      — Estadísticas tiempo real
│           ├── Vehicles/       — CRUD vehículos
│           ├── Access/         — Scanner QR + manual
│           ├── History/        — Historial exportable
│           ├── Blacklist/      — Lista negra
│           ├── Visitors/       — Control visitantes
│           └── Reports/        — Reportes ejecutivos
└── database/
    └── puerta_segura.sql       — Script SQL completo
```

---

## ⚡ Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| Frontend | React 18 + Recharts + jsQR |
| Base de datos | MySQL 8.0 |
| Autenticación | JWT con httpOnly cookies |
| Tiempo real | Django Channels + WebSockets |
| Tareas async | Celery + Redis |
| Despliegue | Railway + Docker |

---

*v3.0 · Proyecto de Gestión del Conocimiento · Universidad de Cundinamarca · 2026*
