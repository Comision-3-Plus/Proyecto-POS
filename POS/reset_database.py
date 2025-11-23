#!/usr/bin/env python3
"""
Script para RESETEAR COMPLETAMENTE la base de datos y crear datos de prueba
- Limpia todo
- Crea Verdulería Pedrito con dueño
- Crea 50 productos
- Crea ventas de ejemplo
- Crea super admin
"""
import asyncio
from sqlalchemy import select, delete
from app.core.db import get_session
from app.models import User, Tienda, Producto, Venta, DetalleVenta
from app.core.security import get_password_hash
import uuid
from datetime import datetime, timedelta
import random

async def main():
    async for db in get_session():
        print("🧹 LIMPIANDO BASE DE DATOS...")
        
        # 1. ELIMINAR TODO (orden inverso por foreign keys)
        await db.execute(delete(DetalleVenta))
        await db.execute(delete(Venta))
        await db.execute(delete(Producto))
        await db.execute(delete(User))
        await db.execute(delete(Tienda))
        await db.commit()
        print("✅ Base de datos limpiada\n")
        
        # 2. CREAR TIENDA: Verdulería Pedrito
        print("🏪 CREANDO TIENDA...")
        tienda = Tienda(
            id=uuid.uuid4(),
            nombre="Verdulería Pedrito",
            rubro="verduleria",
            is_active=True
        )
        db.add(tienda)
        await db.flush()
        print(f"✅ Tienda creada: {tienda.nombre} (ID: {tienda.id})\n")
        
        # 3. CREAR USUARIOS
        print("👥 CREANDO USUARIOS...")
        
        # Usuario dueño: Pedrito
        pedrito = User(
            id=uuid.uuid4(),
            email="pedrito@verduleria.com",
            hashed_password=get_password_hash("pedrito123"),
            full_name="Pedro López",
            rol="admin",
            tienda_id=tienda.id,
            is_active=True
        )
        db.add(pedrito)
        print(f"✅ Dueño: {pedrito.email} / pedrito123 (Admin)")
        
        # Super Admin
        admin = User(
            id=uuid.uuid4(),
            email="admin@nexuspos.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Super Administrador",
            rol="super_admin",
            tienda_id=tienda.id,  # Asignado a Verdulería Pedrito
            is_active=True
        )
        db.add(admin)
        print(f"✅ Super Admin: {admin.email} / admin123 (Super Admin)\n")
        
        await db.flush()
        
        # 4. CREAR 50 PRODUCTOS
        print("📦 CREANDO 50 PRODUCTOS...")
        productos_data = [
            # VERDURAS (20 productos)
            {"nombre": "Tomate", "sku": "VER001", "precio_venta": 850, "precio_costo": 500, "stock": 100, "tipo": "verdura"},
            {"nombre": "Lechuga", "sku": "VER002", "precio_venta": 600, "precio_costo": 350, "stock": 80, "tipo": "verdura"},
            {"nombre": "Zanahoria", "sku": "VER003", "precio_venta": 450, "precio_costo": 250, "stock": 120, "tipo": "verdura"},
            {"nombre": "Papa", "sku": "VER004", "precio_venta": 700, "precio_costo": 400, "stock": 150, "tipo": "verdura"},
            {"nombre": "Cebolla", "sku": "VER005", "precio_venta": 500, "precio_costo": 300, "stock": 130, "tipo": "verdura"},
            {"nombre": "Morrón Rojo", "sku": "VER006", "precio_venta": 950, "precio_costo": 600, "stock": 60, "tipo": "verdura"},
            {"nombre": "Morrón Verde", "sku": "VER007", "precio_venta": 900, "precio_costo": 550, "stock": 65, "tipo": "verdura"},
            {"nombre": "Zapallo", "sku": "VER008", "precio_venta": 800, "precio_costo": 450, "stock": 40, "tipo": "verdura"},
            {"nombre": "Calabaza", "sku": "VER009", "precio_venta": 750, "precio_costo": 400, "stock": 45, "tipo": "verdura"},
            {"nombre": "Berenjena", "sku": "VER010", "precio_venta": 1200, "precio_costo": 700, "stock": 35, "tipo": "verdura"},
            {"nombre": "Pepino", "sku": "VER011", "precio_venta": 650, "precio_costo": 350, "stock": 70, "tipo": "verdura"},
            {"nombre": "Apio", "sku": "VER012", "precio_venta": 800, "precio_costo": 450, "stock": 50, "tipo": "verdura"},
            {"nombre": "Brócoli", "sku": "VER013", "precio_venta": 1400, "precio_costo": 850, "stock": 30, "tipo": "verdura"},
            {"nombre": "Coliflor", "sku": "VER014", "precio_venta": 1300, "precio_costo": 800, "stock": 28, "tipo": "verdura"},
            {"nombre": "Repollo", "sku": "VER015", "precio_venta": 550, "precio_costo": 300, "stock": 60, "tipo": "verdura"},
            {"nombre": "Espinaca", "sku": "VER016", "precio_venta": 900, "precio_costo": 500, "stock": 55, "tipo": "verdura"},
            {"nombre": "Rúcula", "sku": "VER017", "precio_venta": 1100, "precio_costo": 650, "stock": 40, "tipo": "verdura"},
            {"nombre": "Acelga", "sku": "VER018", "precio_venta": 700, "precio_costo": 400, "stock": 50, "tipo": "verdura"},
            {"nombre": "Radicheta", "sku": "VER019", "precio_venta": 850, "precio_costo": 500, "stock": 35, "tipo": "verdura"},
            {"nombre": "Remolacha", "sku": "VER020", "precio_venta": 600, "precio_costo": 350, "stock": 70, "tipo": "verdura"},
            
            # FRUTAS (15 productos)
            {"nombre": "Manzana Roja", "sku": "FRU001", "precio_venta": 1200, "precio_costo": 700, "stock": 100, "tipo": "fruta"},
            {"nombre": "Manzana Verde", "sku": "FRU002", "precio_venta": 1150, "precio_costo": 680, "stock": 95, "tipo": "fruta"},
            {"nombre": "Banana", "sku": "FRU003", "precio_venta": 900, "precio_costo": 500, "stock": 120, "tipo": "fruta"},
            {"nombre": "Naranja", "sku": "FRU004", "precio_venta": 800, "precio_costo": 450, "stock": 140, "tipo": "fruta"},
            {"nombre": "Mandarina", "sku": "FRU005", "precio_venta": 850, "precio_costo": 500, "stock": 110, "tipo": "fruta"},
            {"nombre": "Pera", "sku": "FRU006", "precio_venta": 1300, "precio_costo": 750, "stock": 80, "tipo": "fruta"},
            {"nombre": "Durazno", "sku": "FRU007", "precio_venta": 1500, "precio_costo": 900, "stock": 60, "tipo": "fruta"},
            {"nombre": "Frutilla", "sku": "FRU008", "precio_venta": 2500, "precio_costo": 1500, "stock": 40, "tipo": "fruta"},
            {"nombre": "Uva", "sku": "FRU009", "precio_venta": 1800, "precio_costo": 1100, "stock": 55, "tipo": "fruta"},
            {"nombre": "Sandía", "sku": "FRU010", "precio_venta": 1200, "precio_costo": 700, "stock": 30, "tipo": "fruta"},
            {"nombre": "Melón", "sku": "FRU011", "precio_venta": 1400, "precio_costo": 850, "stock": 25, "tipo": "fruta"},
            {"nombre": "Kiwi", "sku": "FRU012", "precio_venta": 2200, "precio_costo": 1400, "stock": 35, "tipo": "fruta"},
            {"nombre": "Limón", "sku": "FRU013", "precio_venta": 600, "precio_costo": 350, "stock": 90, "tipo": "fruta"},
            {"nombre": "Pomelo", "sku": "FRU014", "precio_venta": 950, "precio_costo": 550, "stock": 50, "tipo": "fruta"},
            {"nombre": "Ananá", "sku": "FRU015", "precio_venta": 2800, "precio_costo": 1700, "stock": 20, "tipo": "fruta"},
            
            # OTROS (15 productos)
            {"nombre": "Huevos x12", "sku": "OTR001", "precio_venta": 3500, "precio_costo": 2500, "stock": 60, "tipo": "huevos"},
            {"nombre": "Leche 1L", "sku": "OTR002", "precio_venta": 1400, "precio_costo": 1000, "stock": 80, "tipo": "lacteos"},
            {"nombre": "Yogur Natural", "sku": "OTR003", "precio_venta": 1200, "precio_costo": 800, "stock": 50, "tipo": "lacteos"},
            {"nombre": "Queso Cremoso", "sku": "OTR004", "precio_venta": 4500, "precio_costo": 3200, "stock": 30, "tipo": "lacteos"},
            {"nombre": "Pan Integral", "sku": "OTR005", "precio_venta": 2200, "precio_costo": 1500, "stock": 40, "tipo": "panaderia"},
            {"nombre": "Pan Francés", "sku": "OTR006", "precio_venta": 1800, "precio_costo": 1200, "stock": 45, "tipo": "panaderia"},
            {"nombre": "Fideos", "sku": "OTR007", "precio_venta": 1600, "precio_costo": 1100, "stock": 70, "tipo": "almacen"},
            {"nombre": "Arroz 1kg", "sku": "OTR008", "precio_venta": 1900, "precio_costo": 1300, "stock": 65, "tipo": "almacen"},
            {"nombre": "Aceite 1L", "sku": "OTR009", "precio_venta": 3200, "precio_costo": 2400, "stock": 50, "tipo": "almacen"},
            {"nombre": "Sal Fina", "sku": "OTR010", "precio_venta": 600, "precio_costo": 350, "stock": 80, "tipo": "almacen"},
            {"nombre": "Azúcar 1kg", "sku": "OTR011", "precio_venta": 1500, "precio_costo": 1000, "stock": 60, "tipo": "almacen"},
            {"nombre": "Yerba Mate", "sku": "OTR012", "precio_venta": 3800, "precio_costo": 2800, "stock": 55, "tipo": "almacen"},
            {"nombre": "Café Molido", "sku": "OTR013", "precio_venta": 4200, "precio_costo": 3200, "stock": 40, "tipo": "almacen"},
            {"nombre": "Agua Mineral 2L", "sku": "OTR014", "precio_venta": 1100, "precio_costo": 700, "stock": 100, "tipo": "bebidas"},
            {"nombre": "Gaseosa 2.25L", "sku": "OTR015", "precio_venta": 2200, "precio_costo": 1500, "stock": 75, "tipo": "bebidas"},
        ]
        
        productos = []
        for idx, p_data in enumerate(productos_data, 1):
            producto = Producto(
                id=uuid.uuid4(),
                nombre=p_data["nombre"],
                sku=p_data["sku"],
                precio_venta=p_data["precio_venta"],
                precio_costo=p_data["precio_costo"],
                stock_actual=p_data["stock"],
                tipo=p_data["tipo"],
                tienda_id=tienda.id,
                is_active=True
            )
            db.add(producto)
            productos.append(producto)
            if idx % 10 == 0:
                print(f"  ✅ {idx} productos creados...")
        
        await db.flush()
        print(f"✅ Total: {len(productos)} productos creados\n")
        
        # 5. CREAR VENTAS DE EJEMPLO
        print("💰 CREANDO VENTAS DE EJEMPLO...")
        ventas_creadas = 0
        
        # Crear 10 ventas en los últimos 7 días
        for i in range(10):
            # Fecha aleatoria en los últimos 7 días
            dias_atras = random.randint(0, 7)
            fecha_venta = datetime.utcnow() - timedelta(days=dias_atras)
            
            # Seleccionar 2-5 productos aleatorios
            num_items = random.randint(2, 5)
            productos_venta = random.sample(productos, num_items)
            
            # Crear venta
            venta = Venta(
                id=uuid.uuid4(),
                fecha=fecha_venta,
                total=0,  # Se calculará después
                metodo_pago=random.choice(["EFECTIVO", "MERCADOPAGO", "TARJETA"]),
                estado="COMPLETADA",
                tienda_id=tienda.id,
                usuario_id=pedrito.id
            )
            db.add(venta)
            await db.flush()
            
            # Crear items de venta
            total_venta = 0
            for producto in productos_venta:
                cantidad = random.randint(1, 5)
                precio_unitario = producto.precio_venta
                subtotal = cantidad * precio_unitario
                
                item = DetalleVenta(
                    id=uuid.uuid4(),
                    venta_id=venta.id,
                    producto_id=producto.id,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal
                )
                db.add(item)
                total_venta += subtotal
            
            # Actualizar total de venta
            venta.total = total_venta
            ventas_creadas += 1
        
        await db.commit()
        print(f"✅ {ventas_creadas} ventas creadas\n")
        
        # RESUMEN FINAL
        print("=" * 60)
        print("🎉 BASE DE DATOS RESETEADA Y CONFIGURADA EXITOSAMENTE")
        print("=" * 60)
        print("\n📊 RESUMEN:")
        print(f"  🏪 Tienda: {tienda.nombre} (Rubro: {tienda.rubro})")
        print(f"  👤 Dueño: pedrito@verduleria.com / pedrito123 (Admin)")
        print(f"  🔑 Super Admin: admin@nexuspos.com / admin123")
        print(f"  📦 Productos: {len(productos)} productos creados")
        print(f"  💰 Ventas: {ventas_creadas} ventas de ejemplo")
        print("\n🚀 CREDENCIALES:")
        print("  👉 Dueño: pedrito@verduleria.com / pedrito123")
        print("  👉 Super Admin: admin@nexuspos.com / admin123")
        print("\n✅ Todo listo para usar!")

if __name__ == "__main__":
    asyncio.run(main())
