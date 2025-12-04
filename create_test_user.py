"""
Script para crear un usuario de prueba si no existe
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio core-api al path
core_api_path = Path(__file__).parent / "core-api"
sys.path.insert(0, str(core_api_path))

from sqlmodel import select
from core.database import get_session_local
from models import User, Tienda
from core.security import hash_password


async def create_test_user():
    """Crea un usuario de prueba para testing"""
    async with get_session_local() as session:
        # Verificar si ya existe el usuario
        result = await session.execute(
            select(User).where(User.email == "admin@test.com")
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print("✅ Usuario de prueba ya existe:")
            print(f"   Email: admin@test.com")
            print(f"   Password: admin123")
            print(f"   Tienda: {existing_user.tienda.nombre if existing_user.tienda else 'Sin tienda'}")
            return
        
        # Buscar una tienda existente o crear una
        result = await session.execute(select(Tienda).limit(1))
        tienda = result.scalar_one_or_none()
        
        if not tienda:
            print("⚠️  No hay tiendas en la base de datos.")
            print("   Por favor, registra una tienda primero en: http://localhost:3000/register")
            return
        
        # Crear usuario de prueba
        user = User(
            full_name="Administrador Test",
            email="admin@test.com",
            dni="12345678",
            password_hash=hash_password("admin123"),
            rol="admin",
            is_active=True,
            tienda_id=tienda.tienda_id
        )
        
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        print("✅ Usuario de prueba creado exitosamente:")
        print(f"   Email: admin@test.com")
        print(f"   Password: admin123")
        print(f"   Tienda: {tienda.nombre}")


if __name__ == "__main__":
    asyncio.run(create_test_user())
