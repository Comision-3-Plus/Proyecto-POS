#!/usr/bin/env python3
"""
Script para verificar productos en Supabase
"""
import asyncio
from sqlalchemy import select
from app.core.db import get_session
from app.models import Producto

async def main():
    async for db in get_session():
        result = await db.execute(select(Producto))
        productos = result.scalars().all()
        
        print(f"✅ Total productos en DB: {len(productos)}")
        print("")
        
        for p in productos:
            print(f"- {p.nombre}")
            print(f"  SKU: {p.sku}")
            print(f"  Precio Venta: ${p.precio_venta}")
            print(f"  Stock: {p.stock_actual}")
            print(f"  Tipo: {p.tipo}")
            print(f"  Tienda ID: {p.tienda_id}")
            print("")

if __name__ == "__main__":
    asyncio.run(main())
