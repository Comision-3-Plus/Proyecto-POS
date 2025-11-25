"""
Rutas de Control de Caja - Nexus POS
Gestión de sesiones de caja, apertura/cierre y movimientos de efectivo
"""
from typing import Annotated, List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel, Field
from core.db import get_session
from api.deps import CurrentUser, CurrentTienda
from models import SesionCaja, MovimientoCaja, Venta


router = APIRouter(prefix="/caja", tags=["Caja"])


# ==================== SCHEMAS ====================

class AbrirCajaRequest(BaseModel):
    """Request para abrir una sesión de caja"""
    monto_inicial: float = Field(..., gt=0, description="Monto inicial con el que se abre la caja")


class MovimientoCajaRequest(BaseModel):
    """Request para registrar un movimiento de caja"""
    tipo: str = Field(..., pattern="^(INGRESO|EGRESO)$", description="Tipo de movimiento: INGRESO o EGRESO")
    monto: float = Field(..., gt=0, description="Monto del movimiento")
    descripcion: str = Field(..., min_length=3, max_length=255, description="Descripción del movimiento")


class CerrarCajaRequest(BaseModel):
    """Request para cerrar una sesión de caja"""
    monto_real: float = Field(..., ge=0, description="Monto real contado en la caja al cierre")


class MovimientoCajaRead(BaseModel):
    """Response para movimiento de caja"""
    id: UUID
    tipo: str
    monto: float
    descripcion: str
    created_at: datetime


class SesionCajaRead(BaseModel):
    """Response para sesión de caja"""
    id: UUID
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime]
    monto_inicial: float
    monto_final: Optional[float]
    diferencia: Optional[float]
    estado: str
    usuario_id: UUID
    movimientos: List[MovimientoCajaRead] = []


class EstadoCajaResponse(BaseModel):
    """Response para estado de caja"""
    tiene_caja_abierta: bool
    sesion: Optional[SesionCajaRead] = None


class CerrarCajaResponse(BaseModel):
    """Response detallado para cierre de caja"""
    sesion_id: UUID
    monto_inicial: float
    monto_esperado: float
    monto_real: float
    diferencia: float
    ventas_efectivo: float
    total_ingresos: float
    total_egresos: float
    fecha_apertura: datetime
    fecha_cierre: datetime


# ==================== ENDPOINTS ====================

@router.post("/abrir", response_model=SesionCajaRead, status_code=status.HTTP_201_CREATED)
async def abrir_caja(
    data: AbrirCajaRequest,
    current_user: CurrentUser,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> SesionCajaRead:
    """
    Abre una nueva sesión de caja
    
    Validaciones:
    - El usuario no debe tener ya una sesión abierta
    - El monto inicial debe ser mayor a 0
    """
    # Verificar si el usuario ya tiene una sesión abierta
    statement = select(SesionCaja).where(
        and_(
            SesionCaja.usuario_id == current_user.id,
            SesionCaja.tienda_id == current_tienda.id,
            SesionCaja.estado == "abierta"
        )
    )
    result = await session.execute(statement)
    sesion_existente = result.scalar_one_or_none()
    
    if sesion_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya tienes una sesión de caja abierta (ID: {sesion_existente.id}). Debes cerrarla antes de abrir una nueva."
        )
    
    # Crear nueva sesión de caja
    nueva_sesion = SesionCaja(
        monto_inicial=data.monto_inicial,
        estado="abierta",
        usuario_id=current_user.id,
        tienda_id=current_tienda.id
    )
    
    session.add(nueva_sesion)
    await session.commit()
    await session.refresh(nueva_sesion)
    
    return SesionCajaRead(
        id=nueva_sesion.id,
        fecha_apertura=nueva_sesion.fecha_apertura,
        fecha_cierre=nueva_sesion.fecha_cierre,
        monto_inicial=nueva_sesion.monto_inicial,
        monto_final=nueva_sesion.monto_final,
        diferencia=nueva_sesion.diferencia,
        estado=nueva_sesion.estado,
        usuario_id=nueva_sesion.usuario_id,
        movimientos=[]
    )


