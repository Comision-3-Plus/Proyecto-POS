"""
OMS Routes - Order Management System API
Endpoints para gestión omnicanal de órdenes con smart routing
"""
from typing import Annotated, List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from core.db import get_session
from api.deps import CurrentTienda, CurrentUser
from schemas_models.oms_models import OrdenOmnicanal, OrdenItem, ShippingZone
from services.oms_service import SmartRoutingService


router = APIRouter(prefix="/oms", tags=["OMS - Order Management"])


# =====================================================
# SCHEMAS
# =====================================================

class CreateOrdenRequest(BaseModel):
    """Request para crear una orden omnicanal"""
    
    # Origen
    canal: str  # "online", "pos", "whatsapp"
    plataforma: Optional[str] = None  # "shopify", "woocommerce"
    external_order_id: Optional[str] = None
    
    # Cliente
    cliente_id: Optional[UUID] = None
    
    # Shipping
    shipping_address: dict
    shipping_method: str = "standard"  # standard, express, same_day, pickup
    
    # Items
    items: List[dict]  # [{"variant_id": "xxx", "cantidad": 2, "precio_unitario": 12990}]
    
    # Totales
    subtotal: float
    descuentos: float = 0.0
    envio: float = 0.0
    total: float


class RoutingDecisionResponse(BaseModel):
    """Respuesta del algoritmo de routing"""
    orden_id: UUID
    selected_location_id: UUID
    selected_location_name: str
    decision: dict


# =====================================================
# ENDPOINTS
# =====================================================

