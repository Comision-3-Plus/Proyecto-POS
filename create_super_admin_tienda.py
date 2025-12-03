"""
Script para crear super admin y tienda de ropa demo
Ejecutar: python create_super_admin_tienda.py
"""

import sys
from pathlib import Path

# Agregar core-api al path
sys.path.insert(0, str(Path(__file__).parent / "core-api"))

from sqlmodel import Session, select, create_engine
from models import User, Tienda, Product, ProductVariant
from schemas_models.retail_models import ProductCategory
from core.security import get_password_hash
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Crear engine sincrónico (psycopg2) - credentials from .env.docker
sync_db_url = "postgresql://nexuspos:nexuspos_secret_2025@localhost:5432/nexus_pos"
engine = create_engine(sync_db_url, echo=False)


def create_super_admin_and_store():
    """Crea super admin y tienda de ropa con productos"""
    
    with Session(engine) as session:
        # 1. Verificar si ya existe el admin
        existing_admin = session.exec(
            select(User).where(User.email == "admin@nexuspos.com")
        ).first()
        
        if existing_admin:
            print("⚠️  Super admin ya existe")
            admin = existing_admin
        else:
            # Crear super admin
            admin = User(
                user_id=str(uuid.uuid4()),
                email="admin@nexuspos.com",
                username="superadmin",
                full_name="Super Admin",
                hashed_password=get_password_hash("admin123"),
                dni="00000000",
                is_active=True,
                is_superuser=True,
                role="admin",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
            print(f"✅ Super admin creado: {admin.email}")
        
        # 2. Crear tienda de ropa
        existing_tienda = session.exec(
            select(Tienda).where(Tienda.nombre == "Boutique NexusPOS")
        ).first()
        
        if existing_tienda:
            print("⚠️  Tienda ya existe")
            tienda = existing_tienda
        else:
            tienda = Tienda(
                tienda_id=str(uuid.uuid4()),
                nombre="Boutique NexusPOS",
                direccion="Av. Moda 123, CABA",
                telefono="+54 11 4567-8900",
                email="ventas@boutiquenexus.com",
                cuit="20-12345678-9",
                razon_social="NexusPOS Moda SRL",
                timezone="America/Argentina/Buenos_Aires",
                moneda="ARS",
                owner_id=admin.user_id,
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(tienda)
            session.commit()
            session.refresh(tienda)
            print(f"✅ Tienda creada: {tienda.nombre}")
        
        # Asignar tienda al admin si no la tiene
        if admin.tienda_id != tienda.tienda_id:
            admin.tienda_id = tienda.tienda_id
            session.add(admin)
            session.commit()
            print(f"✅ Admin asignado a tienda: {tienda.nombre}")
        
        # 3. Crear categorías
        categorias_data = [
            {"nombre": "Remeras", "descripcion": "Remeras y camisetas"},
            {"nombre": "Pantalones", "descripcion": "Pantalones y jeans"},
            {"nombre": "Vestidos", "descripcion": "Vestidos y faldas"},
            {"nombre": "Camperas", "descripcion": "Camperas y abrigos"},
            {"nombre": "Accesorios", "descripcion": "Accesorios de moda"},
        ]
        
        categorias = {}
        for cat_data in categorias_data:
            existing_cat = session.exec(
                select(ProductCategory).where(
                    ProductCategory.name == cat_data["nombre"],
                    ProductCategory.tienda_id == tienda.tienda_id
                )
            ).first()
            
            if existing_cat:
                categorias[cat_data["nombre"]] = existing_cat
            else:
                cat = ProductCategory(
                    category_id=str(uuid.uuid4()),
                    name=cat_data["nombre"],
                    description=cat_data["descripcion"],
                    tienda_id=tienda.tienda_id,
                    is_active=True,
                    created_at=datetime.now(timezone.utc)
                )
                session.add(cat)
                categorias[cat_data["nombre"]] = cat
        
        session.commit()
        print(f"✅ Categorías creadas: {len(categorias)}")
        
        # 4. Crear productos de ropa
        productos_data = [
            {
                "nombre": "Remera Básica Blanca",
                "categoria": "Remeras",
                "descripcion": "Remera de algodón 100%, corte clásico",
                "precio": 5500.00,
                "stock": 50,
                "sku": "REM-BAS-BL-001"
            },
            {
                "nombre": "Remera Estampada",
                "categoria": "Remeras",
                "descripcion": "Remera con estampado exclusivo",
                "precio": 7200.00,
                "stock": 30,
                "sku": "REM-EST-001"
            },
            {
                "nombre": "Jean Skinny Negro",
                "categoria": "Pantalones",
                "descripcion": "Jean elastizado, tiro medio",
                "precio": 15900.00,
                "stock": 25,
                "sku": "JEAN-SKI-NEG-001"
            },
            {
                "nombre": "Jean Relaxed Azul",
                "categoria": "Pantalones",
                "descripcion": "Jean corte relajado, 100% algodón",
                "precio": 14500.00,
                "stock": 20,
                "sku": "JEAN-REL-AZ-001"
            },
            {
                "nombre": "Vestido Floral",
                "categoria": "Vestidos",
                "descripcion": "Vestido midi con estampado floral",
                "precio": 12800.00,
                "stock": 15,
                "sku": "VEST-FLO-001"
            },
            {
                "nombre": "Vestido Negro Elegante",
                "categoria": "Vestidos",
                "descripcion": "Vestido largo de gala",
                "precio": 22000.00,
                "stock": 8,
                "sku": "VEST-NEG-ELE-001"
            },
            {
                "nombre": "Campera Denim",
                "categoria": "Camperas",
                "descripcion": "Campera de jean clásica",
                "precio": 18500.00,
                "stock": 12,
                "sku": "CAMP-DEN-001"
            },
            {
                "nombre": "Campera Cuero Eco",
                "categoria": "Camperas",
                "descripcion": "Campera de cuero ecológico",
                "precio": 28000.00,
                "stock": 6,
                "sku": "CAMP-CUE-001"
            },
            {
                "nombre": "Bufanda Lana",
                "categoria": "Accesorios",
                "descripcion": "Bufanda tejida en lana merino",
                "precio": 4500.00,
                "stock": 40,
                "sku": "ACC-BUF-LAN-001"
            },
            {
                "nombre": "Cartera Cuero",
                "categoria": "Accesorios",
                "descripcion": "Cartera de cuero genuino",
                "precio": 32000.00,
                "stock": 10,
                "sku": "ACC-CART-CUE-001"
            },
        ]
        
        productos_creados = 0
        for prod_data in productos_data:
            # Verificar si ya existe
            existing_prod = session.exec(
                select(Product).where(
                    Product.base_sku == prod_data["sku"],
                    Product.tienda_id == tienda.tienda_id
                )
            ).first()
            
            if existing_prod:
                continue
            
            # Crear producto
            categoria = categorias[prod_data["categoria"]]
            producto = Product(
                product_id=str(uuid.uuid4()),
                name=prod_data["nombre"],
                description=prod_data["descripcion"],
                base_sku=prod_data["sku"],
                category=prod_data["categoria"],
                category_id=categoria.category_id,
                tienda_id=tienda.tienda_id,
                is_active=True,
                is_variant=False,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(producto)
            session.flush()
            
            # Crear variante por defecto
            variante = ProductVariant(
                variant_id=str(uuid.uuid4()),
                product_id=producto.product_id,
                sku=prod_data["sku"],
                price=prod_data["precio"],
                cost=prod_data["precio"] * 0.6,  # Costo = 60% del precio
                stock_total=prod_data["stock"],
                stock_disponible=prod_data["stock"],
                is_active=True,
                tienda_id=tienda.tienda_id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(variante)
            productos_creados += 1
        
        session.commit()
        print(f"✅ Productos creados: {productos_creados}")
        
        print("\n" + "="*60)
        print("✅ SETUP COMPLETADO")
        print("="*60)
        print(f"\n🔐 Credenciales Super Admin:")
        print(f"   Email: admin@nexuspos.com")
        print(f"   Password: admin123")
        print(f"\n🏪 Tienda: {tienda.nombre}")
        print(f"   ID: {tienda.tienda_id}")
        print(f"   Productos: {productos_creados}")
        print(f"   Categorías: {len(categorias)}")
        print("\n" + "="*60)


if __name__ == "__main__":
    create_super_admin_and_store()
