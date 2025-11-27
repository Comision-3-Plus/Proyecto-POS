"""
Script de inicialización de base de datos
Crea datos de ejemplo para testing
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from uuid import uuid4
from datetime import datetime
import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import (
    Tienda, User, Cliente, Size, Color, Location,
    Product, ProductVariant, InventoryLedger
)
from core.config import settings
import bcrypt

async def init_demo_data():
    """Inicializar datos de demostración"""
    
    print("🚀 INICIALIZANDO BASE DE DATOS CON DATOS DE DEMOSTRACIÓN")
    print("=" * 80)
    
    # Crear engine y session
    engine = create_async_engine(settings.get_database_url(), echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # 1. Crear Tienda de demostración
            print("\n📦 Creando tienda de demostración...")
            tienda = Tienda(
                id=uuid4(),
                nombre="Tienda Demo - Blend POS",
                rubro="ropa",
                is_active=True,
                created_at=datetime.utcnow()
            )
            session.add(tienda)
            await session.flush()
            print(f"   ✅ Tienda creada: {tienda.nombre} (ID: {tienda.id})")
            
            # 2. Crear Usuario administrador
            print("\n👤 Creando usuario administrador...")
            hashed_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
            admin_user = User(
                id=uuid4(),
                email="admin@blend.com",
                hashed_password=hashed_password.decode('utf-8'),
                full_name="Administrador Demo",
                rol="owner",
                is_active=True,
                tienda_id=tienda.id,
                created_at=datetime.utcnow()
            )
            session.add(admin_user)
            print(f"   ✅ Usuario creado: {admin_user.email} (password: admin123)")
            
            # 3. Crear Cliente de ejemplo
            print("\n🛍️ Creando cliente de ejemplo...")
            cliente = Cliente(
                id=uuid4(),
                nombre="Juan Pérez",
                email="juan@example.com",
                telefono="11-2345-6789",
                documento_tipo="DNI",
                documento_numero="12345678",
                tienda_id=tienda.id,
                created_at=datetime.utcnow()
            )
            session.add(cliente)
            print(f"   ✅ Cliente creado: {cliente.nombre}")
            
            # 4. Crear Talles
            print("\n📏 Creando catálogo de talles...")
            talles_data = [
                ("XS", 1),
                ("S", 2),
                ("M", 3),
                ("L", 4),
                ("XL", 5),
                ("XXL", 6)
            ]
            talles = []
            for nombre, orden in talles_data:
                size = Size(
                    tienda_id=tienda.id,
                    name=nombre,
                    sort_order=orden,
                    created_at=datetime.utcnow()
                )
                session.add(size)
                talles.append(size)
            await session.flush()
            print(f"   ✅ {len(talles)} talles creados")
            
            # 5. Crear Colores
            print("\n🎨 Creando catálogo de colores...")
            colores_data = [
                ("Negro", "#000000"),
                ("Blanco", "#FFFFFF"),
                ("Rojo", "#FF0000"),
                ("Azul", "#0000FF"),
                ("Verde", "#00FF00")
            ]
            colores = []
            for nombre, hex_code in colores_data:
                color = Color(
                    tienda_id=tienda.id,
                    name=nombre,
                    hex_code=hex_code,
                    created_at=datetime.utcnow()
                )
                session.add(color)
                colores.append(color)
            await session.flush()
            print(f"   ✅ {len(colores)} colores creados")
            
            # 6. Crear Ubicación (Local Principal)
            print("\n📍 Creando ubicación principal...")
            location = Location(
                location_id=uuid4(),
                tienda_id=tienda.id,
                name="Local Principal - Centro",
                type="STORE",
                address="Av. Córdoba 1234, CABA",
                is_default=True,
                created_at=datetime.utcnow()
            )
            session.add(location)
            await session.flush()
            print(f"   ✅ Ubicación creada: {location.name}")
            
            # 7. Crear Producto Padre
            print("\n👕 Creando productos de ejemplo...")
            product = Product(
                product_id=uuid4(),
                tienda_id=tienda.id,
                name="Remera Básica",
                base_sku="REM-BASIC",
                description="Remera de algodón 100% - Ideal para uso diario",
                category="indumentaria",
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(product)
            await session.flush()
            print(f"   ✅ Producto padre creado: {product.name}")
            
            # 8. Crear Variantes (combinaciones de talle y color)
            print("\n🔀 Creando variantes de producto...")
            variantes_creadas = 0
            for talle in talles[:3]:  # Solo XS, S, M para no saturar
                for color in colores[:2]:  # Solo Negro y Blanco
                    variant = ProductVariant(
                        variant_id=uuid4(),
                        product_id=product.product_id,
                        tienda_id=tienda.id,
                        sku=f"{product.base_sku}-{color.name.upper()[:3]}-{talle.name}",
                        size_id=talle.id,
                        color_id=color.id,
                        price=12990.0,  # $12.990
                        barcode=f"77{variantes_creadas:010d}",
                        is_active=True,
                        created_at=datetime.utcnow()
                    )
                    session.add(variant)
                    await session.flush()
                    
                    # 9. Crear Stock Inicial en Inventory Ledger
                    initial_stock = InventoryLedger(
                        transaction_id=uuid4(),
                        tienda_id=tienda.id,
                        variant_id=variant.variant_id,
                        location_id=location.location_id,
                        delta=10.0,  # 10 unidades iniciales
                        transaction_type="INITIAL_STOCK",
                        reference_doc="INIT-001",
                        notes=f"Stock inicial de {variant.sku}",
                        occurred_at=datetime.utcnow(),
                        created_by=admin_user.id
                    )
                    session.add(initial_stock)
                    variantes_creadas += 1
            
            print(f"   ✅ {variantes_creadas} variantes creadas con stock inicial")
            
            # Commit de todos los cambios
            await session.commit()
            
            print("\n" + "=" * 80)
            print("✅ INICIALIZACIÓN COMPLETADA EXITOSAMENTE!")
            print("=" * 80)
            print("\n📊 RESUMEN:")
            print(f"   • Tienda: {tienda.nombre}")
            print(f"   • Usuario: {admin_user.email} / admin123")
            print(f"   • Cliente: {cliente.nombre}")
            print(f"   • Talles: {len(talles)}")
            print(f"   • Colores: {len(colores)}")
            print(f"   • Ubicación: {location.name}")
            print(f"   • Producto: {product.name}")
            print(f"   • Variantes: {variantes_creadas}")
            print(f"   • Stock total: {variantes_creadas * 10} unidades")
            
            print("\n🎯 PRÓXIMOS PASOS:")
            print("   1. Iniciar el servidor: uvicorn main:app --reload")
            print("   2. Acceder a la documentación: http://localhost:8000/docs")
            print("   3. Login con: admin@blend.com / admin123")
            print("   4. Explorar endpoints de productos, ventas, inventory")
            
            return True
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error durante la inicialización: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            await engine.dispose()

if __name__ == "__main__":
    result = asyncio.run(init_demo_data())
    exit(0 if result else 1)
