import aio_pika
import json
import logging
from typing import Optional
from contextvars import ContextVar
from core.config import settings

logger = logging.getLogger(__name__)

# Context var para tracking de Request ID en contexto asíncrono
request_id_ctx: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


def set_request_id(request_id: str):
    """Establece el Request ID en el contexto actual"""
    request_id_ctx.set(request_id)


def get_request_id() -> Optional[str]:
    """Obtiene el Request ID del contexto actual"""
    return request_id_ctx.get()


async def publish_event(routing_key: str, data: dict, request_id: Optional[str] = None):
    """
    Publica un evento en RabbitMQ de forma asíncrona con tracking de Request ID.
    
    🔍 TRAZABILIDAD DISTRIBUIDA:
    - Propaga el X-Request-ID desde la API hasta RabbitMQ
    - Permite rastrear el flujo completo: Frontend → API → Worker
    
    Si RabbitMQ no está disponible, loguea el error pero NO rompe el flujo principal.
    """
    try:
        # Obtener Request ID del contexto si no se provee explícitamente
        if request_id is None:
            request_id = get_request_id()
        
        # Agregar Request ID a los datos del mensaje
        enriched_data = {
            **data,
            "_request_id": request_id,  # Metadata para trazabilidad
            "_source": "nexus_pos_api",
            "_timestamp": json.dumps({"$date": "now"})  # MongoDB-like timestamp
        }
        
        # Conectarse a RabbitMQ usando la URL de config.py
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        
        async with connection:
            channel = await connection.channel()
            
            # Declaramos la cola para asegurarnos que existe (durable=True)
            await channel.declare_queue(routing_key, durable=True)
            
            # Headers del mensaje con Request ID
            headers = {
                "x-request-id": request_id or "unknown",
                "x-source": "nexus_pos_api",
            }
            
            # Publicar el mensaje
            await channel.default_exchange.publish(
                aio_pika.Message(
                    body=json.dumps(enriched_data).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    headers=headers,  # 🆕 Propagación de Request ID
                ),
                routing_key=routing_key
            )
            logger.info(
                f"🐰 Evento publicado en '{routing_key}' [Request-ID: {request_id}]: "
                f"{data.get('venta_id', 'sin_id')}"
            )
            
    except Exception as e:
        # IMPORTANTE: Capturamos cualquier error para que la venta NO falle si Rabbit está caído
        logger.error(
            f"❌ Error publicando evento RabbitMQ [Request-ID: {request_id}]: {str(e)}"
        )