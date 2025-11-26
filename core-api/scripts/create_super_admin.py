"""
Script para crear Super Admin para testing
Crea un usuario super_admin con credenciales predefinidas

Uso:
    python scripts/create_super_admin.py
"""
import asyncio
import sys
import os
from uuid import uuid4

# Agregar el directorio raíz al path para imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import select
from core.config import settings
from core.security import get_password_hash
from models import Tienda, User


async def create_super_admin():
    """Crea un super admin para testing"""
    
    print("=" * 60)
    print("🔐 CREANDO SUPER ADMIN PARA TESTING")
    print("=" * 60)
    
    # Crear engine
    engine = create_async_engine(str(settings.DATABASE_URL), echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Verificar si ya existe el super admin
        print("\n🔍 Verificando si ya existe super admin...")
        result = await session.execute(
            select(User).where(User.email == "admin@nexuspos.com")
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("✅ Super Admin ya existe:")
            print(f"   Email: {existing_admin.email}")
            print(f"   Rol: {existing_admin.rol}")
            print(f"   Activo: {existing_admin.is_active}")
            print("\n🔑 Credenciales:")
            print("   Email: admin@nexuspos.com")
            print("   Password: admin123")
            return
        
        # 2. Crear tienda del sistema si no existe
        print("\n🏪 Verificando tienda del sistema...")
        result = await session.execute(
            select(Tienda).where(Tienda.nombre == "Sistema Nexus POS")
        )
        tienda_sistema = result.scalar_one_or_none()
        
        if not tienda_sistema:
            print("   Creando tienda del sistema...")
            tienda_sistema = Tienda(
                id=uuid4(),
                nombre="Sistema Nexus POS",
                rubro="sistema",
                is_active=True
            )
            session.add(tienda_sistema)
            await session.flush()
            print(f"   ✅ Tienda del sistema creada: {tienda_sistema.id}")
        else:
            print(f"   ✅ Tienda del sistema existe: {tienda_sistema.id}")
        
        # 3. Crear super admin
        print("\n👤 Creando Super Admin...")
        super_admin = User(
            id=uuid4(),
            email="admin@nexuspos.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Super Admin",
            rol="super_admin",
            tienda_id=tienda_sistema.id,
            is_active=True
        )
        session.add(super_admin)
        await session.commit()
        
        print("✅ Super Admin creado exitosamente!")
        print("\n" + "=" * 60)
        print("📋 DETALLES DEL SUPER ADMIN")
        print("=" * 60)
        print(f"ID: {super_admin.id}")
        print(f"Email: {super_admin.email}")
        print(f"Rol: {super_admin.rol}")
        print(f"Tienda ID: {super_admin.tienda_id}")
        print(f"Activo: {super_admin.is_active}")
        
        print("\n🔑 CREDENCIALES:")
        print("   Email: admin@nexuspos.com")
        print("   Password: admin123")
        
        print("\n🚀 Ahora puedes ejecutar el test:")
        print("   python test_flow_ledger.py")
        print("=" * 60)
    
    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(create_super_admin())
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
