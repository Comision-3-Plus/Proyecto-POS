"""
API Routes: Clientes / CRM
Endpoints para gestión de clientes
"""
from typing import List, Optional, Annotated
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from sqlalchemy.orm import selectinload

from core.db import get_session
from models import Cliente, Venta, DetalleVenta, ProductVariant
from api.deps import CurrentUser, CurrentTienda
from pydantic import BaseModel, Field, EmailStr

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# =====================================================
# SCHEMAS
# =====================================================

class ClienteCreate(BaseModel):
    """Schema para crear cliente"""
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    documento_tipo: Optional[str] = Field(None, max_length=20)
    documento_numero: Optional[str] = Field(None, max_length=50)
    fecha_nacimiento: Optional[datetime] = None
    direccion: Optional[str] = Field(None, max_length=200)
    ciudad: Optional[str] = Field(None, max_length=100)
    codigo_postal: Optional[str] = Field(None, max_length=10)
    notas: Optional[str] = None


class ClienteUpdate(BaseModel):
    """Schema para actualizar cliente"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    documento_tipo: Optional[str] = Field(None, max_length=20)
    documento_numero: Optional[str] = Field(None, max_length=50)
    fecha_nacimiento: Optional[datetime] = None
    direccion: Optional[str] = Field(None, max_length=200)
    ciudad: Optional[str] = Field(None, max_length=100)
    codigo_postal: Optional[str] = Field(None, max_length=10)
    notas: Optional[str] = None
    is_active: Optional[bool] = None


class ClienteRead(BaseModel):
    """Schema para leer cliente"""
    cliente_id: UUID
    tienda_id: UUID
    nombre: str
    apellido: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    documento_tipo: Optional[str] = None
    documento_numero: Optional[str] = None
    fecha_nacimiento: Optional[datetime] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None
    notas: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ClienteStats(BaseModel):
    """Estadísticas de cliente"""
    total_compras: int
    total_gastado: float
    ticket_promedio: float
    ultima_compra: Optional[datetime] = None
    primera_compra: Optional[datetime] = None


class ClienteDetalle(ClienteRead):
    """Cliente con estadísticas y últimas compras"""
    stats: ClienteStats
    ultimas_compras: List[dict]


# =====================================================
# ENDPOINTS
# =====================================================

@router.get("", response_model=List[ClienteRead])
async def listar_clientes(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    search: Optional[str] = Query(None, description="Buscar por nombre, email, teléfono"),
    is_active: Optional[bool] = Query(True),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> List[ClienteRead]:
    """Lista clientes con búsqueda y paginación"""
    
    query = select(Cliente).where(Cliente.tienda_id == current_tienda.id)
    
    if is_active is not None:
        query = query.where(Cliente.is_active == is_active)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Cliente.nombre.ilike(search_pattern)) |
            (Cliente.apellido.ilike(search_pattern)) |
            (Cliente.email.ilike(search_pattern)) |
            (Cliente.telefono.ilike(search_pattern)) |
            (Cliente.documento_numero.ilike(search_pattern))
        )
    
    query = query.order_by(desc(Cliente.created_at)).limit(limit).offset(offset)
    
    result = await session.execute(query)
    clientes = result.scalars().all()
    
    return [ClienteRead.model_validate(c) for c in clientes]


@router.get("/search", response_model=List[ClienteRead])
async def buscar_clientes(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    q: str = Query(..., min_length=2, description="Query de búsqueda"),
) -> List[ClienteRead]:
    """Búsqueda rápida de clientes"""
    
    search_pattern = f"%{q}%"
    query = select(Cliente).where(
        Cliente.tienda_id == current_tienda.id,
        Cliente.is_active == True,
        (
            (Cliente.nombre.ilike(search_pattern)) |
            (Cliente.apellido.ilike(search_pattern)) |
            (Cliente.email.ilike(search_pattern)) |
            (Cliente.telefono.ilike(search_pattern)) |
            (Cliente.documento_numero.ilike(search_pattern))
        )
    ).limit(10)
    
    result = await session.execute(query)
    clientes = result.scalars().all()
    
    return [ClienteRead.model_validate(c) for c in clientes]


@router.get("/top", response_model=List[dict])
async def top_clientes(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = Query(10, ge=1, le=50),
) -> List[dict]:
    """Top clientes por total gastado"""
    
    sql = text("""
        SELECT 
            c.cliente_id,
            c.nombre,
            c.apellido,
            c.email,
            c.telefono,
            COUNT(DISTINCT v.venta_id) as total_compras,
            COALESCE(SUM(v.total), 0) as total_gastado,
            COALESCE(AVG(v.total), 0) as ticket_promedio,
            MAX(v.fecha_venta) as ultima_compra,
            MIN(v.fecha_venta) as primera_compra
        FROM clientes c
        LEFT JOIN ventas v ON c.cliente_id = v.cliente_id AND v.estado != 'anulada'
        WHERE c.tienda_id = :tienda_id AND c.is_active = true
        GROUP BY c.cliente_id, c.nombre, c.apellido, c.email, c.telefono
        ORDER BY total_gastado DESC
        LIMIT :limit
    """)
    
    result = await session.execute(sql, {"tienda_id": str(current_tienda.id), "limit": limit})
    rows = result.fetchall()
    
    return [
        {
            "cliente_id": str(row[0]),
            "nombre": row[1],
            "apellido": row[2],
            "email": row[3],
            "telefono": row[4],
            "total_compras": row[5],
            "total_gastado": float(row[6]),
            "ticket_promedio": float(row[7]),
            "ultima_compra": row[8],
            "primera_compra": row[9],
        }
        for row in rows
    ]


@router.get("/{cliente_id}", response_model=ClienteDetalle)
async def obtener_cliente(
    cliente_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ClienteDetalle:
    """Obtener detalle de cliente con estadísticas"""
    
    # Obtener cliente
    query = select(Cliente).where(
        Cliente.cliente_id == cliente_id,
        Cliente.tienda_id == current_tienda.id
    )
    result = await session.execute(query)
    cliente = result.scalar_one_or_none()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    # Obtener estadísticas
    stats_sql = text("""
        SELECT 
            COUNT(DISTINCT v.venta_id) as total_compras,
            COALESCE(SUM(v.total), 0) as total_gastado,
            COALESCE(AVG(v.total), 0) as ticket_promedio,
            MAX(v.fecha_venta) as ultima_compra,
            MIN(v.fecha_venta) as primera_compra
        FROM ventas v
        WHERE v.cliente_id = :cliente_id AND v.estado != 'anulada'
    """)
    
    stats_result = await session.execute(stats_sql, {"cliente_id": str(cliente_id)})
    stats_row = stats_result.fetchone()
    
    stats = ClienteStats(
        total_compras=stats_row[0],
        total_gastado=float(stats_row[1]),
        ticket_promedio=float(stats_row[2]),
        ultima_compra=stats_row[3],
        primera_compra=stats_row[4]
    )
    
    # Obtener últimas compras
    ultimas_sql = text("""
        SELECT 
            v.venta_id,
            v.fecha_venta,
            v.total,
            COUNT(dv.detalle_venta_id) as items_count
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.venta_id = dv.venta_id
        WHERE v.cliente_id = :cliente_id AND v.estado != 'anulada'
        GROUP BY v.venta_id, v.fecha_venta, v.total
        ORDER BY v.fecha_venta DESC
        LIMIT 5
    """)
    
    ultimas_result = await session.execute(ultimas_sql, {"cliente_id": str(cliente_id)})
    ultimas_rows = ultimas_result.fetchall()
    
    ultimas_compras = [
        {
            "venta_id": str(row[0]),
            "fecha": row[1],
            "total": float(row[2]),
            "items_count": row[3]
        }
        for row in ultimas_rows
    ]
    
    cliente_dict = ClienteRead.model_validate(cliente).model_dump()
    cliente_dict["stats"] = stats
    cliente_dict["ultimas_compras"] = ultimas_compras
    
    return ClienteDetalle(**cliente_dict)


@router.post("", response_model=ClienteRead, status_code=status.HTTP_201_CREATED)
async def crear_cliente(
    data: ClienteCreate,
    current_tienda: CurrentTienda,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ClienteRead:
    """Crear nuevo cliente"""
    
    # Validar email único si se proporciona
    if data.email:
        existing = await session.execute(
            select(Cliente).where(
                Cliente.tienda_id == current_tienda.id,
                Cliente.email == data.email,
                Cliente.is_active == True
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un cliente con ese email"
            )
    
    cliente = Cliente(
        tienda_id=current_tienda.id,
        **data.model_dump()
    )
    
    session.add(cliente)
    await session.commit()
    await session.refresh(cliente)
    
    return ClienteRead.model_validate(cliente)


@router.put("/{cliente_id}", response_model=ClienteRead)
async def actualizar_cliente(
    cliente_id: UUID,
    data: ClienteUpdate,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ClienteRead:
    """Actualizar cliente"""
    
    query = select(Cliente).where(
        Cliente.cliente_id == cliente_id,
        Cliente.tienda_id == current_tienda.id
    )
    result = await session.execute(query)
    cliente = result.scalar_one_or_none()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    # Validar email único si se cambia
    if data.email and data.email != cliente.email:
        existing = await session.execute(
            select(Cliente).where(
                Cliente.tienda_id == current_tienda.id,
                Cliente.email == data.email,
                Cliente.is_active == True,
                Cliente.cliente_id != cliente_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un cliente con ese email"
            )
    
    # Actualizar campos
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cliente, field, value)
    
    cliente.updated_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(cliente)
    
    return ClienteRead.model_validate(cliente)


@router.patch("/{cliente_id}/deactivate", response_model=ClienteRead)
async def desactivar_cliente(
    cliente_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ClienteRead:
    """Desactivar cliente (soft delete)"""
    
    query = select(Cliente).where(
        Cliente.cliente_id == cliente_id,
        Cliente.tienda_id == current_tienda.id
    )
    result = await session.execute(query)
    cliente = result.scalar_one_or_none()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    cliente.is_active = False
    cliente.updated_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(cliente)
    
    return ClienteRead.model_validate(cliente)
