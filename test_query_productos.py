"""
Test de query SQL para productos
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test():
    engine = create_async_engine(
        'postgresql+asyncpg://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        connect_args={'ssl': 'require', 'prepared_statement_cache_size': 0}
    )
    
    async with engine.begin() as conn:
        result = await conn.execute(
            text('''SELECT product_id, tienda_id, name, base_sku, description, 
                           category, is_active, created_at, updated_at 
                    FROM products LIMIT 1''')
        )
        row = result.fetchone()
        
        if row:
            print("✓ Query ejecutada")
            print(f"\nColumnas: {list(result.keys())}")
            print(f"\nValores:")
            for i, (key, val) in enumerate(zip(result.keys(), row)):
                print(f"  [{i}] {key:15} = {val} (type: {type(val).__name__})")
        else:
            print("No hay productos")
    
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(test())
