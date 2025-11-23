import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    # Poner tienda_id = NULL para super_admin (pueden ver todo)
    result = await conn.execute(
        "UPDATE users SET tienda_id = NULL WHERE rol = 'super_admin'"
    )
    print(f'✅ {result}')
    
    # Verificar
    user = await conn.fetchrow(
        'SELECT email, full_name, rol, tienda_id FROM users WHERE email = $1',
        'admin@test.com'
    )
    print(f'✅ Usuario: {user["email"]} - Rol: {user["rol"]} - Tienda: {user["tienda_id"]}')
    
    await conn.close()

asyncio.run(main())
