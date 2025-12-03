"""
Endpoint simplificado de ventas compatible con el nuevo schema
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from core.db import get_session
from api.deps import CurrentUser, CurrentTienda
from models import Product, ProductVariant, InventoryLedger, User, Tienda
from pydantic import BaseModel


router = APIRouter(prefix="/ventas-simple", tags=["Ventas Simple"])


# ==================== SCHEMAS ====================

class VentaItemCreate(BaseModel):
    variant_id: UUID
    cantidad: int


class VentaCreateSimple(BaseModel):
    items: List[VentaItemCreate]
    metodo_pago: str = "efectivo"
    cliente_nombre: str = "Cliente General"


class VentaItemResponse(BaseModel):
    variant_id: UUID
    producto_nombre: str
    variant_name: str
    cantidad: int
    precio_unitario: float
    subtotal: float


class VentaResponse(BaseModel):
    mensaje: str
    total: float
    items: List[VentaItemResponse]
    fecha: datetime


# ==================== ENDPOINTS ====================

@router.post("/checkout", response_model=VentaResponse)
async def procesar_venta_simple(
    venta_data: VentaCreateSimple,
    current_user: CurrentUser,
    current_tienda: CurrentTienda,
    session: AsyncSession = Depends(get_session)
):
    """
    Endpoint simplificado de ventas
    Procesa venta y ajusta inventario
    """
    
    if not venta_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La venta debe tener al menos un item"
        )
    
    items_procesados = []
    total_venta = Decimal("0")
    
    # Procesar cada item
    for item in venta_data.items:
        # Obtener variante y producto
        result = await session.execute(
            select(ProductVariant, Product)
            .join(Product, ProductVariant.product_id == Product.id)
            .where(
                ProductVariant.id == item.variant_id,
                Product.tienda_id == current_tienda.id
            )
        )
        
        data = result.first()
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Variante {item.variant_id} no encontrada"
            )
        
        variant, product = data
        
        # Verificar stock actual
        stock_result = await session.execute(
            select(func.sum(InventoryLedger.delta))
            .where(InventoryLedger.variant_id == variant.id)
        )
        stock_actual = stock_result.scalar() or 0
        
        if stock_actual < item.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente para {product.name} - {variant.name}. Disponible: {stock_actual}"
            )
        
        # Calcular subtotal
        precio = Decimal(str(variant.price))
        cantidad = Decimal(str(item.cantidad))
        subtotal = precio * cantidad
        total_venta += subtotal
        
        # Registrar salida de inventario (delta negativo)
        ledger_entry = InventoryLedger(
            variant_id=variant.id,
            delta=-item.cantidad,
            reason="sale",
            notes=f"Venta - {venta_data.metodo_pago}",
            user_id=current_user.id
        )
        session.add(ledger_entry)
        
        items_procesados.append(VentaItemResponse(
            variant_id=variant.id,
            producto_nombre=product.name,
            variant_name=variant.name or "Principal",
            cantidad=item.cantidad,
            precio_unitario=float(precio),
            subtotal=float(subtotal)
        ))
    
    # Commit transaction
    await session.commit()
    
    return VentaResponse(
        mensaje=f"Venta procesada exitosamente - {venta_data.metodo_pago}",
        total=float(total_venta),
        items=items_procesados,
        fecha=datetime.utcnow()
    )


@router.get("/historial")
async def obtener_historial_ventas(
    current_tienda: CurrentTienda,
    session: AsyncSession = Depends(get_session),
    limit: int = 50
):
    """
    Obtiene historial de ventas (movimientos de inventario tipo 'sale')
    """
    result = await session.execute(
        select(
            InventoryLedger,
            ProductVariant,
            Product
        )
        .join(ProductVariant, InventoryLedger.variant_id == ProductVariant.id)
        .join(Product, ProductVariant.product_id == Product.id)
        .where(
            InventoryLedger.reason == "sale",
            Product.tienda_id == current_tienda.id
        )
        .order_by(InventoryLedger.timestamp.desc())
        .limit(limit)
    )
    
    ventas = []
    for ledger, variant, product in result.all():
        ventas.append({
            "id": str(ledger.id),
            "fecha": ledger.timestamp.isoformat(),
            "producto": product.name,
            "variante": variant.name or "Principal",
            "cantidad": abs(ledger.delta),
            "precio_unitario": float(variant.price),
            "total": float(variant.price * abs(ledger.delta)),
            "notas": ledger.notes
        })
    
    return {
        "ventas": ventas,
        "total_registros": len(ventas)
    }
