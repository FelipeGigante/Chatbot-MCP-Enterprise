from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "rag_tasks", 
    broker=settings.CELERY_BROKER_URL, 
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    enable_utc=True,
    timezone='America/Sao_Paulo',
    imports=('app.services.rag_service',), 
    
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
)