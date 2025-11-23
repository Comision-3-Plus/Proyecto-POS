"""
Script para resetear el password del admin en Supabase
"""
import asyncio
import asyncpg
from passlib.context import CryptContext

# Configuración de Supabase (del .env)
POSTGRES_SERVER = "aws-1-us-east-2.pooler.supabase.com"
POSTGRES_USER = "postgres.kdqfohbtxlmykjubxqok"
POSTGRES_PASSWORD = "Juani2006"
POSTGRES_DB = "postgres"
POSTGRES_PORT = 5432

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_admin_password():
    """Resetea el password del admin a 'password123'"""
    
    # Generar nuevo hash
    new_password = "password123"
    new_hash = pwd_context.hash(new_password)
    
    print(f"🔐 Nuevo hash generado: {new_hash[:50]}...")
    
    # Conectar a Supabase
    conn = await asyncpg.connect(
        host=POSTGRES_SERVER,
        port=POSTGRES_PORT,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        database=POSTGRES_DB,
    )
    
    try:
        # Verificar si existe el usuario
        existing = await conn.fetchrow(
            "SELECT id, email, hashed_password FROM users WHERE email = 'admin@test.com'"
        )
        
        if existing:
            print(f"✅ Usuario encontrado: {existing['email']}")
            print(f"📝 Hash actual: {existing['hashed_password'][:50]}...")
            
            # Actualizar password
            await conn.execute(
                "UPDATE users SET hashed_password = $1 WHERE email = 'admin@test.com'",
                new_hash
            )
            print(f"✅ Password actualizado exitosamente")
            
            # Verificar
            updated = await conn.fetchrow(
                "SELECT email, hashed_password FROM users WHERE email = 'admin@test.com'"
            )
            print(f"✅ Hash verificado: {updated['hashed_password'][:50]}...")
            
        else:
            print("❌ Usuario admin@test.com no existe en Supabase")
            print("🔧 Creando usuario...")
            
            # Crear usuario con tienda
            tienda = await conn.fetchrow(
                "SELECT id FROM tiendas LIMIT 1"
            )
            
            if not tienda:
                print("❌ No hay tiendas en la BD. Creando una...")
                tienda = await conn.fetchrow(
                    """
                    INSERT INTO tiendas (nombre, direccion, telefono, email, rubro)
                    VALUES ('Mi Tienda Demo', 'Calle Falsa 123', '1234567890', 'tienda@test.com', 'COMIDA')
                    RETURNING id
                    """
                )
                print(f"✅ Tienda creada: {tienda['id']}")
            
            # Crear usuario admin
            await conn.execute(
                """
                INSERT INTO users (email, hashed_password, nombre_completo, rol, tienda_id, is_active)
                VALUES ('admin@test.com', $1, 'Administrador', 'admin', $2, true)
                """,
                new_hash,
                tienda['id']
            )
            print(f"✅ Usuario admin@test.com creado exitosamente")
        
        print("\n🎉 Ahora podés loguearte con:")
        print("   Email: admin@test.com")
        print("   Password: password123")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(reset_admin_password())
