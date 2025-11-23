#!/usr/bin/env python3
"""
Script para crear usuario Pedro para Carnicería Pedro
"""
import asyncio
from sqlalchemy import select
from app.core.db import get_session
from app.models import User, Tienda
from app.core.security import get_password_hash
import uuid

async def main():
    # Buscar tienda "Carnicería Pedro"
    carniceria_tienda_id = uuid.UUID("62af4350-7ecd-40d3-ae8e-7d3f4e26ee64")
    
    async for db in get_session():
        # Verificar si ya existe el usuario
        result = await db.execute(select(User).where(User.email == "pedro@carniceria.com"))
        existing = result.scalar_one_or_none()
        
        if existing:
            print("❌ Usuario pedro@carniceria.com ya existe")
            # Actualizar password
            existing.hashed_password = get_password_hash("pedro123")
            await db.commit()
            print("✅ Contraseña actualizada a 'pedro123'")
            return
        
        # Verificar tienda
        result = await db.execute(select(Tienda).where(Tienda.id == carniceria_tienda_id))
        tienda = result.scalar_one_or_none()
        
        if not tienda:
            print("❌ Tienda 'Carnicería Pedro' no encontrada")
            return
        
        # Crear usuario Pedro
        nuevo_usuario = User(
            id=uuid.uuid4(),
            email="pedro@carniceria.com",
            hashed_password=get_password_hash("pedro123"),
            full_name="Pedro López",
            rol="admin",
            tienda_id=carniceria_tienda_id,
            is_active=True
        )
        
        db.add(nuevo_usuario)
        await db.commit()
        await db.refresh(nuevo_usuario)
        
        print(f"✅ Usuario creado exitosamente:")
        print(f"   Email: {nuevo_usuario.email}")
        print(f"   Contraseña: pedro123")
        print(f"   Nombre: {nuevo_usuario.full_name}")
        print(f"   Rol: {nuevo_usuario.rol}")
        print(f"   Tienda: {tienda.nombre}")

if __name__ == "__main__":
    asyncio.run(main())
