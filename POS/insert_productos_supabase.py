"""
Script para insertar productos de prueba en Supabase
Ejecutar con: docker-compose exec backend python insert_productos_supabase.py
"""
import asyncio
import uuid
from datetime import datetime
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models import Producto, Tienda

async def insert_productos():
    """Inserta 8 productos de prueba en la tienda existente"""
    async with AsyncSessionLocal() as session:
        # Buscar la tienda existente
        result = await session.execute(select(Tienda).limit(1))
        tienda = result.scalar_one_or_none()
        
        if not tienda:
            print("❌ No se encontró ninguna tienda. Primero crea una tienda.")
            return
        
        print(f"✓ Usando tienda: {tienda.nombre} (ID: {tienda.id})")
        
        # Verificar si ya hay productos
        result = await session.execute(
            select(Producto).where(Producto.tienda_id == tienda.id)
        )
        productos_existentes = result.scalars().all()
        
        if productos_existentes:
            print(f"⚠️  Ya hay {len(productos_existentes)} productos en esta tienda")
            respuesta = input("¿Deseas agregar más productos de prueba? (s/n): ")
            if respuesta.lower() != 's':
                print("Operación cancelada")
                return
        
        # Productos de prueba
        productos_data = [
            {
                'sku': 'COCA1L',
                'nombre': 'Coca Cola 1L',
                'precio_venta': 850.0,
                'precio_costo': 600.0,
                'stock_actual': 50,
                'tipo': 'general',
                'descripcion': 'Gaseosa Coca Cola 1 litro'
            },
            {
                'sku': 'PEPSI1L',
                'nombre': 'Pepsi 1L',
                'precio_venta': 800.0,
                'precio_costo': 550.0,
                'stock_actual': 40,
                'tipo': 'general',
                'descripcion': 'Gaseosa Pepsi 1 litro'
            },
            {
                'sku': 'AGUA500',
                'nombre': 'Agua Mineral 500ml',
                'precio_venta': 400.0,
                'precio_costo': 250.0,
                'stock_actual': 100,
                'tipo': 'general',
                'descripcion': 'Agua mineral sin gas 500ml'
            },
            {
                'sku': 'PIZZA',
                'nombre': 'Pizza Muzzarella',
                'precio_venta': 5500.0,
                'precio_costo': 3200.0,
                'stock_actual': 20,
                'tipo': 'general',
                'descripcion': 'Pizza muzzarella grande (8 porciones)'
            },
            {
                'sku': 'HAMBUR',
                'nombre': 'Hamburguesa Completa',
                'precio_venta': 4200.0,
                'precio_costo': 2800.0,
                'stock_actual': 25,
                'tipo': 'general',
                'descripcion': 'Hamburguesa completa con papas'
            },
            {
                'sku': 'EMPAN',
                'nombre': 'Empanadas x12',
                'precio_venta': 3600.0,
                'precio_costo': 2400.0,
                'stock_actual': 30,
                'tipo': 'general',
                'descripcion': 'Docena de empanadas surtidas'
            },
            {
                'sku': 'CAFE',
                'nombre': 'Café Espresso',
                'precio_venta': 1200.0,
                'precio_costo': 700.0,
                'stock_actual': 60,
                'tipo': 'general',
                'descripcion': 'Café espresso simple'
            },
            {
                'sku': 'MEDIAL',
                'nombre': 'Medialunas x6',
                'precio_venta': 1800.0,
                'precio_costo': 1100.0,
                'stock_actual': 45,
                'tipo': 'general',
                'descripcion': 'Media docena de medialunas'
            },
        ]
        
        productos_creados = 0
        for p_data in productos_data:
            # Verificar si el SKU ya existe
            result = await session.execute(
                select(Producto).where(
                    Producto.sku == p_data['sku'],
                    Producto.tienda_id == tienda.id
                )
            )
            producto_existente = result.scalar_one_or_none()
            
            if producto_existente:
                print(f"⚠️  SKU {p_data['sku']} ya existe, saltando...")
                continue
            
            # Crear producto
            producto = Producto(
                id=uuid.uuid4(),
                sku=p_data['sku'],
                nombre=p_data['nombre'],
                descripcion=p_data.get('descripcion'),
                precio_venta=p_data['precio_venta'],
                precio_costo=p_data['precio_costo'],
                stock_actual=p_data['stock_actual'],
                tipo=p_data['tipo'],
                is_active=True,
                tienda_id=tienda.id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(producto)
            productos_creados += 1
            print(f"✓ Creando: {p_data['nombre']} (SKU: {p_data['sku']})")
        
        # Commit
        await session.commit()
        print(f"\n{'='*50}")
        print(f"✅ {productos_creados} productos insertados exitosamente en Supabase")
        print(f"{'='*50}")

if __name__ == "__main__":
    asyncio.run(insert_productos())
