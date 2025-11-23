"""
Rutas de Tiendas - Nexus POS
Endpoints para gestión de tiendas
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from core.db import get_session
from api.deps import CurrentUser, CurrentTienda


router = APIRouter(prefix="/tiendas", tags=["Tiendas"])


class TiendaUpdate(BaseModel):
    """Schema para actualizar tienda"""
    nombre: str | None = None
    rubro: str | None = None


@router.get("/me")
async def get_mi_tienda(current_tienda: CurrentTienda) -> dict:
    """
    Obtener información de mi tienda actual
    """
    return {
        "id": str(current_tienda.id),
        "nombre": current_tienda.nombre,
        "rubro": current_tienda.rubro,
        "is_active": current_tienda.is_active,
        "created_at": current_tienda.created_at.isoformat() if current_tienda.created_at else None,
    }


@router.patch("/me")
async def update_mi_tienda(
    update_data: TiendaUpdate,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> dict:
    """
    Actualizar información de mi tienda
    Útil para el onboarding y cambio de rubro
    """
    # Actualizar solo los campos proporcionados
    if update_data.nombre is not None:
        current_tienda.nombre = update_data.nombre
    
    if update_data.rubro is not None:
        current_tienda.rubro = update_data.rubro
    
    # Guardar cambios
    session.add(current_tienda)
    await session.commit()
    await session.refresh(current_tienda)
    
    return {
        "message": "Tienda actualizada exitosamente",
        "tienda": {
            "id": str(current_tienda.id),
            "nombre": current_tienda.nombre,
            "rubro": current_tienda.rubro,
            "is_active": current_tienda.is_active,
        }
    }
