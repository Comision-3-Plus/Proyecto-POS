"""
Script para generar actividad realista en la Verdulería de Pedrito
Crea ventas, actualiza stock, genera insights variados
"""
import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy import select
from app.core.db import get_session
from app.models import Venta, DetalleVenta, Producto, Tienda, Insight
from uuid import uuid4

async def generar_actividad():
    """Genera actividad realista para demo"""
    print("🏪 Generando actividad en Verdulería de Pedrito...")
    
    async for session in get_session():
        # 1. Obtener la tienda del usuario admin
        from app.models import User
        stmt = select(User).where(User.email == "admin@nexuspos.com")
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ No se encontró el usuario admin")
            return
        
        tienda = user.tienda
        if not tienda:
            print("❌ El usuario no tiene tienda asignada")
            return
        
        print(f"✅ Tienda encontrada: {tienda.nombre} (ID: {tienda.id})")
        
        # 2. Obtener productos disponibles
        stmt = select(Producto).where(Producto.tienda_id == tienda.id, Producto.is_active == True)
        result = await session.execute(stmt)
        productos = list(result.scalars().all())
        
        print(f"📦 {len(productos)} productos disponibles")
        
        if len(productos) < 10:
            print("⚠️  Pocos productos, agrega más para mejor demo")
            return
        
        # 3. Generar ventas de los últimos 7 días
        print("\n💰 Generando ventas de los últimos 7 días...")
        ventas_creadas = 0
        
        for dia_offset in range(7, 0, -1):  # De 7 días atrás hasta hoy
            fecha_venta = datetime.utcnow() - timedelta(days=dia_offset)
            
            # Generar entre 2 y 8 ventas por día
            num_ventas = random.randint(2, 8)
            
            for _ in range(num_ventas):
                # Seleccionar entre 1 y 5 productos para esta venta
                num_items = random.randint(1, 5)
                items_venta = random.sample(productos, num_items)
                
                # Crear la venta
                venta = Venta(
                    id=uuid4(),
                    tienda_id=tienda.id,
                    usuario_id=tienda.owner_id,  # Usuario que creó la tienda
                    metodo_pago=random.choice(["EFECTIVO", "MERCADOPAGO", "TARJETA"]),
                    status_pago="pagado",
                    fecha=fecha_venta + timedelta(hours=random.randint(8, 20), minutes=random.randint(0, 59)),
                    total=0  # Se calculará después
                )
                
                total_venta = 0
                detalles = []
                
                # Crear detalles de venta
                for producto in items_venta:
                    cantidad = random.randint(1, 10)
                    precio_unitario = float(producto.precio_venta)
                    subtotal = cantidad * precio_unitario
                    total_venta += subtotal
                    
                    detalle = DetalleVenta(
                        id=uuid4(),
                        venta_id=venta.id,
                        producto_id=producto.id,
                        producto_nombre=producto.nombre,
                        cantidad=cantidad,
                        precio_unitario=precio_unitario,
                        subtotal=subtotal
                    )
                    detalles.append(detalle)
                    
                    # Actualizar stock del producto
                    producto.stock_actual = max(0, producto.stock_actual - cantidad)
                
                venta.total = total_venta
                
                session.add(venta)
                for detalle in detalles:
                    session.add(detalle)
                
                ventas_creadas += 1
                
                if ventas_creadas % 10 == 0:
                    print(f"  📊 {ventas_creadas} ventas creadas...")
        
        await session.commit()
        print(f"✅ {ventas_creadas} ventas generadas exitosamente")
        
        # 4. Crear algunos productos con stock bajo para generar alertas
        print("\n⚠️  Creando productos con stock bajo...")
        productos_bajo_stock = random.sample(productos, min(5, len(productos)))
        for producto in productos_bajo_stock:
            producto.stock_actual = random.randint(1, 8)
            session.add(producto)
        
        await session.commit()
        print(f"✅ {len(productos_bajo_stock)} productos con stock bajo")
        
        # 5. Generar ventas de HOY con diferentes horarios
        print("\n🔥 Generando ventas de HOY...")
        ventas_hoy = 0
        hoy = datetime.utcnow()
        
        for hora in range(9, 19):  # De 9am a 7pm
            if random.random() > 0.3:  # 70% de probabilidad de venta en cada hora
                num_items = random.randint(1, 4)
                items_venta = random.sample(productos, num_items)
                
                venta = Venta(
                    id=uuid4(),
                    tienda_id=tienda.id,
                    usuario_id=tienda.owner_id,
                    metodo_pago=random.choice(["EFECTIVO", "MERCADOPAGO", "TARJETA"]),
                    status_pago="pagado",
                    fecha=hoy.replace(hour=hora, minute=random.randint(0, 59), second=0),
                    total=0
                )
                
                total_venta = 0
                for producto in items_venta:
                    cantidad = random.randint(1, 8)
                    precio_unitario = float(producto.precio_venta)
                    subtotal = cantidad * precio_unitario
                    total_venta += subtotal
                    
                    detalle = DetalleVenta(
                        id=uuid4(),
                        venta_id=venta.id,
                        producto_id=producto.id,
                        producto_nombre=producto.nombre,
                        cantidad=cantidad,
                        precio_unitario=precio_unitario,
                        subtotal=subtotal
                    )
                    session.add(detalle)
                    
                    producto.stock_actual = max(0, producto.stock_actual - cantidad)
                
                venta.total = total_venta
                session.add(venta)
                ventas_hoy += 1
        
        await session.commit()
        print(f"✅ {ventas_hoy} ventas de HOY generadas")
        
        # 6. Generar insights personalizados
        print("\n💡 Generando insights...")
        
        # Limpiar insights antiguos
        stmt = select(Insight).where(Insight.tienda_id == tienda.id)
        result = await session.execute(stmt)
        insights_old = result.scalars().all()
        for insight in insights_old:
            await session.delete(insight)
        
        # Calcular total de hoy
        stmt = select(Venta).where(
            Venta.tienda_id == tienda.id,
            Venta.fecha >= hoy.replace(hour=0, minute=0, second=0),
            Venta.status_pago == "pagado"
        )
        result = await session.execute(stmt)
        ventas_hoy_list = result.scalars().all()
        total_hoy = sum(v.total for v in ventas_hoy_list)
        
        insights_nuevos = [
            Insight(
                id=uuid4(),
                tienda_id=tienda.id,
                tipo="VENTAS_DIARIAS",
                mensaje=f"🎉 ¡Excelente día! Hoy facturaste ${total_hoy:,.2f} en {len(ventas_hoy_list)} ventas.",
                nivel_urgencia="BAJA",
                extra_data={"total": float(total_hoy), "cantidad": len(ventas_hoy_list)}
            ),
            Insight(
                id=uuid4(),
                tienda_id=tienda.id,
                tipo="STOCK_BAJO",
                mensaje=f"⚠️ Tienes {len(productos_bajo_stock)} productos con stock bajo. ¡Hora de reponer!",
                nivel_urgencia="ALTA" if len(productos_bajo_stock) > 3 else "MEDIA",
                extra_data={"cantidad": len(productos_bajo_stock)}
            ),
            Insight(
                id=uuid4(),
                tienda_id=tienda.id,
                tipo="PRODUCTO_POPULAR",
                mensaje=f"🔥 Las frutas y verduras están volando de las góndolas. Considera aumentar el stock.",
                nivel_urgencia="MEDIA",
                extra_data={"categoria": "frutas_verduras"}
            ),
            Insight(
                id=uuid4(),
                tienda_id=tienda.id,
                tipo="RECOMENDACION",
                mensaje="💰 El horario pico es entre 17-19hs. Asegúrate de tener suficiente stock en ese momento.",
                nivel_urgencia="BAJA",
                extra_data={"horario_pico": "17-19"}
            )
        ]
        
        for insight in insights_nuevos:
            session.add(insight)
        
        await session.commit()
        print(f"✅ {len(insights_nuevos)} insights generados")
        
        # 7. Resumen final
        print("\n" + "="*60)
        print("📊 RESUMEN DE ACTIVIDAD GENERADA")
        print("="*60)
        print(f"🏪 Tienda: {tienda.nombre}")
        print(f"💰 Ventas últimos 7 días: {ventas_creadas}")
        print(f"🔥 Ventas de HOY: {ventas_hoy}")
        print(f"💵 Total facturado HOY: ${total_hoy:,.2f}")
        print(f"⚠️  Productos con stock bajo: {len(productos_bajo_stock)}")
        print(f"💡 Insights generados: {len(insights_nuevos)}")
        print("="*60)
        print("\n✅ ¡Actividad generada exitosamente!")
        print("🌐 Abre http://localhost:3000 para ver el dashboard actualizado")

if __name__ == "__main__":
    asyncio.run(generar_actividad())