@router.post("/ordenes")
async def crear_orden_omnicanal(
    data: CreateOrdenRequest,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    📦 Crea una orden omnicanal y ejecuta smart routing
    
    Flujo:
    1. Crea la orden
    2. Ejecuta algoritmo de routing
    3. Asigna ubicación óptima
    4. Reserva stock
    5. Retorna decisión
    
    Casos de uso:
    - Importar orden de Shopify
    - Registrar venta telefónica con envío
    - Pedido por WhatsApp
    """
    # 1. Crear orden
    orden = OrdenOmnicanal(
        tienda_id=current_tienda.id,
        numero_orden=await _generate_order_number(session, current_tienda.id),
        canal=data.canal,
        plataforma=data.plataforma,
        external_order_id=data.external_order_id,
        cliente_id=data.cliente_id,
        shipping_address=data.shipping_address,
        shipping_method=data.shipping_method,
        subtotal=data.subtotal,
        descuentos=data.descuentos,
        envio=data.envio,
        total=data.total,
        fulfillment_status="analyzing"
    )
    session.add(orden)
    await session.flush()
    
    # 2. Crear items
    for item_data in data.items:
        item = OrdenItem(
            orden_id=orden.id,
            variant_id=item_data["variant_id"],
            cantidad=item_data["cantidad"],
            precio_unitario=item_data["precio_unitario"],
            subtotal=item_data["cantidad"] * item_data["precio_unitario"]
        )
        session.add(item)
    
    await session.commit()
    await session.refresh(orden)
    
    # 3. Ejecutar smart routing
    routing_service = SmartRoutingService(session)
    
    try:
        location_id, decision_metadata = await routing_service.assign_fulfillment_location(orden)
        
        # 4. Actualizar orden con decisión
        orden.fulfillment_location_id = location_id
        orden.routing_decision = decision_metadata
        orden.fulfillment_status = "assigned"
        orden.assigned_at = datetime.utcnow()
        
        await session.commit()
        
        return {
            "orden_id": orden.id,
            "numero_orden": orden.numero_orden,
            "fulfillment_location_id": location_id,
            "fulfillment_status": "assigned",
            "routing_decision": decision_metadata,
            "message": f"Orden asignada a {decision_metadata['selected_name']}"
        }
        
    except ValueError as e:
        # No hay ubicaciones disponibles
        orden.fulfillment_status = "pending"
        await session.commit()
        
        raise HTTPException(
            status_code=400,
            detail=f"No se pudo asignar ubicación: {str(e)}"
        )


@router.get("/ordenes/{orden_id}/routing")
async def get_routing_decision(
    orden_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    🎯 Obtiene la decisión de routing de una orden
    
    Muestra:
    - Ubicación seleccionada
    - Todas las opciones consideradas
    - Scores de cada candidato
    - Razón de la selección
    """
    orden = await session.get(OrdenOmnicanal, orden_id)
    
    if not orden or orden.tienda_id != current_tienda.id:
        raise HTTPException(404, "Orden no encontrada")
    
    if not orden.routing_decision:
        raise HTTPException(400, "Esta orden no tiene decisión de routing")
    
    return {
        "orden_id": orden.id,
        "numero_orden": orden.numero_orden,
        "status": orden.fulfillment_status,
        "routing_decision": orden.routing_decision
    }


@router.post("/ordenes/{orden_id}/re-route")
async def re_route_order(
    orden_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    🔄 Re-ejecuta el algoritmo de routing
    
    Útil cuando:
    - Stock cambió
    - Ubicación asignada no puede cumplir
    - Cliente cambió dirección de envío
    """
    orden = await session.get(OrdenOmnicanal, orden_id)
    
    if not orden or orden.tienda_id != current_tienda.id:
        raise HTTPException(404, "Orden no encontrada")
    
    if orden.fulfillment_status in ["shipped", "delivered", "cancelled"]:
        raise HTTPException(400, "No se puede re-routear orden en este estado")
    
    # Re-ejecutar routing
    routing_service = SmartRoutingService(session)
    location_id, decision_metadata = await routing_service.assign_fulfillment_location(orden)
    
    orden.fulfillment_location_id = location_id
    orden.routing_decision = decision_metadata
    orden.fulfillment_status = "assigned"
    orden.assigned_at = datetime.utcnow()
    
    await session.commit()
    
    return {
        "orden_id": orden.id,
        "new_location": location_id,
        "decision": decision_metadata
    }


@router.get("/ordenes/pending")
async def get_pending_orders(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    📋 Lista órdenes pendientes de asignación
    
    Usa esto para monitorear órdenes que no pudieron
    ser asignadas automáticamente
    """
    result = await session.exec(
        select(OrdenOmnicanal)
        .where(
            and_(
                OrdenOmnicanal.tienda_id == current_tienda.id,
                OrdenOmnicanal.fulfillment_status == "pending"
            )
        )
        .order_by(OrdenOmnicanal.created_at.desc())
    )
    
    ordenes = result.all()
    
    return {
        "count": len(ordenes),
        "ordenes": [
            {
                "id": o.id,
                "numero_orden": o.numero_orden,
                "canal": o.canal,
                "total": o.total,
                "created_at": o.created_at,
                "shipping_address": o.shipping_address
            }
            for o in ordenes
        ]
    }


@router.get("/analytics/routing")
async def get_routing_analytics(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    dias: int = 30
):
    """
    📊 Analytics del sistema de routing
    
    Muestra:
    - % de órdenes asignadas automáticamente
    - Ubicación más usada
    - Ahorro promedio en costos de envío
    - Tiempo promedio de fulfillment
    """
    desde = datetime.utcnow() - timedelta(days=dias)
    
    result = await session.exec(
        select(OrdenOmnicanal)
        .where(
            and_(
                OrdenOmnicanal.tienda_id == current_tienda.id,
                OrdenOmnicanal.created_at >= desde
            )
        )
    )
    ordenes = result.all()
    
    if not ordenes:
        return {"message": "No hay datos suficientes"}
    
    # Calcular métricas
    total = len(ordenes)
    asignadas_auto = len([o for o in ordenes if o.routing_decision])
    
    # Ubicación más usada
    location_counts = {}
    for orden in ordenes:
        if orden.fulfillment_location_id:
            loc_id = str(orden.fulfillment_location_id)
            location_counts[loc_id] = location_counts.get(loc_id, 0) + 1
    
    return {
        "periodo_dias": dias,
        "total_ordenes": total,
        "asignadas_automaticamente": asignadas_auto,
        "tasa_asignacion_auto": round((asignadas_auto / total) * 100, 2),
        "ubicacion_mas_usada": max(location_counts.items(), key=lambda x: x[1]) if location_counts else None,
        "distribucion_ubicaciones": location_counts
    }


# =====================================================
# HELPERS
# =====================================================

async def _generate_order_number(session: AsyncSession, tienda_id: UUID) -> str:
    """
    Genera número de orden único
    Formato: ORD-2024-00123
    """
    year = datetime.utcnow().year
    
    # Contar órdenes del año
    result = await session.exec(
        select(func.count(OrdenOmnicanal.id))
        .where(
            and_(
                OrdenOmnicanal.tienda_id == tienda_id,
                func.extract('year', OrdenOmnicanal.created_at) == year
            )
        )
    )
    count = result.first()
    next_number = (count if count else 0) + 1
    
    return f"ORD-{year}-{next_number:05d}"


from sqlalchemy import and_, func
from datetime import timedelta
