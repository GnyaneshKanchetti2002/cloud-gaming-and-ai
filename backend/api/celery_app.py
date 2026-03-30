# backend/api/celery_app.py
import os
from celery import Celery

# Fallback to 'redis' (Docker service name) for dev, Render ENV for prod
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['api.tasks'] 
)

celery_app.conf.update(
    task_track_started=True,
    broker_connection_retry_on_startup=True
)