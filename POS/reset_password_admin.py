import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    # Actualizar password de admin@test.com
    new_hash = '$2b$12$vZxMBOe3gLio66.G95btvey8IPtW16.f.730ZOMhn9rH6XirQw/Jy'
    
    result = await conn.execute(
        'UPDATE users SET hashed_password = $1 WHERE email = $2',
        new_hash,
        'admin@test.com'
    )
    print(f'✅ {result}')
    
    # Verificar
    user = await conn.fetchrow(
        'SELECT email, full_name, rol, hashed_password FROM users WHERE email = $1',
        'admin@test.com'
    )
    print(f'✅ Usuario: {user["email"]}')
    print(f'✅ Nombre: {user["full_name"]}')
    print(f'✅ Rol: {user["rol"]}')
    print(f'✅ Hash: {user["hashed_password"][:50]}...')
    
    await conn.close()

asyncio.run(main())
