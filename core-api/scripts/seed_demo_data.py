"""
🎲 SCRIPT DE DATOS DEMO - BLEND POS

Este script carga datos de demostración para tener el sistema "vivo" en demos.

Carga:
- 1 Tienda Demo ("Moda Blend")
- 50 Productos variados (Ropa con talles, Accesorios)
- 200 Ventas históricas (distribuidas en el último mes)
- 5 Alertas de stock bajo (para probar Insights)

Uso:
    python scripts/seed_demo_data.py
"""

import asyncio
import random
from datetime import datetime, timedelta
from decimal import Decimal
import sys
import os

# Agregar el directorio raíz al path para imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from core.config import settings
from models import (
    Tienda, Usuario, Producto, Venta, ItemVenta, TipoProducto, MetodoPago
)
from core.security import get_password_hash

# ==================== DATOS DE DEMO ====================

PRODUCTOS_DEMO = [
    # Remeras
    {"nombre": "Remera Nike Deportiva Talle S", "tipo": "ropa", "precio": 15000, "stock": 8, "stock_min": 5, "sku": "REM-NIK-S-001"},
    {"nombre": "Remera Nike Deportiva Talle M", "tipo": "ropa", "precio": 15000, "stock": 12, "stock_min": 5, "sku": "REM-NIK-M-001"},
    {"nombre": "Remera Nike Deportiva Talle L", "tipo": "ropa", "precio": 15000, "stock": 10, "stock_min": 5, "sku": "REM-NIK-L-001"},
    {"nombre": "Remera Adidas Classic Talle S", "tipo": "ropa", "precio": 14000, "stock": 6, "stock_min": 5, "sku": "REM-ADI-S-002"},
    {"nombre": "Remera Adidas Classic Talle M", "tipo": "ropa", "precio": 14000, "stock": 15, "stock_min": 5, "sku": "REM-ADI-M-002"},
    {"nombre": "Remera Adidas Classic Talle L", "tipo": "ropa", "precio": 14000, "stock": 9, "stock_min": 5, "sku": "REM-ADI-L-002"},
    {"nombre": "Remera Puma Performance Talle M", "tipo": "ropa", "precio": 13500, "stock": 20, "stock_min": 10, "sku": "REM-PUM-M-003"},
    {"nombre": "Remera Blend Básica Blanca M", "tipo": "ropa", "precio": 9000, "stock": 25, "stock_min": 10, "sku": "REM-BLE-M-004"},
    
    # Pantalones
    {"nombre": "Pantalón Adidas Classic Talle S", "tipo": "ropa", "precio": 25000, "stock": 4, "stock_min": 3, "sku": "PAN-ADI-S-001"},
    {"nombre": "Pantalón Adidas Classic Talle M", "tipo": "ropa", "precio": 25000, "stock": 8, "stock_min": 3, "sku": "PAN-ADI-M-001"},
    {"nombre": "Pantalón Adidas Classic Talle L", "tipo": "ropa", "precio": 25000, "stock": 6, "stock_min": 3, "sku": "PAN-ADI-L-001"},
    {"nombre": "Jean Levi's 511 Talle 30", "tipo": "ropa", "precio": 35000, "stock": 10, "stock_min": 5, "sku": "JEA-LEV-30-002"},
    {"nombre": "Jean Levi's 511 Talle 32", "tipo": "ropa", "precio": 35000, "stock": 12, "stock_min": 5, "sku": "JEA-LEV-32-002"},
    {"nombre": "Jean Levi's 511 Talle 34", "tipo": "ropa", "precio": 35000, "stock": 8, "stock_min": 5, "sku": "JEA-LEV-34-002"},
    {"nombre": "Pantalón Cargo Blend Talle M", "tipo": "ropa", "precio": 28000, "stock": 15, "stock_min": 8, "sku": "PAN-BLE-M-003"},
    
    # Zapatillas
    {"nombre": "Zapatillas Puma Runner 39", "tipo": "ropa", "precio": 45000, "stock": 3, "stock_min": 2, "sku": "ZAP-PUM-39-001"},
    {"nombre": "Zapatillas Puma Runner 40", "tipo": "ropa", "precio": 45000, "stock": 5, "stock_min": 2, "sku": "ZAP-PUM-40-001"},
    {"nombre": "Zapatillas Puma Runner 41", "tipo": "ropa", "precio": 45000, "stock": 7, "stock_min": 2, "sku": "ZAP-PUM-41-001"},
    {"nombre": "Nike Air Max 90 Talle 40", "tipo": "ropa", "precio": 85000, "stock": 4, "stock_min": 2, "sku": "ZAP-NIK-40-002"},
    {"nombre": "Nike Air Max 90 Talle 41", "tipo": "ropa", "precio": 85000, "stock": 6, "stock_min": 2, "sku": "ZAP-NIK-41-002"},
    {"nombre": "Nike Air Max 90 Talle 42", "tipo": "ropa", "precio": 85000, "stock": 5, "stock_min": 2, "sku": "ZAP-NIK-42-002"},
    {"nombre": "Adidas Superstar Blancas 39", "tipo": "ropa", "precio": 65000, "stock": 8, "stock_min": 3, "sku": "ZAP-ADI-39-003"},
    {"nombre": "Adidas Superstar Blancas 40", "tipo": "ropa", "precio": 65000, "stock": 10, "stock_min": 3, "sku": "ZAP-ADI-40-003"},
    
    # Buzos y Camperas
    {"nombre": "Buzo Nike Hoodie Talle M", "tipo": "ropa", "precio": 38000, "stock": 12, "stock_min": 5, "sku": "BUZ-NIK-M-001"},
    {"nombre": "Buzo Nike Hoodie Talle L", "tipo": "ropa", "precio": 38000, "stock": 10, "stock_min": 5, "sku": "BUZ-NIK-L-001"},
    {"nombre": "Campera Adidas 3 Tiras M", "tipo": "ropa", "precio": 55000, "stock": 6, "stock_min": 3, "sku": "CAM-ADI-M-001"},
    {"nombre": "Campera Adidas 3 Tiras L", "tipo": "ropa", "precio": 55000, "stock": 8, "stock_min": 3, "sku": "CAM-ADI-L-001"},
    {"nombre": "Campera Puma Urban Talle M", "tipo": "ropa", "precio": 48000, "stock": 2, "stock_min": 2, "sku": "CAM-PUM-M-002"},
    
    # Accesorios
    {"nombre": "Gorra Nike Snapback", "tipo": "general", "precio": 8500, "stock": 20, "stock_min": 10, "sku": "GOR-NIK-001"},
    {"nombre": "Gorra Adidas Trucker", "tipo": "general", "precio": 7500, "stock": 18, "stock_min": 10, "sku": "GOR-ADI-002"},
    {"nombre": "Mochila Puma Deportiva", "tipo": "general", "precio": 32000, "stock": 10, "stock_min": 5, "sku": "MOC-PUM-001"},
    {"nombre": "Mochila Nike Academy", "tipo": "general", "precio": 35000, "stock": 8, "stock_min": 5, "sku": "MOC-NIK-002"},
    {"nombre": "Riñonera Blend Urban", "tipo": "general", "precio": 12000, "stock": 15, "stock_min": 8, "sku": "RIN-BLE-001"},
    {"nombre": "Medias Nike Pack x3", "tipo": "general", "precio": 4500, "stock": 30, "stock_min": 15, "sku": "MED-NIK-001"},
    {"nombre": "Medias Adidas Deportivas x3", "tipo": "general", "precio": 4200, "stock": 28, "stock_min": 15, "sku": "MED-ADI-002"},
    
    # Ropa Interior
    {"nombre": "Boxer Calvin Klein Pack x2 S", "tipo": "ropa", "precio": 15000, "stock": 12, "stock_min": 8, "sku": "BOX-CAL-S-001"},
    {"nombre": "Boxer Calvin Klein Pack x2 M", "tipo": "ropa", "precio": 15000, "stock": 15, "stock_min": 8, "sku": "BOX-CAL-M-001"},
    {"nombre": "Boxer Calvin Klein Pack x2 L", "tipo": "ropa", "precio": 15000, "stock": 10, "stock_min": 8, "sku": "BOX-CAL-L-001"},
    
    # Productos de Temporada
    {"nombre": "Short Nike Running Talle M", "tipo": "ropa", "precio": 18000, "stock": 14, "stock_min": 7, "sku": "SHO-NIK-M-001"},
    {"nombre": "Short Nike Running Talle L", "tipo": "ropa", "precio": 18000, "stock": 11, "stock_min": 7, "sku": "SHO-NIK-L-001"},
    {"nombre": "Musculosa Blend Gym Talle M", "tipo": "ropa", "precio": 8000, "stock": 20, "stock_min": 10, "sku": "MUS-BLE-M-001"},
    {"nombre": "Ojotas Adidas Adilette", "tipo": "ropa", "precio": 12000, "stock": 16, "stock_min": 10, "sku": "OJO-ADI-001"},
    
    # Accesorios Premium
    {"nombre": "Reloj Puma Digital", "tipo": "general", "precio": 28000, "stock": 5, "stock_min": 3, "sku": "REL-PUM-001"},
    {"nombre": "Lentes de Sol Blend Aviator", "tipo": "general", "precio": 15000, "stock": 12, "stock_min": 6, "sku": "LEN-BLE-001"},
    {"nombre": "Billetera Adidas Cuero", "tipo": "general", "precio": 9500, "stock": 18, "stock_min": 10, "sku": "BIL-ADI-001"},
    {"nombre": "Cinturón Nike Reversible", "tipo": "general", "precio": 11000, "stock": 14, "stock_min": 8, "sku": "CIN-NIK-001"},
    {"nombre": "Paraguas Puma Compacto", "tipo": "general", "precio": 13000, "stock": 8, "stock_min": 5, "sku": "PAR-PUM-001"},
    {"nombre": "Toalla Nike Gym", "tipo": "general", "precio": 6500, "stock": 22, "stock_min": 12, "sku": "TOA-NIK-001"},
]

