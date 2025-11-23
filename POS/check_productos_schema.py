import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    columns = await conn.fetch("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'productos'
        ORDER BY ordinal_position
    """)
    
    print('📋 Estructura de la tabla productos:')
    for col in columns:
        nullable = '(nullable)' if col['is_nullable'] == 'YES' else '(NOT NULL)'
        print(f'  - {col["column_name"]}: {col["data_type"]} {nullable}')
    
    await conn.close()

asyncio.run(main())
