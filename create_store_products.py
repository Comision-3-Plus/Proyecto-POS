"""
Script para crear una tienda de ropa con gran cantidad de productos en Supabase
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from models import User, Tienda, Product, ProductVariant, Location
from schemas_models.retail_models import ProductCategory
from uuid import uuid4
from datetime import datetime, timezone
import random

DATABASE_URL = "postgresql+asyncpg://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Datos para generar productos variados
CATEGORIAS = [
    {"nombre": "Remeras", "descripcion": "Remeras y camisetas"},
    {"nombre": "Pantalones", "descripcion": "Pantalones, jeans y joggers"},
    {"nombre": "Vestidos", "descripcion": "Vestidos y faldas"},
    {"nombre": "Camperas", "descripcion": "Camperas, buzos y abrigos"},
    {"nombre": "Shorts", "descripcion": "Shorts y bermudas"},
    {"nombre": "Camisas", "descripcion": "Camisas y blusas"},
    {"nombre": "Sweaters", "descripcion": "Sweaters y pullovers"},
    {"nombre": "Zapatillas", "descripcion": "Calzado deportivo"},
    {"nombre": "Accesorios", "descripcion": "Carteras, cintos y más"},
    {"nombre": "Ropa Interior", "descripcion": "Ropa interior y medias"},
]

PRODUCTOS_BASE = {
    "Remeras": [
        ("Remera Básica", ["Blanca", "Negra", "Gris", "Azul marino", "Roja"]),
        ("Remera Estampada", ["Flores", "Rayas", "Puntos", "Abstracto"]),
        ("Remera Oversize", ["Blanca", "Negra", "Verde", "Rosa"]),
        ("Remera Deportiva", ["Azul", "Negra", "Gris", "Fucsia"]),
        ("Remera Manga Larga", ["Blanca", "Negra", "Gris", "Bordo"]),
        ("Remera Cuello V", ["Blanca", "Negra", "Azul", "Verde"]),
        ("Remera Crop Top", ["Blanca", "Negra", "Rosa", "Lila"]),
    ],
    "Pantalones": [
        ("Jean Skinny", ["Azul claro", "Azul oscuro", "Negro", "Gris"]),
        ("Jean Mom", ["Azul claro", "Azul medio", "Negro"]),
        ("Jean Relaxed", ["Azul", "Negro", "Beige"]),
        ("Pantalón Cargo", ["Verde militar", "Negro", "Beige", "Gris"]),
        ("Jogger", ["Negro", "Gris", "Azul marino", "Verde"]),
        ("Pantalón de Vestir", ["Negro", "Gris", "Azul marino", "Beige"]),
        ("Calza Deportiva", ["Negro", "Gris", "Azul", "Fucsia"]),
        ("Short Jean", ["Azul claro", "Azul oscuro", "Negro"]),
    ],
    "Vestidos": [
        ("Vestido Midi Floral", ["Rojo", "Azul", "Verde", "Rosa"]),
        ("Vestido Largo Elegante", ["Negro", "Azul marino", "Bordo", "Verde"]),
        ("Vestido Corto Casual", ["Blanco", "Negro", "Rosa", "Celeste"]),
        ("Vestido Camisero", ["Beige", "Blanco", "Azul", "Verde"]),
        ("Vestido Fiesta", ["Negro", "Rojo", "Dorado", "Plateado"]),
    ],
    "Camperas": [
        ("Campera Denim", ["Azul claro", "Azul oscuro", "Negro"]),
        ("Campera Cuero Eco", ["Negro", "Marrón", "Bordo"]),
        ("Buzo Canguro", ["Negro", "Gris", "Azul", "Verde"]),
        ("Campera Inflable", ["Negro", "Azul", "Rojo", "Verde"]),
        ("Sweater Oversize", ["Beige", "Gris", "Negro", "Camel"]),
        ("Cardigan", ["Beige", "Gris", "Negro", "Bordo"]),
    ],
    "Shorts": [
        ("Short Deportivo", ["Negro", "Gris", "Azul", "Verde"]),
        ("Bermuda Cargo", ["Verde militar", "Beige", "Gris", "Negro"]),
        ("Short de Vestir", ["Negro", "Beige", "Azul marino"]),
    ],
    "Camisas": [
        ("Camisa Oxford", ["Blanca", "Celeste", "Rosa", "Gris"]),
        ("Camisa Jean", ["Azul claro", "Azul oscuro"]),
        ("Blusa Elegante", ["Blanca", "Negra", "Rosa", "Seda beige"]),
        ("Camisa Lino", ["Blanca", "Beige", "Celeste", "Rosa"]),
    ],
    "Sweaters": [
        ("Sweater Lana", ["Beige", "Gris", "Negro", "Camel", "Bordo"]),
        ("Sweater Cachemir", ["Gris", "Negro", "Azul", "Beige"]),
        ("Pullover Cuello Alto", ["Negro", "Gris", "Beige", "Bordo"]),
    ],
    "Zapatillas": [
        ("Zapatillas Running", ["Negro/Blanco", "Azul", "Rosa", "Gris"]),
        ("Zapatillas Urbanas", ["Blanco", "Negro", "Gris"]),
        ("Zapatillas Lona", ["Blanco", "Negro", "Azul", "Rojo"]),
    ],
    "Accesorios": [
        ("Cartera Cuero", ["Negro", "Marrón", "Camel", "Bordo"]),
        ("Mochila Urbana", ["Negro", "Gris", "Azul", "Verde"]),
        ("Cinto Cuero", ["Negro", "Marrón"]),
        ("Bufanda Lana", ["Gris", "Negro", "Beige", "Bordo"]),
        ("Gorra", ["Negro", "Azul", "Blanco", "Rojo"]),
    ],
    "Ropa Interior": [
        ("Pack Boxer x3", ["Negro", "Gris", "Azul"]),
        ("Pack Medias x5", ["Negro", "Blanco", "Gris"]),
        ("Conjunto Ropa Interior", ["Negro", "Blanco", "Rosa", "Azul"]),
    ],
}

TALLES = ["XS", "S", "M", "L", "XL", "XXL"]
COLORES = ["Blanco", "Negro", "Gris", "Azul", "Rojo", "Verde", "Rosa", "Amarillo", "Naranja", "Violeta"]

async def create_store_with_products():
    """Crear tienda con productos"""
    
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        }
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Buscar el usuario admin
        stmt = select(User).where(User.email == 'admin@nexuspos.com')
        result = await session.execute(stmt)
        admin = result.scalar_one_or_none()
        
        if not admin:
            print('❌ Usuario admin no encontrado')
            return
        
        print(f'✅ Usuario: {admin.email}')
        
        # 2. Obtener la tienda del admin
        await session.refresh(admin, ["tienda"])
        tienda = admin.tienda
        
        print(f'✅ Tienda: {tienda.nombre}')
        
        # 3. Obtener o crear ubicación
        stmt = select(Location).where(Location.tienda_id == tienda.id)
        result = await session.execute(stmt)
        location = result.scalar_one_or_none()
        
        if not location:
            location = Location(
                location_id=uuid4(),
                tienda_id=tienda.id,
                name="Local Principal",
                type="STORE",
                address="Dirección Principal",
                is_default=True
            )
            session.add(location)
            await session.flush()
        
        print(f'✅ Ubicación: {location.name}')
        
        # 4. Crear categorías
        categorias_dict = {}
        for cat_data in CATEGORIAS:
            stmt = select(ProductCategory).where(
                ProductCategory.name == cat_data["nombre"],
                ProductCategory.tienda_id == tienda.id
            )
            result = await session.execute(stmt)
            categoria = result.scalar_one_or_none()
            
            if not categoria:
                # Generar slug a partir del nombre
                slug = cat_data["nombre"].lower().replace(" ", "-").replace("ñ", "n")
                
                categoria = ProductCategory(
                    id=uuid4(),
                    name=cat_data["nombre"],
                    slug=slug,
                    description=cat_data["descripcion"],
                    tienda_id=tienda.id,
                    is_active=True,
                    sort_order=0,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                session.add(categoria)
            
            categorias_dict[cat_data["nombre"]] = categoria
        
        await session.commit()
        print(f'✅ Categorías creadas: {len(categorias_dict)}')
        
        # 5. Crear productos
        contador = 0
        for categoria_nombre, productos in PRODUCTOS_BASE.items():
            categoria = categorias_dict[categoria_nombre]
            
            for nombre_base, variaciones in productos:
                for variacion in variaciones:
                    # Generar precio aleatorio según categoría
                    if categoria_nombre in ["Zapatillas", "Camperas"]:
                        precio = random.randint(35000, 85000)
                    elif categoria_nombre in ["Pantalones", "Vestidos"]:
                        precio = random.randint(15000, 45000)
                    elif categoria_nombre in ["Accesorios"]:
                        precio = random.randint(8000, 35000)
                    else:
                        precio = random.randint(5000, 25000)
                    
                    nombre_completo = f"{nombre_base} {variacion}"
                    sku_base = f"{categoria_nombre[:3].upper()}-{nombre_base[:3].upper()}-{variacion[:3].upper()}-{contador:04d}"
                    
                    # Crear producto
                    producto = Product(
                        product_id=uuid4(),
                        name=nombre_completo,
                        description=f"{nombre_completo} - Alta calidad",
                        base_sku=sku_base,
                        category_id=categoria.id,  # Solo el ID
                        tienda_id=tienda.id,
                        is_active=True,
                        is_variant=True if categoria_nombre != "Accesorios" else False,
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc)
                    )
                    session.add(producto)
                    await session.flush()
                    
                    # Crear variantes (si aplica)
                    if categoria_nombre in ["Remeras", "Pantalones", "Vestidos", "Camperas", "Shorts", "Camisas", "Sweaters"]:
                        # Crear variantes por talle
                        for idx, talle in enumerate(random.sample(TALLES, random.randint(4, 6))):
                            stock = random.randint(5, 50)
                            sku_variante = f"{sku_base}-{talle}-{idx}"
                            
                            variante = ProductVariant(
                                variant_id=uuid4(),
                                product_id=producto.product_id,
                                sku=sku_variante,
                                price=precio,
                                is_active=True,
                                tienda_id=tienda.id,
                                created_at=datetime.now(timezone.utc)
                            )
                            session.add(variante)
                    else:
                        # Producto sin variantes (ej: accesorios)
                        stock = random.randint(10, 100)
                        variante = ProductVariant(
                            variant_id=uuid4(),
                            product_id=producto.product_id,
                            sku=sku_base,
                            price=precio,
                            is_active=True,
                            tienda_id=tienda.id,
                            created_at=datetime.now(timezone.utc)
                        )
                        session.add(variante)
                    
                    contador += 1
                    
                    if contador % 20 == 0:
                        await session.commit()
                        print(f'   Productos creados: {contador}...')
        
        await session.commit()
        print(f'\n✅ Total productos creados: {contador}')
        print(f'✅ Categorías: {len(categorias_dict)}')
        print(f'\n🎉 Tienda "{tienda.nombre}" lista con inventario completo!')

if __name__ == "__main__":
    asyncio.run(create_store_with_products())
