import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from models import User, Tienda

async def check_users():
    engine = create_async_engine(
        'postgresql+asyncpg://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        }
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Listar tiendas
        print('\n🏪 TIENDAS DISPONIBLES:')
        tiendas = await session.execute(select(Tienda))
        for t in tiendas.scalars().all():
            print(f'   - {t.nombre} (ID: {t.id}) - Rubro: {t.rubro}')
        
        # Listar usuarios
        print('\n👤 USUARIOS DISPONIBLES:')
        stmt = select(User)
        result = await session.execute(stmt)
        users = result.scalars().all()
        
        if not users:
            print('   ❌ No hay usuarios en la base de datos')
        else:
            print(f'   Total: {len(users)}')
            for user in users:
                print(f'   - Email: {user.email}')
                print(f'     Nombre: {user.full_name}')
                print(f'     Activo: {user.is_active}')
                print(f'     Tienda ID: {user.tienda_id}')
                print()

asyncio.run(check_users())
