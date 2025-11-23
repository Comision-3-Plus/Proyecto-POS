#!/usr/bin/env python3
"""
Script para verificar usuario admin y su tienda
"""
import asyncio
from sqlalchemy import select
from app.core.db import get_session
from app.models import User, Tienda

async def main():
    async for db in get_session():
        # Buscar admin
        result = await db.execute(select(User).where(User.email == "admin@test.com"))
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ Usuario admin@test.com no encontrado")
            return
        
        print(f"✅ Usuario: {user.email}")
        print(f"   Nombre: {user.full_name}")
        print(f"   Rol: {user.rol}")
        print(f"   Tienda ID: {user.tienda_id}")
        
        # Buscar tienda
        result = await db.execute(select(Tienda).where(Tienda.id == user.tienda_id))
        tienda = result.scalar_one_or_none()
        
        if tienda:
            print(f"   Tienda: {tienda.nombre}")
            print(f"   Rubro: {tienda.rubro}")

if __name__ == "__main__":
    asyncio.run(main())
