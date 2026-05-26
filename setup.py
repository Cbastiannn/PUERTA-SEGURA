#!/usr/bin/env python3
"""PUERTA SEGURA v3.0 — Setup automático. Ejecutar: python setup.py"""
import os, sys, subprocess, shutil, socket

BASE  = os.path.dirname(os.path.abspath(__file__))
BACK  = os.path.join(BASE, 'backend')
FRONT = os.path.join(BASE, 'frontend')
IS_WIN= sys.platform == 'win32'
PIP   = os.path.join(BACK, 'venv', 'Scripts' if IS_WIN else 'bin', 'pip')
PY    = os.path.join(BACK, 'venv', 'Scripts' if IS_WIN else 'bin', 'python')

def run(cmd, cwd=None): print(f"  → {cmd[:70]}"); subprocess.run(cmd, shell=True, cwd=cwd)

def redis_running():
    try:
        s = socket.socket(); s.settimeout(1); s.connect(('localhost', 6379)); s.close(); return True
    except: return False

print("\n" + "═"*56)
print("  🛡️  PUERTA SEGURA v3.0 — Setup automático")
print("  Universidad de Cundinamarca · Seccional Girardot")
print("═"*56 + "\n")

# .env
env_dst = os.path.join(BACK, '.env')
if not os.path.exists(env_dst):
    shutil.copy(os.path.join(BASE, '.env.example'), env_dst)
    print("📝 backend/.env creado — edita con tu config de MySQL")
    input("   Presiona Enter cuando hayas guardado... ")

# venv
if not os.path.exists(os.path.join(BACK, 'venv')):
    print("\n📦 Creando entorno virtual..."); run('python -m venv venv', cwd=BACK)

run(f'"{PIP}" install -r requirements.txt', cwd=BACK)

# Detectar Redis
has_redis = redis_running()
if has_redis:
    print("\n✅ Redis detectado — WebSockets en tiempo real activados")
    env_setting = 'config.settings'
else:
    print("\n⚠️  Redis NO detectado — usando modo fallback (sin WebSockets)")
    print("   Para activar tiempo real: instala Redis o usa docker-compose")
    env_setting = 'config.settings_fallback'
    # Parchear .env para usar settings fallback
    with open(env_dst, 'a') as f:
        f.write(f'\n# Auto-detectado: sin Redis\nDJANGO_SETTINGS_MODULE={env_setting}\n')

run(f'"{PY}" manage.py migrate', cwd=BACK)
run(f'"{PY}" manage.py init_data', cwd=BACK)
run('npm install', cwd=FRONT)

print("\n" + "═"*56)
print("✅ INSTALACIÓN COMPLETADA")
print("═"*56)

if IS_WIN:
    print(f"""
Inicia con 2 terminales:
  T1 (servidor):  cd backend && venv\\Scripts\\activate && daphne -p 8000 config.asgi:application
  T2 (frontend):  cd frontend && npm start
""")
else:
    print(f"""
Inicia con 2 terminales:
  T1 (servidor):  cd backend && source venv/bin/activate && daphne -p 8000 config.asgi:application
  T2 (frontend):  cd frontend && npm start
""")

if has_redis:
    print("  T3 (celery):  cd backend && celery -A config worker -l info  ← emails + alertas")

print("🌐 http://localhost:3000")
print("🔑 admin@ucundinamarca.edu.co / Admin2026!\n")
