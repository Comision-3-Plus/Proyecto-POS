import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_admin_password():
    engine = create_async_engine(
        'postgresql+asyncpg://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        }
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    email = "admin@nexuspos.com"
    new_password = "admin123"
    
    async with async_session() as session:
        # Buscar usuario
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print(f'❌ Usuario {email} no encontrado')
            return
        
        # Actualizar contraseña
        hashed_password = pwd_context.hash(new_password)
        stmt = update(User).where(User.email == email).values(hashed_password=hashed_password)
        await session.execute(stmt)
        await session.commit()
        
        print(f'✅ Contraseña actualizada para {email}')
        print(f'   Nueva contraseña: {new_password}')
        print(f'   Tienda: {user.tienda_id}')

asyncio.run(reset_admin_password())
