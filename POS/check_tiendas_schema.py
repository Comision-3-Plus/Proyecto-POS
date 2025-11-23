import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    columns = await conn.fetch("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tiendas'
        ORDER BY ordinal_position
    """)
    
    print('📋 Estructura de la tabla tiendas:')
    for col in columns:
        print(f'  - {col["column_name"]}: {col["data_type"]}')
    
    await conn.close()

asyncio.run(main())
