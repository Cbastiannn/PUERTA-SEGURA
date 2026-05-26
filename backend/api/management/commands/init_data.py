from django.core.management.base import BaseCommand
from api.models import User, Vehiculo, ListaNegra, EstadoBarrera

class Command(BaseCommand):
    help = 'Crea datos iniciales de demostración'
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.HTTP_INFO('\n🛡️  Puerta Segura v3.0 — Init data\n'))
        admin = self._user('admin','admin@ucundinamarca.edu.co','Admin2026!','Administrador','Sistema','admin','Central',True)
        self._user('vigilante','vigilante@ucundinamarca.edu.co','Vigil2026!','Juan','García','vigilante','Entrada Principal')
        self._user('vigilante2','vigilante2@ucundinamarca.edu.co','Vigil2026!','María','López','vigilante','Entrada Norte')
        for vd in [
            dict(placa='ABC123',tipo='Automóvil',marca='Toyota',modelo='Corolla',color='Blanco',propietario='María González',correo='mgonzalez@ucundinamarca.edu.co'),
            dict(placa='XYZ789',tipo='Motocicleta',marca='Yamaha',modelo='FZ',color='Rojo',propietario='Carlos Pérez'),
            dict(placa='GHI012',tipo='Camioneta',marca='Ford',modelo='Ranger',color='Gris',propietario='Luis Martínez'),
            dict(placa='KLM34D',tipo='Motocicleta',marca='Honda',modelo='CB125',color='Azul',propietario='Pedro Sánchez'),
            dict(placa='MNO567',tipo='Automóvil',marca='Chevrolet',modelo='Spark',color='Negro',propietario='Ana Rodríguez',activo=False),
            dict(placa='PQR890',tipo='Automóvil',marca='Renault',modelo='Logan',color='Plata',propietario='Diana Torres'),
            dict(placa='STU123',tipo='Automóvil',marca='Mazda',modelo='3',color='Rojo',propietario='Roberto Silva'),
            dict(placa='VWX45D',tipo='Motocicleta',marca='Bajaj',modelo='Pulsar',color='Negro',propietario='Laura Jiménez'),
        ]:
            activo = vd.pop('activo', True)
            if not Vehiculo.objects.filter(placa=vd['placa']).exists():
                Vehiculo.objects.create(**vd, activo=activo, registrado_por=admin)
                self.stdout.write(self.style.SUCCESS(f"  ✓ {vd['placa']}"))
        if not ListaNegra.objects.filter(placa='ZZZ000').exists():
            ListaNegra.objects.create(placa='ZZZ000',razon='robo',motivo='Vehículo reportado robado. Reporte No. 20260301',agregado_por=admin)
            self.stdout.write(self.style.SUCCESS('  ✓ Lista negra: ZZZ000'))
        EstadoBarrera.get_estado()
        self.stdout.write(self.style.SUCCESS('\n✅ Datos creados.\n  Admin: admin@ucundinamarca.edu.co / Admin2026!\n'))
    def _user(self, username, email, pw, first, last, role, point, super=False):
        if User.objects.filter(email=email).exists(): return User.objects.get(email=email)
        u = User.objects.create_superuser(username,email,pw,first_name=first,last_name=last) if super else User.objects.create_user(username,email,pw,first_name=first,last_name=last)
        u.role=role; u.access_point=point; u.save(); return u
