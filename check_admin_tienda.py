"""
Verificar si el admin tiene tienda asignada
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_admin():
    engine = create_async_engine(
        'postgresql+asyncpg://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        connect_args={
            'ssl': 'require',
            'prepared_statement_cache_size': 0
        }
    )
    
    async with engine.begin() as conn:
        # Verificar usuario admin
        result = await conn.execute(
            text('SELECT id, email, full_name, tienda_id, is_active FROM users WHERE email = :email'),
            {'email': 'admin@nexuspos.com'}
        )
        row = result.fetchone()
        
        if row:
            print(f'✓ Usuario encontrado:')
            print(f'  ID: {row[0]}')
            print(f'  Email: {row[1]}')
            print(f'  Nombre: {row[2]}')
            print(f'  Tienda ID: {row[3]}')
            print(f'  Activo: {row[4]}')
            
            if row[3]:
                # Verificar tienda
                tienda_result = await conn.execute(
                    text('SELECT id, nombre, rubro, is_active FROM tiendas WHERE id = :id'),
                    {'id': row[3]}
                )
                tienda = tienda_result.fetchone()
                
                if tienda:
                    print(f'\n✓ Tienda asignada:')
                    print(f'  ID: {tienda[0]}')
                    print(f'  Nombre: {tienda[1]}')
                    print(f'  Rubro: {tienda[2]}')
                    print(f'  Activa: {tienda[3]}')
                else:
                    print('\n✗ ERROR: Tienda ID existe pero no se encuentra en la tabla tiendas')
            else:
                print('\n✗ PROBLEMA: Usuario NO tiene tienda asignada (tienda_id es NULL)')
                
                # Buscar si hay alguna tienda en la base de datos
                tiendas_result = await conn.execute(text('SELECT id, nombre FROM tiendas LIMIT 5'))
                tiendas = tiendas_result.fetchall()
                
                if tiendas:
                    print(f'\nTiendas disponibles en la base de datos:')
                    for t in tiendas:
                        print(f'  - {t[1]} (ID: {t[0]})')
                else:
                    print('\n✗ No hay tiendas en la base de datos')
        else:
            print('✗ Usuario admin@nexuspos.com no encontrado')
    
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(check_admin())
