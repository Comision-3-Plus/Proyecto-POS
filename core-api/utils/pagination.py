"""
Paginación Cursor-Based para mejor performance
Más eficiente que offset/limit para datasets grandes
"""
from typing import TypeVar, Generic, Optional, List
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


T = TypeVar('T')


class CursorPaginationParams(BaseModel):
    """Parámetros para paginación cursor-based"""
    cursor: Optional[str] = None  # Cursor desde donde empezar
    limit: int = 50  # Cantidad de items a devolver
    direction: str = "forward"  # "forward" o "backward"
    
    class Config:
        json_schema_extra = {
            "example": {
                "cursor": "2025-12-03T10:30:00|uuid-here",
                "limit": 50,
                "direction": "forward"
            }
        }


class CursorPage(BaseModel, Generic[T]):
    """Respuesta paginada con cursors"""
    items: List[T]
    next_cursor: Optional[str] = None
    prev_cursor: Optional[str] = None
    has_next: bool = False
    has_prev: bool = False
    total_count: Optional[int] = None  # Opcional, puede ser costoso calcularlo
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [...],
                "next_cursor": "2025-12-03T11:00:00|uuid-next",
                "prev_cursor": "2025-12-03T09:00:00|uuid-prev",
                "has_next": True,
                "has_prev": True,
                "total_count": 1523
            }
        }


def encode_cursor(timestamp: datetime, id: UUID) -> str:
    """
    Codifica timestamp + ID como cursor
    Formato: "2025-12-03T10:30:00|uuid"
    """
    return f"{timestamp.isoformat()}|{str(id)}"


def decode_cursor(cursor: str) -> tuple[datetime, UUID]:
    """
    Decodifica cursor a timestamp + ID
    """
    try:
        timestamp_str, id_str = cursor.split("|")
        timestamp = datetime.fromisoformat(timestamp_str)
        id = UUID(id_str)
        return timestamp, id
    except (ValueError, AttributeError) as e:
        raise ValueError(f"Invalid cursor format: {cursor}") from e


# Ejemplo de uso en un endpoint:
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from core.db import get_session
from models import Venta

@router.get("/ventas", response_model=CursorPage[VentaRead])
async def listar_ventas_paginadas(
    cursor: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_session)
):
    # Construir query base
    query = select(Venta).order_by(Venta.created_at.desc(), Venta.id.desc())
    
    # Si hay cursor, aplicar filtro
    if cursor:
        cursor_timestamp, cursor_id = decode_cursor(cursor)
        query = query.where(
            or_(
                Venta.created_at < cursor_timestamp,
                and_(
                    Venta.created_at == cursor_timestamp,
                    Venta.id < cursor_id
                )
            )
        )
    
    # Fetch limit+1 para saber si hay más páginas
    query = query.limit(limit + 1)
    result = await session.execute(query)
    items = result.scalars().all()
    
    # Determinar si hay siguiente página
    has_next = len(items) > limit
    if has_next:
        items = items[:limit]
    
    # Generar cursors
    next_cursor = None
    if has_next and items:
        last_item = items[-1]
        next_cursor = encode_cursor(last_item.created_at, last_item.id)
    
    return CursorPage(
        items=items,
        next_cursor=next_cursor,
        has_next=has_next,
        has_prev=cursor is not None  # Si vinimos con cursor, hay página anterior
    )
"""
