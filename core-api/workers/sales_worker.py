"""
🐰 WORKER DE VENTAS - MÓDULO 3: SISTEMA NERVIOSO

RESPONSABILIDADES:
1. Consumir eventos 'sales.created' desde RabbitMQ
2. Escribir en PostgreSQL (Venta + DetalleVenta)
3. Actualizar stock en tabla productos
4. Registrar movimiento en inventory_ledger

FLUJO:
- Checkout endpoint reserva en Redis y publica evento
- Este worker escucha RabbitMQ
- Procesa async sin bloquear el POS
- Si falla, reintenta con dead letter queue
"""

import json
import asyncio
from uuid import UUID
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from core.config import settings
from core.event_bus import EventConsumer
from models import Venta, DetalleVenta, Producto, InventoryLedger


# =============================================================================
# CONFIGURACIÓN DE BASE DE DATOS
# =============================================================================
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

async_session_maker = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# =============================================================================
# HANDLER: PROCESAR VENTA DESDE EVENTO
# =============================================================================
async def process_sale_event(event_data: Dict[str, Any]) -> None:
    """
    Procesa un evento de venta:
    1. Crea registro en tabla Venta
    2. Crea registros en DetalleVenta
    3. Actualiza stock en tabla Producto
    4. Registra movimientos en InventoryLedger
    """
    async with async_session_maker() as session:
        try:
            # =========================================================
            # PASO 1: CREAR VENTA (CABECERA)
            # =========================================================
            nueva_venta = Venta(
                tienda_id=UUID(event_data['tienda_id']),
                total=event_data['total'],
                metodo_pago=event_data['metodo_pago'],
                fecha=datetime.fromisoformat(event_data['timestamp'])
            )
            
            session.add(nueva_venta)
            await session.flush()  # Obtener ID de venta
            
            # =========================================================
            # PASO 2: CREAR DETALLES Y ACTUALIZAR STOCK
            # =========================================================
            for item in event_data['items']:
                # Crear detalle de venta
                detalle = DetalleVenta(
                    venta_id=nueva_venta.id,
                    producto_id=UUID(item['producto_id']),
                    cantidad=item['cantidad'],
                    precio_unitario=item['precio_unitario'],
                    subtotal=item['subtotal']
                )
                session.add(detalle)
                
                # Actualizar stock en tabla productos
                statement = select(Producto).where(
                    Producto.id == UUID(item['producto_id'])
                )
                result = await session.execute(statement)
                producto = result.scalar_one_or_none()
                
                if producto:
                    stock_anterior = producto.stock_actual
                    producto.stock_actual -= item['cantidad']
                    session.add(producto)
                    
                    # =====================================================
                    # PASO 3: REGISTRAR EN INVENTORY LEDGER
                    # =====================================================
                    ledger_entry = InventoryLedger(
                        producto_id=producto.id,
                        tienda_id=nueva_venta.tienda_id,
                        tipo_movimiento='VENTA',
                        cantidad=-item['cantidad'],  # Negativo porque es salida
                        stock_anterior=stock_anterior,
                        stock_nuevo=producto.stock_actual,
                        referencia_tipo='VENTA',
                        referencia_id=str(nueva_venta.id),
                        descripcion=f"Venta #{nueva_venta.id} - {item['producto_nombre']} (SKU: {item['producto_sku']})"
                    )
                    session.add(ledger_entry)
            
            # =========================================================
            # PASO 4: COMMIT TRANSACCIÓN
            # =========================================================
            await session.commit()
            
            print(f"✅ Venta {nueva_venta.id} procesada exitosamente desde evento")
            print(f"   📊 Total: ${nueva_venta.total:.2f}")
            print(f"   📦 Items: {len(event_data['items'])}")
            print(f"   💳 Método: {nueva_venta.metodo_pago}")
        
        except Exception as e:
            await session.rollback()
            print(f"❌ Error procesando venta: {e}")
            raise  # Esto hará que RabbitMQ reintente o envíe a DLQ


# =============================================================================
# CALLBACK DE RABBITMQ
# =============================================================================
def handle_sale_created(ch, method, properties, body):
    """
    Callback síncrono de Pika - ejecuta handler async
    """
    try:
        event_data = json.loads(body)
        print(f"\n🔔 Evento recibido: sales.created")
        print(f"   Tienda: {event_data.get('tienda_id')}")
        print(f"   Total: ${event_data.get('total', 0):.2f}")
        
        # Ejecutar handler async en event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(process_sale_event(event_data))
        loop.close()
        
        # ACK manual después de procesar exitosamente
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"❌ Error en handler: {e}")
        # NACK para que RabbitMQ reintente o envíe a DLQ
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


# =============================================================================
# MAIN: INICIAR WORKER
# =============================================================================
def main():
    """
    Inicia el worker y escucha eventos de RabbitMQ
    """
    print("\n" + "="*70)
    print("🐰 SALES WORKER - Sistema Nervioso Blend POS")
    print("="*70)
    print(f"📡 Conectando a RabbitMQ: {settings.RABBITMQ_URL}")
    print(f"💾 Conectando a PostgreSQL: {settings.DATABASE_URL.split('@')[1]}")
    print("🎯 Escuchando eventos: sales.created")
    print("="*70 + "\n")
    
    # Crear consumer de eventos
    consumer = EventConsumer()
    
    # Configurar subscripción
    consumer.subscribe(
        event_type='sales.created',
        callback=handle_sale_created
    )
    
    print("✅ Worker iniciado - Presiona Ctrl+C para detener\n")
    
    try:
        # Iniciar consumo (blocking)
        consumer.start()
    except KeyboardInterrupt:
        print("\n\n⏹️  Deteniendo worker...")
        consumer.stop()
        print("✅ Worker detenido correctamente")


if __name__ == "__main__":
    main()
