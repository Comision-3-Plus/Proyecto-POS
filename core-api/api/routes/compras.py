"""
Rutas de Compras y Proveedores - Nexus POS
Gestión de órdenes de compra y actualización de inventario
"""
from typing import Annotated, List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel, Field
from core.db import get_session
from api.deps import CurrentUser, CurrentTienda
from models import Proveedor, OrdenCompra, DetalleOrden, Producto


router = APIRouter(prefix="/compras", tags=["Compras"])


# ==================== SCHEMAS ====================

class ProveedorCreate(BaseModel):
    """Request para crear un proveedor"""
    razon_social: str = Field(..., min_length=1, max_length=255)
    cuit: str = Field(..., min_length=1, max_length=20)
    email: str | None = None
    telefono: str | None = None
    direccion: str | None = None


class ProveedorRead(BaseModel):
    """Response para proveedor"""
    id: UUID
    razon_social: str
    cuit: str
    email: str | None
    telefono: str | None
    direccion: str | None
    is_active: bool
    created_at: datetime


class DetalleOrdenCreate(BaseModel):
    """Request para detalle de orden"""
    producto_id: UUID
    cantidad: float = Field(..., gt=0)
    precio_costo_unitario: float = Field(..., gt=0)


class DetalleOrdenRead(BaseModel):
    """Response para detalle de orden"""
    id: UUID
    producto_id: UUID
    cantidad: float
    precio_costo_unitario: float
    subtotal: float


class OrdenCompraCreate(BaseModel):
    """Request para crear una orden de compra"""
    proveedor_id: UUID
    observaciones: str | None = None
    detalles: List[DetalleOrdenCreate] = Field(..., min_length=1)


class OrdenCompraRead(BaseModel):
    """Response para orden de compra"""
    id: UUID
    proveedor_id: UUID
    proveedor_razon_social: str
    fecha_emision: datetime
    estado: str
    total: float
    observaciones: str | None
    created_at: datetime
    detalles: List[DetalleOrdenRead] = []


class RecibirOrdenResponse(BaseModel):
    """Response para recepción de orden"""
    orden_id: UUID
    estado: str
    productos_actualizados: int
    mensaje: str


# ==================== ENDPOINTS ====================

