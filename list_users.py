import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from models import User

async def list_users():
    engine = create_async_engine(
        'postgresql+asyncpg://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        }
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Primero verificar que la tabla existe
        check_table = text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')")
        result = await session.execute(check_table)
        exists = result.scalar()
        
        if not exists:
            print('❌ La tabla users no existe en la base de datos')
            return
        
        # Listar todos los usuarios
        statement = select(User)
        result = await session.execute(statement)
        users = result.scalars().all()
        
        if not users:
            print('❌ No hay usuarios en la base de datos')
        else:
            print(f'✅ Usuarios encontrados: {len(users)}')
            for user in users:
                print(f'   - {user.email} ({user.full_name}) - Activo: {user.is_active}')

asyncio.run(list_users())
