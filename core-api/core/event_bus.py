import aio_pika
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

async def publish_event(routing_key: str, data: dict):
    """
    Publica un evento en RabbitMQ de forma asíncrona.
    Si RabbitMQ no está disponible, loguea el error pero NO rompe el flujo principal.
    """
    try:
        # Conectarse a RabbitMQ usando la URL de config.py
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        
        async with connection:
            channel = await connection.channel()
            
            # Declaramos la cola para asegurarnos que existe (durable=True)
            await channel.declare_queue(routing_key, durable=True)
            
            # Publicar el mensaje
            await channel.default_exchange.publish(
                aio_pika.Message(
                    body=json.dumps(data).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                ),
                routing_key=routing_key
            )
            logger.info(f"🐰 Evento publicado en '{routing_key}': {data.get('venta_id', 'sin_id')}")
            
    except Exception as e:
        # IMPORTANTE: Capturamos cualquier error para que la venta NO falle si Rabbit está caído
        logger.error(f"❌ Error publicando evento RabbitMQ: {str(e)}")