@router.get("/proveedores", response_model=List[ProveedorRead])
async def listar_proveedores(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> List[ProveedorRead]:
    """
    Listar todos los proveedores de la tienda
    """
    statement = select(Proveedor).where(
        and_(
            Proveedor.tienda_id == current_tienda.id,
            Proveedor.is_active == True
        )
    ).order_by(Proveedor.razon_social)
    
    result = await session.execute(statement)
    proveedores = result.scalars().all()
    
    return [
        ProveedorRead(
            id=p.id,
            razon_social=p.razon_social,
            cuit=p.cuit,
            email=p.email,
            telefono=p.telefono,
            direccion=p.direccion,
            is_active=p.is_active,
            created_at=p.created_at
        )
        for p in proveedores
    ]


@router.post("/proveedores", response_model=ProveedorRead, status_code=status.HTTP_201_CREATED)
async def crear_proveedor(
    data: ProveedorCreate,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ProveedorRead:
    """
    Crear un nuevo proveedor
    """
    nuevo_proveedor = Proveedor(
        razon_social=data.razon_social,
        cuit=data.cuit,
        email=data.email,
        telefono=data.telefono,
        direccion=data.direccion,
        tienda_id=current_tienda.id
    )
    
    session.add(nuevo_proveedor)
    await session.commit()
    await session.refresh(nuevo_proveedor)
    
    return ProveedorRead(
        id=nuevo_proveedor.id,
        razon_social=nuevo_proveedor.razon_social,
        cuit=nuevo_proveedor.cuit,
        email=nuevo_proveedor.email,
        telefono=nuevo_proveedor.telefono,
        direccion=nuevo_proveedor.direccion,
        is_active=nuevo_proveedor.is_active,
        created_at=nuevo_proveedor.created_at
    )


@router.get("/ordenes", response_model=List[OrdenCompraRead])
async def listar_ordenes(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> List[OrdenCompraRead]:
    """
    Listar todas las órdenes de compra de la tienda
    """
    statement = select(OrdenCompra).where(
        OrdenCompra.tienda_id == current_tienda.id
    ).order_by(OrdenCompra.fecha_emision.desc())
    
    result = await session.execute(statement)
    ordenes = result.scalars().all()
    
    ordenes_read = []
    for orden in ordenes:
        # Cargar proveedor
        statement_proveedor = select(Proveedor).where(Proveedor.id == orden.proveedor_id)
        result_proveedor = await session.execute(statement_proveedor)
        proveedor = result_proveedor.scalar_one()
        
        # Cargar detalles
        statement_detalles = select(DetalleOrden).where(DetalleOrden.orden_id == orden.id)
        result_detalles = await session.execute(statement_detalles)
        detalles = result_detalles.scalars().all()
        
        ordenes_read.append(
            OrdenCompraRead(
                id=orden.id,
                proveedor_id=orden.proveedor_id,
                proveedor_razon_social=proveedor.razon_social,
                fecha_emision=orden.fecha_emision,
                estado=orden.estado,
                total=orden.total,
                observaciones=orden.observaciones,
                created_at=orden.created_at,
                detalles=[
                    DetalleOrdenRead(
                        id=d.id,
                        producto_id=d.producto_id,
                        cantidad=d.cantidad,
                        precio_costo_unitario=d.precio_costo_unitario,
                        subtotal=d.subtotal
                    )
                    for d in detalles
                ]
            )
        )
    
    return ordenes_read


@router.post("/ordenes", response_model=OrdenCompraRead, status_code=status.HTTP_201_CREATED)
async def crear_orden(
    data: OrdenCompraCreate,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> OrdenCompraRead:
    """
    Crear una nueva orden de compra
    """
    # Validar que el proveedor existe y pertenece a la tienda
    statement = select(Proveedor).where(
        and_(
            Proveedor.id == data.proveedor_id,
            Proveedor.tienda_id == current_tienda.id
        )
    )
    result = await session.execute(statement)
    proveedor = result.scalar_one_or_none()
    
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )
    
    # Calcular total
    total = sum(d.cantidad * d.precio_costo_unitario for d in data.detalles)
    
    # Crear orden
    nueva_orden = OrdenCompra(
        proveedor_id=data.proveedor_id,
        total=total,
        observaciones=data.observaciones,
        estado="PENDIENTE",
        tienda_id=current_tienda.id
    )
    
    session.add(nueva_orden)
    await session.flush()  # Para obtener el ID
    
    # Crear detalles
    detalles_creados = []
    for detalle_data in data.detalles:
        # Validar que el producto existe
        statement_producto = select(Producto).where(
            and_(
                Producto.id == detalle_data.producto_id,
                Producto.tienda_id == current_tienda.id
            )
        )
        result_producto = await session.execute(statement_producto)
        producto = result_producto.scalar_one_or_none()
        
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto {detalle_data.producto_id} no encontrado"
            )
        
        subtotal = detalle_data.cantidad * detalle_data.precio_costo_unitario
        
        detalle = DetalleOrden(
            orden_id=nueva_orden.id,
            producto_id=detalle_data.producto_id,
            cantidad=detalle_data.cantidad,
            precio_costo_unitario=detalle_data.precio_costo_unitario,
            subtotal=subtotal
        )
        
        session.add(detalle)
        detalles_creados.append(detalle)
    
    await session.commit()
    await session.refresh(nueva_orden)
    
    return OrdenCompraRead(
        id=nueva_orden.id,
        proveedor_id=nueva_orden.proveedor_id,
        proveedor_razon_social=proveedor.razon_social,
        fecha_emision=nueva_orden.fecha_emision,
        estado=nueva_orden.estado,
        total=nueva_orden.total,
        observaciones=nueva_orden.observaciones,
        created_at=nueva_orden.created_at,
        detalles=[
            DetalleOrdenRead(
                id=d.id,
                producto_id=d.producto_id,
                cantidad=d.cantidad,
                precio_costo_unitario=d.precio_costo_unitario,
                subtotal=d.subtotal
            )
            for d in detalles_creados
        ]
    )


@router.post("/recibir/{orden_id}", response_model=RecibirOrdenResponse)
async def recibir_orden(
    orden_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> RecibirOrdenResponse:
    """
    🔥 ENDPOINT CRÍTICO - Recepción de Mercadería
    
    Procesa la recepción de una orden de compra:
    1. Cambia el estado de la orden a RECIBIDA
    2. Actualiza el stock de cada producto
    3. Actualiza el precio de costo (último precio)
    
    ⚠️ Operación transaccional atómica
    """
    try:
        # Buscar la orden y validar
        statement = select(OrdenCompra).where(
            and_(
                OrdenCompra.id == orden_id,
                OrdenCompra.tienda_id == current_tienda.id
            )
        )
        result = await session.execute(statement)
        orden = result.scalar_one_or_none()
        
        if not orden:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden de compra no encontrada"
            )
        
        if orden.estado != "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La orden ya fue procesada. Estado actual: {orden.estado}"
            )
        
        # Obtener detalles de la orden
        statement_detalles = select(DetalleOrden).where(DetalleOrden.orden_id == orden_id)
        result_detalles = await session.execute(statement_detalles)
        detalles = result_detalles.scalars().all()
        
        productos_actualizados = 0
        
        # Procesar cada producto
        for detalle in detalles:
            # Buscar y bloquear el producto (SELECT FOR UPDATE)
            statement_producto = select(Producto).where(
                and_(
                    Producto.id == detalle.producto_id,
                    Producto.tienda_id == current_tienda.id
                )
            ).with_for_update()
            
            result_producto = await session.execute(statement_producto)
            producto = result_producto.scalar_one_or_none()
            
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto {detalle.producto_id} no encontrado"
                )
            
            # 🔥 ACTUALIZAR STOCK: Sumar la cantidad recibida
            producto.stock_actual += detalle.cantidad
            
            # 🔥 ACTUALIZAR PRECIO DE COSTO: Lógica de "Último Precio"
            producto.precio_costo = detalle.precio_costo_unitario
            
            session.add(producto)
            productos_actualizados += 1
        
        # Cambiar estado de la orden a RECIBIDA
        orden.estado = "RECIBIDA"
        session.add(orden)
        
        # ⚡ COMMIT ATÓMICO: Todo o nada
        await session.commit()
        
        return RecibirOrdenResponse(
            orden_id=orden.id,
            estado=orden.estado,
            productos_actualizados=productos_actualizados,
            mensaje=f"Orden recibida exitosamente. {productos_actualizados} productos actualizados."
        )
        
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la recepción: {str(e)}"
        )


