"""
Script para actualizar password de usuario
"""
import asyncio
from app.core.db import AsyncSessionLocal
from app.models import Usuario
from passlib.context import CryptContext
from sqlalchemy import select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def update_password():
    async with AsyncSessionLocal() as db:
        # Obtener usuario
        result = await db.execute(
            select(Usuario).filter(Usuario.email == "pedrito@verduleria.com")
        )
        usuario = result.scalar_one_or_none()
        
        if usuario:
            # Actualizar password
            usuario.password_hash = pwd_context.hash("pedrito123")
            await db.commit()
            print("✅ Password actualizada para pedrito@verduleria.com")
        else:
            print("❌ Usuario no encontrado")


if __name__ == "__main__":
    asyncio.run(update_password())
