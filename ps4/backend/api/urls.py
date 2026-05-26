from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('users',          views.UserViewSet,          basename='user')
router.register('vehiculos',      views.VehiculoViewSet,      basename='vehiculo')
router.register('historial',      views.HistorialViewSet,     basename='historial')
router.register('lista-negra',    views.ListaNegraViewSet,    basename='lista-negra')
router.register('visitantes',     views.VisitanteViewSet,     basename='visitante')
router.register('notificaciones', views.NotificacionViewSet,  basename='notificacion')
router.register('auditoria',      views.AuditoriaViewSet,     basename='auditoria')

urlpatterns = [
    path('', include(router.urls)),
    # Auth
    path('auth/login/',   views.login),
    path('auth/logout/',  views.logout),
    path('auth/me/',      views.me),
    path('auth/registro/', views.registro_estudiante),
    # Control de acceso
    path('acceso/qr/',    views.escanear_qr),
    path('acceso/placa/', views.verificar_placa),
    path('acceso/salida/',views.registrar_salida),
    path('barrera/',      views.barrera),
    # Dashboard y reportes
    path('stats/',        views.stats),
    path('stats/heatmap/',views.heatmap_data),
    path('reporte/',      views.reporte_resumen),
    # Exportaciones (rutas únicas, fuera del router)
    path('exportar/historial-pdf/',   views.exportar_historial_pdf),
    path('exportar/auditoria-excel/', views.exportar_auditoria_excel),
]