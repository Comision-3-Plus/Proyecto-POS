import asyncio
import asyncpg
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    # Hash para 'password123'
    password_hash = pwd_context.hash('password123')
    print(f'🔐 Hash generado: {password_hash[:50]}...')
    
    # Verificar/crear tienda
    tienda = await conn.fetchrow('SELECT id, nombre FROM tiendas LIMIT 1')
    if not tienda:
        print('📦 Creando tienda...')
        tienda = await conn.fetchrow("""
            INSERT INTO tiendas (nombre, direccion, telefono, email, rubro)
            VALUES ('Mi Tienda Demo', 'Calle Falsa 123', '1234567890', 'tienda@test.com', 'COMIDA')
            RETURNING id, nombre
        """)
        print(f'✅ Tienda creada: {tienda["nombre"]}')
    else:
        print(f'✅ Tienda encontrada: {tienda["nombre"]}')
    
    # Verificar si ya existe el usuario
    existing = await conn.fetchrow('SELECT email FROM users WHERE email = $1', 'admin@test.com')
    
    if existing:
        print(f'⚠️  Usuario ya existe, actualizando password...')
        await conn.execute(
            'UPDATE users SET hashed_password = $1 WHERE email = $2',
            password_hash,
            'admin@test.com'
        )
        print(f'✅ Password actualizado')
    else:
        print(f'👤 Creando usuario admin...')
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, rol, tienda_id, is_active)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        """, 'admin@test.com', password_hash, 'Administrador', 'admin', tienda['id'], True)
        print(f'✅ Usuario admin creado')
    
    # Verificar
    user = await conn.fetchrow('SELECT email, full_name, rol FROM users WHERE email = $1', 'admin@test.com')
    print(f'\n🎉 Listo! Podés loguearte con:')
    print(f'   Email: {user["email"]}')
    print(f'   Password: password123')
    print(f'   Rol: {user["rol"]}')
    
    await conn.close()

asyncio.run(main())
