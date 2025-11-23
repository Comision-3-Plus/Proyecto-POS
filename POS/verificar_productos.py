import asyncio
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models import Producto

async def verificar_productos():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Producto))
        productos = result.scalars().all()
        print(f"\n{'='*50}")
        print(f"✓ Productos en Supabase: {len(productos)}")
        print(f"{'='*50}\n")
        
        for p in productos[:5]:
            print(f"  - {p.sku}: {p.nombre} (Stock: {p.stock_actual})")
        
        if len(productos) > 5:
            print(f"\n  ... y {len(productos) - 5} más")

asyncio.run(verificar_productos())
