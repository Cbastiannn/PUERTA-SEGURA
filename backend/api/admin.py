from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Vehiculo, RegistroAcceso, ListaNegra, Visitante, EstadoBarrera, Auditoria, Notificacion

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username','email','get_full_name','role','access_point','is_active','login_attempts']
    list_filter = ['role','is_active']
    search_fields = ['email','first_name','last_name']
    fieldsets = UserAdmin.fieldsets + (('Puerta Segura', {'fields': ('role','access_point','phone','login_attempts','locked_until')}),)

@admin.register(Vehiculo)
class VehiculoAdmin(admin.ModelAdmin):
    list_display = ['placa','propietario','tipo','marca','activo','dias_vigencia','creado_en']
    list_filter = ['tipo','activo']
    search_fields = ['placa','propietario','marca']

@admin.register(RegistroAcceso)
class RegistroAccesoAdmin(admin.ModelAdmin):
    list_display = ['placa','propietario','movimiento','metodo','estado','timestamp']
    list_filter = ['estado','movimiento','metodo']
    search_fields = ['placa','propietario']

@admin.register(ListaNegra)
class ListaNegraAdmin(admin.ModelAdmin):
    list_display = ['placa','razon','motivo','agregado_por','agregado_en','activo']

admin.site.register(Visitante)
admin.site.register(EstadoBarrera)
admin.site.register(Auditoria)
admin.site.register(Notificacion)
