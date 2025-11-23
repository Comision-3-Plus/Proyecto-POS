import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    # Ver todos los usuarios
    users = await conn.fetch('SELECT * FROM users LIMIT 5')
    print(f'📋 Usuarios en Supabase:')
    for user in users:
        print(f'  - {dict(user)}')
    
    # Ver estructura de la tabla
    columns = await conn.fetch("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
    """)
    print(f'\n📋 Columnas de la tabla users:')
    for col in columns:
        print(f'  - {col["column_name"]}: {col["data_type"]}')
    
    await conn.close()

asyncio.run(main())
