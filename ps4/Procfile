web: cd backend && python manage.py migrate && python manage.py init_data 2>/dev/null; daphne -b 0.0.0.0 -p $PORT config.asgi:application
worker: cd backend && celery -A config worker -l info -c 2