# ==================== FUNCIONES ====================

async def seed_database():
    """Función principal para cargar datos demo"""
    
    print("🎲 INICIANDO CARGA DE DATOS DEMO...")
    print("=" * 60)
    
    # Crear engine
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # ==================== 1. TIENDA DEMO ====================
        print("\n📍 PASO 1: Creando tienda demo...")
        
        # Verificar si ya existe
        result = await session.execute(select(Tienda).where(Tienda.nombre == "Moda Blend"))
        tienda_existente = result.scalar_one_or_none()
        
        if tienda_existente:
            print("   ⚠️  La tienda 'Moda Blend' ya existe. Usando existente.")
            tienda = tienda_existente
        else:
            tienda = Tienda(
                nombre="Moda Blend",
                direccion="Av. Corrientes 1234, CABA",
                telefono="+54 11 1234-5678",
                email="tienda@modablend.com.ar",
                cuit="20-12345678-9",
                rubro="Indumentaria Deportiva"
            )
            session.add(tienda)
            await session.flush()
            print(f"   ✅ Tienda creada: {tienda.nombre} (ID: {tienda.id})")
        
        # ==================== 2. USUARIO ADMIN ====================
        print("\n👤 PASO 2: Verificando usuario admin...")
        
        result = await session.execute(select(Usuario).where(Usuario.email == "admin@modablend.com"))
        usuario_existente = result.scalar_one_or_none()
        
        if usuario_existente:
            print("   ⚠️  Usuario admin ya existe.")
            usuario = usuario_existente
        else:
            usuario = Usuario(
                email="admin@modablend.com",
                nombre="Admin Demo",
                hashed_password=get_password_hash("admin123"),
                tienda_id=tienda.id,
                is_active=True,
                is_superuser=True
            )
            session.add(usuario)
            await session.flush()
            print(f"   ✅ Usuario admin creado: {usuario.email}")
            print("   🔑 Contraseña: admin123")
        
        # ==================== 3. PRODUCTOS ====================
        print(f"\n📦 PASO 3: Cargando {len(PRODUCTOS_DEMO)} productos...")
        
        productos_creados = []
        for p in PRODUCTOS_DEMO:
            # Verificar si ya existe por SKU
            result = await session.execute(select(Producto).where(Producto.sku == p["sku"]))
            existente = result.scalar_one_or_none()
            
            if not existente:
                producto = Producto(
                    tienda_id=tienda.id,
                    nombre=p["nombre"],
                    descripcion=f"Producto de alta calidad - {p['nombre']}",
                    tipo=TipoProducto(p["tipo"]),
                    precio_venta=Decimal(str(p["precio"])),
                    precio_compra=Decimal(str(p["precio"] * 0.6)),  # 60% del precio de venta
                    stock_actual=p["stock"],
                    stock_minimo=p["stock_min"],
                    sku=p["sku"],
                    codigo_barras=f"780{random.randint(1000000000, 9999999999)}",
                    activo=True
                )
                session.add(producto)
                productos_creados.append(producto)
        
        await session.flush()
        print(f"   ✅ {len(productos_creados)} productos nuevos creados")
        
        # Obtener todos los productos para generar ventas
        result = await session.execute(select(Producto).where(Producto.tienda_id == tienda.id))
        todos_productos = list(result.scalars().all())
        print(f"   📊 Total de productos en DB: {len(todos_productos)}")
        
        # ==================== 4. VENTAS HISTÓRICAS ====================
        print("\n💰 PASO 4: Generando 200 ventas históricas...")
        
        # Fecha inicio: hace 30 días
        fecha_inicio = datetime.now() - timedelta(days=30)
        ventas_creadas = 0
        
        for i in range(200):
            # Fecha aleatoria en los últimos 30 días
            dias_atras = random.randint(0, 30)
            horas = random.randint(10, 20)  # Horario comercial
            minutos = random.randint(0, 59)
            
            fecha_venta = fecha_inicio + timedelta(days=dias_atras, hours=horas, minutes=minutos)
            
            # Método de pago aleatorio
            metodos = [MetodoPago.efectivo, MetodoPago.tarjeta, MetodoPago.mercadopago, MetodoPago.transferencia]
            metodo = random.choice(metodos)
            
            # Crear venta
            venta = Venta(
                tienda_id=tienda.id,
                metodo_pago=metodo,
                total=Decimal("0"),  # Se calculará después
                created_at=fecha_venta,
                updated_at=fecha_venta
            )
            session.add(venta)
            await session.flush()
            
            # Agregar 1-5 productos aleatorios
            num_items = random.randint(1, 5)
            productos_venta = random.sample(todos_productos, min(num_items, len(todos_productos)))
            
            total_venta = Decimal("0")
            
            for producto in productos_venta:
                cantidad = random.randint(1, 3)
                subtotal = producto.precio_venta * cantidad
                
                item = ItemVenta(
                    venta_id=venta.id,
                    producto_id=producto.id,
                    cantidad=cantidad,
                    precio_unitario=producto.precio_venta,
                    subtotal=subtotal
                )
                session.add(item)
                total_venta += subtotal
            
            venta.total = total_venta
            ventas_creadas += 1
            
            if (i + 1) % 50 == 0:
                print(f"   ⏳ Procesadas {i + 1}/200 ventas...")
        
        print(f"   ✅ {ventas_creadas} ventas históricas creadas")
        
        # ==================== 5. PRODUCTOS CON STOCK BAJO (para Insights) ====================
        print("\n⚠️  PASO 5: Ajustando 5 productos a stock crítico...")
        
        # Seleccionar 5 productos aleatorios y ponerlos en stock bajo
        productos_criticos = random.sample(todos_productos, 5)
        for producto in productos_criticos:
            producto.stock_actual = max(1, producto.stock_minimo - 2)  # Por debajo del mínimo
            print(f"   🔴 {producto.nombre}: Stock={producto.stock_actual} (Mín={producto.stock_minimo})")
        
        # ==================== COMMIT ====================
        await session.commit()
        print("\n" + "=" * 60)
        print("✅ DATOS DEMO CARGADOS EXITOSAMENTE!")
        print("=" * 60)
        
        # ==================== RESUMEN ====================
        print("\n📊 RESUMEN:")
        print(f"   🏪 Tienda: {tienda.nombre}")
        print(f"   👤 Usuario: {usuario.email} / admin123")
        print(f"   📦 Productos: {len(todos_productos)}")
        print(f"   💰 Ventas: {ventas_creadas}")
        print(f"   ⚠️  Alertas de stock: 5 productos")
        
        print("\n🚀 PRÓXIMOS PASOS:")
        print("   1. Inicia el frontend: cd web-portal && npm run dev")
        print("   2. Login con: admin@modablend.com / admin123")
        print("   3. Explora el Dashboard con datos reales")
        print("   4. Prueba el módulo POS")
        print("   5. Revisa los Insights de stock bajo")
        
    await engine.dispose()

# ==================== MAIN ====================

if __name__ == "__main__":
    try:
        asyncio.run(seed_database())
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
