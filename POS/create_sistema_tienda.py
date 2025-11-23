import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    # Crear tienda "Sistema" para super_admin
    tienda_sistema = await conn.fetchrow("""
        INSERT INTO tiendas (id, nombre, rubro, is_active)
        VALUES (gen_random_uuid(), 'Sistema Nexus POS', 'sistema', true)
        RETURNING id, nombre
    """)
    
    if not tienda_sistema:
        # Ya existe, obtenerla
        tienda_sistema = await conn.fetchrow(
            "SELECT id, nombre FROM tiendas WHERE nombre = 'Sistema Nexus POS'"
        )
    
    print(f'✅ Tienda Sistema: {tienda_sistema["nombre"]} - ID: {tienda_sistema["id"]}')
    
    # Asignar super_admin a tienda Sistema
    result = await conn.execute(
        "UPDATE users SET tienda_id = $1 WHERE rol = 'super_admin'",
        tienda_sistema['id']
    )
    print(f'✅ {result}')
    
    # Verificar
    user = await conn.fetchrow(
        'SELECT email, full_name, rol, tienda_id FROM users WHERE email = $1',
        'admin@test.com'
    )
    print(f'✅ Usuario actualizado: {user["email"]} - Rol: {user["rol"]}')
    
    await conn.close()

asyncio.run(main())