@router.patch("/ordenes/{orden_id}/cancelar", response_model=OrdenCompraRead)
async def cancelar_orden(
    orden_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> OrdenCompraRead:
    """
    Cancelar una orden de compra pendiente
    """
    statement = select(OrdenCompra).where(
        and_(
            OrdenCompra.id == orden_id,
            OrdenCompra.tienda_id == current_tienda.id
        )
    )
    result = await session.execute(statement)
    orden = result.scalar_one_or_none()
    
    if not orden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada"
        )
    
    if orden.estado != "PENDIENTE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden cancelar órdenes pendientes"
        )
    
    orden.estado = "CANCELADA"
    session.add(orden)
    await session.commit()
    await session.refresh(orden)
    
    # Cargar proveedor
    statement_proveedor = select(Proveedor).where(Proveedor.id == orden.proveedor_id)
    result_proveedor = await session.execute(statement_proveedor)
    proveedor = result_proveedor.scalar_one()
    
    return OrdenCompraRead(
        id=orden.id,
        proveedor_id=orden.proveedor_id,
        proveedor_razon_social=proveedor.razon_social,
        fecha_emision=orden.fecha_emision,
        estado=orden.estado,
        total=orden.total,
        observaciones=orden.observaciones,
        created_at=orden.created_at,
        detalles=[]
    )
