import aio_pika
import pika
import json
import logging
from typing import Optional, Dict, Any, Callable
from contextvars import ContextVar
from contextlib import contextmanager
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


# =====================================================
# SYNC EVENT PUBLISHER (Para Módulo 3 - Event-Driven)
# =====================================================

class SyncEventPublisher:
    """
    Publisher síncrono para arquitectura Event-Driven
    
    Usado en endpoints donde necesitamos publicar eventos de forma bloqueante
    para garantizar que el mensaje se envió antes de responder al cliente
    """
    
    def __init__(self, rabbitmq_url: str = None):
        self.rabbitmq_url = rabbitmq_url or settings.RABBITMQ_URL
        self.connection = None
        self.channel = None
        self._connect()
    
    def _connect(self):
        """Establece conexión con RabbitMQ"""
        try:
            parameters = pika.URLParameters(self.rabbitmq_url)
            parameters.heartbeat = 600
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declarar el Exchange principal
            self.channel.exchange_declare(
                exchange='blend_events',
                exchange_type='topic',
                durable=True
            )
            
            logger.info("✅ SyncEventPublisher conectado a RabbitMQ")
            
        except Exception as e:
            logger.error(f"❌ Error conectando SyncEventPublisher: {e}")
            raise
    
    def publish(self, routing_key: str, payload: Dict[str, Any], exchange: str = 'blend_events'):
        """Publica un evento de forma síncrona"""
        try:
            message = json.dumps(payload, default=str)
            
            self.channel.basic_publish(
                exchange=exchange,
                routing_key=routing_key,
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            
            logger.info(f"🐇 Evento publicado: {routing_key}")
            
        except Exception as e:
            logger.error(f"❌ Error publicando evento {routing_key}: {e}")
            raise
    
    def publish_sale_created(self, sale_data: Dict[str, Any]):
        """Publica evento de venta creada"""
        self.publish('sales.created', sale_data)
    
    def close(self):
        """Cierra la conexión"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()


@contextmanager
def sync_event_publisher():
    """Context manager para el publisher síncrono"""
    publisher = SyncEventPublisher()
    try:
        yield publisher
    finally:
        publisher.close()


# =====================================================
# EVENT CONSUMER (Para Workers)
# =====================================================

class EventConsumer:
    """
    Consumer síncrono para workers que procesan eventos
    
    Escucha eventos de RabbitMQ y ejecuta callbacks
    Soporta ACK manual y reintento automático
    """
    
    def __init__(self, rabbitmq_url: str = None):
        self.rabbitmq_url = rabbitmq_url or settings.RABBITMQ_URL
        self.connection = None
        self.channel = None
        self.subscriptions = []
        self._connect()
    
    def _connect(self):
        """Establece conexión con RabbitMQ"""
        try:
            parameters = pika.URLParameters(self.rabbitmq_url)
            parameters.heartbeat = 600
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declarar el Exchange principal
            self.channel.exchange_declare(
                exchange='blend_events',
                exchange_type='topic',
                durable=True
            )
            
            # Configurar QoS para procesar 1 mensaje a la vez
            self.channel.basic_qos(prefetch_count=1)
            
            logger.info("✅ EventConsumer conectado a RabbitMQ")
            
        except Exception as e:
            logger.error(f"❌ Error conectando EventConsumer: {e}")
            raise
    
    def subscribe(self, event_type: str, callback: Callable, exchange: str = 'blend_events'):
        """
        Suscribe a un tipo de evento
        
        Args:
            event_type: Routing key del evento (ej: 'sales.created')
            callback: Función que procesa el mensaje
            exchange: Exchange de RabbitMQ
        """
        # Crear cola única para este evento
        queue_name = f"queue.{event_type}"
        
        # Declarar cola durable con DLQ
        self.channel.queue_declare(
            queue=queue_name,
            durable=True,
            arguments={
                'x-dead-letter-exchange': f'{exchange}.dlx',
                'x-message-ttl': 86400000  # 24 horas
            }
        )
        
        # Bind cola al exchange con routing key
        self.channel.queue_bind(
            exchange=exchange,
            queue=queue_name,
            routing_key=event_type
        )
        
        # Configurar consumidor con ACK manual
        self.channel.basic_consume(
            queue=queue_name,
            on_message_callback=callback,
            auto_ack=False  # ACK manual para control de errores
        )
        
        self.subscriptions.append(event_type)
        logger.info(f"✅ Suscrito a eventos: {event_type}")
    
    def start(self):
        """Inicia el consumo de mensajes (blocking)"""
        try:
            logger.info(f"🎯 Iniciando consumo de {len(self.subscriptions)} evento(s)")
            self.channel.start_consuming()
        except KeyboardInterrupt:
            self.stop()
    
    def stop(self):
        """Detiene el consumer"""
        if self.channel:
            self.channel.stop_consuming()
        if self.connection and not self.connection.is_closed:
            self.connection.close()
        logger.info("✅ EventConsumer detenido")