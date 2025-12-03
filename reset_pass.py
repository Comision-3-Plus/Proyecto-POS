import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from models import User
from core.security import get_password_hash

async def reset():
    engine = create_async_engine(
        'postgresql+asyncpg://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        }
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        stmt = select(User).where(User.email == 'admin@nexuspos.com')
        result = await session.execute(stmt)
        admin = result.scalar_one_or_none()
        
        if not admin:
            print('❌ Usuario no encontrado')
            return
        
        print(f'✅ Usuario: {admin.email}')
        print(f'   Nombre: {admin.full_name}')
        
        new_hash = get_password_hash('admin123')
        admin.hashed_password = new_hash
        session.add(admin)
        await session.commit()
        
        print('✅ Contraseña actualizada a: admin123')

asyncio.run(reset())
