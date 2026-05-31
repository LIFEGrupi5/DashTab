# Minimal, non-root image (consistent with DO-2/DO-9 hardening).
FROM python:3.12-alpine

# Create a non-root user with a FIXED NUMERIC uid. The uid must be numeric (not
# just a name) so Kubernetes' runAsNonRoot check can verify it isn't root.
RUN addgroup -S aiops && adduser -S -u 10001 -G aiops aiops

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

USER 10001
EXPOSE 8080

# 2 workers is plenty — alert volume is tiny; gunicorn for a real WSGI server.
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "60", "app:app"]
