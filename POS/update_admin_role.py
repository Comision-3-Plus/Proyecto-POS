import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    # Actualizar rol de admin@test.com a super_admin
    result = await conn.execute(
        "UPDATE users SET rol = 'super_admin' WHERE email = 'admin@test.com'"
    )
    print(f'✅ {result}')
    
    # Verificar
    user = await conn.fetchrow(
        'SELECT email, full_name, rol FROM users WHERE email = $1',
        'admin@test.com'
    )
    print(f'✅ Usuario: {user["email"]} - {user["full_name"]} - Rol: {user["rol"]}')
    
    await conn.close()

asyncio.run(main())
