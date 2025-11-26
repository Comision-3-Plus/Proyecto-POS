"""
Worker de Facturación AFIP con Retry
Procesa facturas de RabbitMQ con exponential backoff
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID
import aio_pika
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from core.config import settings
from core.db import async_session
from services.afip_service import AFIPService, AFIPException, AFIPTimeoutException
from models import Factura, Venta


logger = logging.getLogger(__name__)


class AFIPWorker:
    """
    Worker que procesa facturas AFIP desde RabbitMQ
    """
    
    def __init__(self):
        self.afip_service = AFIPService()
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.queue: Optional[aio_pika.Queue] = None
    
    async def start(self):
        """Iniciar worker"""
        logger.info("🚀 Iniciando AFIP Worker...")
        
        # Conectar a RabbitMQ
        self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        self.channel = await self.connection.channel()
        
        # Configurar QoS (procesar de a 1 mensaje)
        await self.channel.set_qos(prefetch_count=1)
        
        # Declarar cola principal
        self.queue = await self.channel.declare_queue(
            "afip.facturacion",
            durable=True,
            arguments={
                # Dead Letter Exchange para mensajes fallidos
                "x-dead-letter-exchange": "afip.dlx",
                "x-dead-letter-routing-key": "afip.failed",
                # TTL de 30 días
                "x-message-ttl": 30 * 24 * 60 * 60 * 1000,
            }
        )
        
        # Declarar Dead Letter Queue
        dlx = await self.channel.declare_exchange(
            "afip.dlx",
            aio_pika.ExchangeType.DIRECT,
            durable=True
        )
        
        dlq = await self.channel.declare_queue(
            "afip.facturacion.failed",
            durable=True
        )
        
        await dlq.bind(dlx, routing_key="afip.failed")
        
        logger.info(f"✅ Worker conectado a RabbitMQ: {settings.RABBITMQ_URL}")
        logger.info(f"📬 Escuchando cola: afip.facturacion")
        
        # Procesar mensajes
        await self.queue.consume(self._process_message)
        
        logger.info("⏳ Esperando mensajes... (Ctrl+C para salir)")
        
        # Mantener vivo
        try:
            await asyncio.Future()
        finally:
            await self.stop()
    
    async def stop(self):
        """Detener worker gracefully"""
        logger.info("🛑 Deteniendo AFIP Worker...")
        
        if self.connection:
            await self.connection.close()
        
        logger.info("✅ Worker detenido correctamente")
    
    async def _process_message(self, message: aio_pika.IncomingMessage):
        """
        Procesar mensaje de facturación
        """
        async with message.process():
            try:
                # Parsear mensaje
                import json
                data = json.loads(message.body.decode())
                
                venta_id = UUID(data["venta_id"])
                tienda_id = UUID(data["tienda_id"])
                
                logger.info(f"📥 Procesando factura para venta {venta_id}")
                
                # Procesar con retry
                await self._process_factura_with_retry(venta_id, tienda_id)
                
                logger.info(f"✅ Factura procesada correctamente: {venta_id}")
                
            except Exception as e:
                logger.error(f"❌ Error procesando mensaje: {e}", exc_info=True)
                # El mensaje irá a Dead Letter Queue automáticamente
                raise
    
    @retry(
        retry=retry_if_exception_type(AFIPTimeoutException),
        wait=wait_exponential(multiplier=2, min=2, max=60),  # 2s, 4s, 8s, 16s, 32s, 60s
        stop=stop_after_attempt(6),  # 6 intentos = ~2 minutos de reintentos
        reraise=True
    )
    async def _process_factura_with_retry(self, venta_id: UUID, tienda_id: UUID):
        """
        Procesar factura con retry exponencial
        """
        async with async_session() as session:
            # Obtener venta
            result = await session.execute(
                select(Venta).where(Venta.id == venta_id)
            )
            venta = result.scalar_one_or_none()
            
            if not venta:
                logger.error(f"❌ Venta no encontrada: {venta_id}")
                return
            
            # Verificar si ya tiene CAE
            result = await session.execute(
                select(Factura).where(Factura.venta_id == venta_id)
            )
            factura = result.scalar_one_or_none()
            
            if factura and factura.cae:
                logger.info(f"⚠️  Venta ya facturada: {venta_id} (CAE: {factura.cae})")
                return
            
            try:
                # Solicitar CAE a AFIP
                logger.info(f"📡 Solicitando CAE a AFIP para venta {venta_id}...")
                
                cae_data = await self.afip_service.autorizar_comprobante(
                    tienda_id=tienda_id,
                    tipo_comprobante="factura_b",
                    punto_venta=1,
                    total=float(venta.total),
                    items=[],  # Se obtienen de venta.items
                )
                
                # Guardar factura con CAE
                if not factura:
                    factura = Factura(
                        venta_id=venta_id,
                        tienda_id=tienda_id,
                        tipo_comprobante="B",
                        punto_venta=1,
                        numero=cae_data["numero_comprobante"],
                        cae=cae_data["cae"],
                        cae_vencimiento=cae_data["cae_vencimiento"],
                        fecha_emision=datetime.utcnow(),
                        total=venta.total,
                    )
                    session.add(factura)
                else:
                    factura.cae = cae_data["cae"]
                    factura.cae_vencimiento = cae_data["cae_vencimiento"]
                    factura.numero = cae_data["numero_comprobante"]
                
                await session.commit()
                
                logger.info(f"✅ CAE obtenido: {cae_data['cae']} (Vence: {cae_data['cae_vencimiento']})")
                
                # Enviar CAE por email
                await self._send_cae_email(venta, factura)
                
            except AFIPTimeoutException as e:
                logger.warning(f"⏱️  AFIP timeout, reintentando... ({e})")
                raise  # Trigger retry
            
            except AFIPException as e:
                logger.error(f"❌ Error AFIP (no reintentable): {e}")
                
                # Activar modo CAEA si está disponible
                if await self._should_use_caea():
                    await self._process_with_caea(venta, session)
                else:
                    raise
    
    async def _should_use_caea(self) -> bool:
        """
        Verificar si se debe usar CAEA (modo contingencia)
        """
        # Lógica:
        # - AFIP caído por más de 5 minutos
        # - Hay CAEA quincenales disponibles
        # - No pasó la fecha de vencimiento del CAEA
        
        # TODO: Implementar lógica completa
        return False
    
    async def _process_with_caea(self, venta: Venta, session: AsyncSession):
        """
        Procesar factura con CAEA (modo contingencia)
        """
        logger.info(f"🚨 Usando CAEA para venta {venta.id}")
        
        # Obtener CAEA vigente
        # TODO: Implementar
        caea = "12345678901234"  # Ejemplo
        
        # Crear factura con CAEA
        factura = Factura(
            venta_id=venta.id,
            tienda_id=venta.tienda_id,
            tipo_comprobante="B",
            punto_venta=1,
            numero=0,  # Se asignará después
            caea=caea,
            fecha_emision=datetime.utcnow(),
            total=venta.total,
            es_contingencia=True,
        )
        
        session.add(factura)
        await session.commit()
        
        logger.info(f"✅ Factura con CAEA creada: {caea}")
        
        # Agregar a cola de facturas diferidas
        await self._queue_deferred_invoice(venta.id)
    
    async def _queue_deferred_invoice(self, venta_id: UUID):
        """
        Agregar factura a cola de diferidas (para enviar a AFIP cuando vuelva)
        """
        logger.info(f"📬 Agregando venta {venta_id} a cola diferida")
        
        # Publicar a cola diferida
        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps({"venta_id": str(venta_id)}).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key="afip.deferred",
        )
    
    async def _send_cae_email(self, venta: Venta, factura: Factura):
        """
        Enviar email con CAE al cliente
        """
        logger.info(f"📧 Enviando CAE por email para venta {venta.id}")
        
        # TODO: Implementar envío de email
        # from services.email_service import EmailService
        # await EmailService.send_cae(venta, factura)


# =====================================================
# CLI para ejecutar worker
# =====================================================

async def main():
    """Entry point"""
    worker = AFIPWorker()
    await worker.start()


if __name__ == "__main__":
    import sys
    
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("afip_worker.log"),
        ]
    )
    
    # Run worker
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Worker detenido por usuario")