@router.get("/estado", response_model=EstadoCajaResponse)
async def obtener_estado_caja(
    current_user: CurrentUser,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> EstadoCajaResponse:
    """
    Obtiene el estado actual de la caja del usuario
    
    Retorna:
    - Si tiene caja abierta y los detalles de la sesión actual
    - Si no tiene caja abierta, retorna tiene_caja_abierta=False
    """
    # Buscar sesión abierta del usuario
    statement = select(SesionCaja).where(
        and_(
            SesionCaja.usuario_id == current_user.id,
            SesionCaja.tienda_id == current_tienda.id,
            SesionCaja.estado == "abierta"
        )
    )
    result = await session.execute(statement)
    sesion = result.scalar_one_or_none()
    
    if not sesion:
        return EstadoCajaResponse(
            tiene_caja_abierta=False,
            sesion=None
        )
    
    # Obtener movimientos de la sesión
    statement_movimientos = select(MovimientoCaja).where(
        MovimientoCaja.sesion_id == sesion.id
    ).order_by(MovimientoCaja.created_at.desc())
    
    result_movimientos = await session.execute(statement_movimientos)
    movimientos = result_movimientos.scalars().all()
    
    movimientos_read = [
        MovimientoCajaRead(
            id=m.id,
            tipo=m.tipo,
            monto=m.monto,
            descripcion=m.descripcion,
            created_at=m.created_at
        )
        for m in movimientos
    ]
    
    return EstadoCajaResponse(
        tiene_caja_abierta=True,
        sesion=SesionCajaRead(
            id=sesion.id,
            fecha_apertura=sesion.fecha_apertura,
            fecha_cierre=sesion.fecha_cierre,
            monto_inicial=sesion.monto_inicial,
            monto_final=sesion.monto_final,
            diferencia=sesion.diferencia,
            estado=sesion.estado,
            usuario_id=sesion.usuario_id,
            movimientos=movimientos_read
        )
    )


@router.post("/movimiento", response_model=MovimientoCajaRead, status_code=status.HTTP_201_CREATED)
async def registrar_movimiento(
    data: MovimientoCajaRequest,
    current_user: CurrentUser,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> MovimientoCajaRead:
    """
    Registra un movimiento de caja (ingreso o egreso manual)
    
    Validaciones:
    - Debe existir una sesión de caja abierta
    - El tipo debe ser INGRESO o EGRESO
    - El monto debe ser mayor a 0
    """
    # Buscar sesión abierta del usuario
    statement = select(SesionCaja).where(
        and_(
            SesionCaja.usuario_id == current_user.id,
            SesionCaja.tienda_id == current_tienda.id,
            SesionCaja.estado == "abierta"
        )
    )
    result = await session.execute(statement)
    sesion = result.scalar_one_or_none()
    
    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tienes una sesión de caja abierta. Debes abrir la caja primero."
        )
    
    # Crear el movimiento
    movimiento = MovimientoCaja(
        tipo=data.tipo,
        monto=data.monto,
        descripcion=data.descripcion,
        sesion_id=sesion.id,
        tienda_id=current_tienda.id
    )
    
    session.add(movimiento)
    await session.commit()
    await session.refresh(movimiento)
    
    return MovimientoCajaRead(
        id=movimiento.id,
        tipo=movimiento.tipo,
        monto=movimiento.monto,
        descripcion=movimiento.descripcion,
        created_at=movimiento.created_at
    )


@router.post("/cerrar", response_model=CerrarCajaResponse)
async def cerrar_caja(
    data: CerrarCajaRequest,
    current_user: CurrentUser,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> CerrarCajaResponse:
    """
    Cierra la sesión de caja actual
    
    Calcula:
    - Monto esperado = monto_inicial + ventas_efectivo + ingresos - egresos
    - Diferencia = monto_real - monto_esperado
    
    Validaciones:
    - Debe existir una sesión de caja abierta
    """
    # Buscar sesión abierta del usuario
    statement = select(SesionCaja).where(
        and_(
            SesionCaja.usuario_id == current_user.id,
            SesionCaja.tienda_id == current_tienda.id,
            SesionCaja.estado == "abierta"
        )
    )
    result = await session.execute(statement)
    sesion = result.scalar_one_or_none()
    
    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tienes una sesión de caja abierta."
        )
    
    # Calcular ventas en efectivo desde la apertura de la sesión
    statement_ventas = select(func.sum(Venta.total)).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.metodo_pago == "efectivo",
            Venta.status_pago == "pagado",
            Venta.created_at >= sesion.fecha_apertura
        )
    )
    result_ventas = await session.execute(statement_ventas)
    ventas_efectivo = result_ventas.scalar() or 0.0
    
    # Calcular total de ingresos manuales
    statement_ingresos = select(func.sum(MovimientoCaja.monto)).where(
        and_(
            MovimientoCaja.sesion_id == sesion.id,
            MovimientoCaja.tipo == "INGRESO"
        )
    )
    result_ingresos = await session.execute(statement_ingresos)
    total_ingresos = result_ingresos.scalar() or 0.0
    
    # Calcular total de egresos manuales
    statement_egresos = select(func.sum(MovimientoCaja.monto)).where(
        and_(
            MovimientoCaja.sesion_id == sesion.id,
            MovimientoCaja.tipo == "EGRESO"
        )
    )
    result_egresos = await session.execute(statement_egresos)
    total_egresos = result_egresos.scalar() or 0.0
    
    # Calcular monto esperado y diferencia
    monto_esperado = sesion.monto_inicial + ventas_efectivo + total_ingresos - total_egresos
    diferencia = data.monto_real - monto_esperado
    
    # Actualizar la sesión
    sesion.fecha_cierre = datetime.utcnow()
    sesion.monto_final = data.monto_real
    sesion.diferencia = diferencia
    sesion.estado = "cerrada"
    
    session.add(sesion)
    await session.commit()
    await session.refresh(sesion)
    
    return CerrarCajaResponse(
        sesion_id=sesion.id,
        monto_inicial=sesion.monto_inicial,
        monto_esperado=monto_esperado,
        monto_real=data.monto_real,
        diferencia=diferencia,
        ventas_efectivo=ventas_efectivo,
        total_ingresos=total_ingresos,
        total_egresos=total_egresos,
        fecha_apertura=sesion.fecha_apertura,
        fecha_cierre=sesion.fecha_cierre
    )
