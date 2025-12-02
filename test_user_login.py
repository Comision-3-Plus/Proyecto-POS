import asyncio
import sys
sys.path.insert(0, 'core-api')

from core.security import verify_password
from models import User
from sqlmodel import select
from core.db import get_session


async def test_user():
    async for session in get_session():
        result = await session.execute(select(User).where(User.email == 'admin@nexuspos.com'))
        user = result.scalar_one_or_none()
        
        if user:
            print(f'✅ Usuario encontrado: {user.email}')
            print(f'   Full Name: {user.full_name}')
            print(f'   Rol: {user.rol}')
            print(f'   Hash en DB: {user.hashed_password[:50]}...')
            verifica = verify_password('admin123', user.hashed_password)
            print(f'   Verifica correctamente: {verifica}')
        else:
            print('❌ Usuario NO encontrado')
        
        break

if __name__ == "__main__":
    asyncio.run(test_user())
