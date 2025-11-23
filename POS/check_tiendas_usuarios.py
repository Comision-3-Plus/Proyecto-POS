import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    print("=== TIENDAS ===")
    tiendas = await conn.fetch('SELECT id, nombre, rubro FROM tiendas')
    for t in tiendas:
        print(f"  {t['nombre']} ({t['rubro']}) - ID: {t['id']}")
    
    print("\n=== USUARIOS ===")
    usuarios = await conn.fetch('SELECT email, full_name, rol, tienda_id FROM users')
    for u in usuarios:
        tienda = next((t for t in tiendas if t['id'] == u['tienda_id']), None)
        tienda_nombre = tienda['nombre'] if tienda else 'Sin tienda'
        print(f"  {u['email']} ({u['full_name']}) - Rol: {u['rol']} - Tienda: {tienda_nombre}")
    
    await conn.close()

asyncio.run(main())
