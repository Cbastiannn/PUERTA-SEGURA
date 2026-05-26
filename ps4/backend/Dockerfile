FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config default-libmysqlclient-dev gcc curl && \
    rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput 2>/dev/null || true
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/stats/ || exit 1
CMD ["sh", "-c", "python manage.py migrate && python manage.py init_data 2>/dev/null; daphne -b 0.0.0.0 -p 8000 config.asgi:application"]
