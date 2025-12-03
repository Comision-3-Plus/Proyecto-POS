import asyncio
import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update, text

async def fix_admin_password():
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
        # Hash con bcrypt directamente
        password_bytes = new_password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        hashed_str = hashed.decode('utf-8')
        
        print(f'🔐 Nuevo hash generado: {hashed_str[:50]}...')
        
        # Actualizar usando SQL directo
        query = text("""
            UPDATE users 
            SET hashed_password = :pwd 
            WHERE email = :email
        """)
        
        await session.execute(query, {"pwd": hashed_str, "email": email})
        await session.commit()
        
        print(f'✅ Contraseña actualizada para {email}')
        print(f'   Email: {email}')
        print(f'   Password: {new_password}')

asyncio.run(fix_admin_password())
