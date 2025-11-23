"""Actualizar password del usuario admin"""
import asyncio
from app.core.db import get_session
from app.models import User
from app.core.security import get_password_hash

async def update_user():
    async for session in get_session():
        user = await session.get(User, "11111111-1111-1111-1111-111111111111")
        if user:
            user.hashed_password = get_password_hash("password123")
            await session.commit()
            print(f"✓ Usuario actualizado: {user.email}")
            print(f"  Hash preview: {user.hashed_password[:30]}...")
        else:
            print("✗ Usuario no encontrado")
        break

if __name__ == "__main__":
    asyncio.run(update_user())
