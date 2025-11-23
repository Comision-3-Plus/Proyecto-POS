#!/usr/bin/env python3
"""
Script para mover productos a la tienda 'Sistema Nexus POS'
"""
import asyncio
from sqlalchemy import select, update
from app.core.db import get_session
from app.models import Producto, Tienda, User
import uuid

async def main():
    # Buscar tienda "Sistema Nexus POS"
    sistema_tienda_id = uuid.UUID("fc5156c2-23f3-4f81-9970-c36e9bc78f8c")
    
    async for db in get_session():
        # Verificar tienda
        result = await db.execute(select(Tienda).where(Tienda.id == sistema_tienda_id))
        tienda = result.scalar_one_or_none()
        
        if not tienda:
            print("❌ Tienda 'Sistema Nexus POS' no encontrada")
            return
        
        print(f"✅ Tienda encontrada: {tienda.nombre}")
        
        # Actualizar todos los productos a esta tienda
        stmt = update(Producto).values(tienda_id=sistema_tienda_id)
        result = await db.execute(stmt)
        await db.commit()
        
        print(f"✅ {result.rowcount} productos actualizados a tienda '{tienda.nombre}'")
        
        # Verificar
        result = await db.execute(select(Producto))
        productos = result.scalars().all()
        print(f"\n✅ Total productos en '{tienda.nombre}': {len(productos)}")

if __name__ == "__main__":
    asyncio.run(main())
