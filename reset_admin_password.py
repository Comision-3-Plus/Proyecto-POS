"""
Script para resetear la contraseña del admin en Supabase
"""
import sys
from pathlib import Path
import asyncio

# Agregar core-api al path
sys.path.insert(0, str(Path(__file__).parent / "core-api"))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import User
from core.security import get_password_hash
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# URL de Supabase
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:6543/postgres?ssl=require")

async def reset_admin_password():
    """Resetear la contraseña del admin"""
    
    # Crear engine asíncrono
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Buscar el usuario admin
        statement = select(User).where(User.email == "admin@nexuspos.com")
        result = await session.execute(statement)
        admin = result.scalar_one_or_none()
        
        if not admin:
            print("❌ Usuario admin no encontrado")
            return
        
        print(f"✅ Usuario encontrado: {admin.email}")
        print(f"   ID: {admin.id}")
        print(f"   Nombre: {admin.full_name}")
        print(f"   Activo: {admin.is_active}")
        
        # Actualizar la contraseña
        new_password = "admin123"
        new_hash = get_password_hash(new_password)
        
        admin.hashed_password = new_hash
        session.add(admin)
        await session.commit()
        
        print(f"\n✅ Contraseña actualizada exitosamente!")
        print(f"   Email: admin@nexuspos.com")
        print(f"   Nueva contraseña: {new_password}")

if __name__ == "__main__":
    asyncio.run(reset_admin_password())
