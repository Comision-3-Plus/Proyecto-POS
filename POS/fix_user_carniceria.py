#!/usr/bin/env python3
"""
Script para mover productos a Carnicería Pedro
"""
import asyncio
from sqlalchemy import select, update
from app.core.db import get_session
from app.models import Producto, Tienda
import uuid

async def main():
    # Buscar tienda "Carnicería Pedro"
    carniceria_tienda_id = uuid.UUID("62af4350-7ecd-40d3-ae8e-7d3f4e26ee64")
    
    async for db in get_session():
        # Verificar tienda
        result = await db.execute(select(Tienda).where(Tienda.id == carniceria_tienda_id))
        tienda = result.scalar_one_or_none()
        
        if not tienda:
            print("❌ Tienda 'Carnicería Pedro' no encontrada")
            return
        
        print(f"✅ Tienda encontrada: {tienda.nombre}")
        
        # Actualizar todos los productos a esta tienda
        stmt = update(Producto).values(tienda_id=carniceria_tienda_id)
        result = await db.execute(stmt)
        await db.commit()
        
        print(f"✅ {result.rowcount} productos actualizados a tienda '{tienda.nombre}'")
        
        # Actualizar usuario admin a esta tienda también
        from app.models import User
        stmt_user = update(User).where(User.email == "admin@test.com").values(tienda_id=carniceria_tienda_id)
        result_user = await db.execute(stmt_user)
        await db.commit()
        
        print(f"✅ Usuario admin@test.com actualizado a tienda '{tienda.nombre}'")

if __name__ == "__main__":
    asyncio.run(main())
