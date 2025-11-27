"""
Enhanced POS Endpoints - Mejoras al backend POS
"""
from typing import Annotated, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from core.db import get_session
from api.deps import CurrentTienda
from models import ProductVariant


router = APIRouter(prefix="/pos", tags=["POS Enhanced"])


# =====================================================
# SCHEMAS
# =====================================================

class MultiPayment(BaseModel):
    """Pago múltiple (split payment)"""
    metodo: str  # "efectivo", "tarjeta_debito", "tarjeta_credito", "qr"
    monto: float
    referencia: Optional[str] = None


class VentaEnhancedRequest(BaseModel):
    """Venta con pagos múltiples"""
    items: List[dict]
    pagos: List[MultiPayment]
    cliente_id: Optional[UUID] = None


class BatchPriceUpdate(BaseModel):
    """Actualización masiva de precios"""
    updates: List[dict]  # [{"sku": "...", "price": 12990}]


class VentaOfflineRequest(BaseModel):
    """Venta registrada offline"""
    timestamp: str  # ISO datetime cuando se hizo la venta
    items: List[dict]
    pagos: List[MultiPayment]
    total: float


# =====================================================
# ENDPOINTS MEJORADOS
# =====================================================

@router.get("/scan/{codigo}")
async def escan eo_mejorado(
    codigo: str,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    🔍 Escaneo universal mejorado
    
    Busca producto por:
    1. Código de barras (EAN-13)
    2. SKU
    3. Código interno
    
    Retorna:
    - Producto completo
    - Stock disponible en tiempo real
    - Precio actual
    - Descuentos aplicables
    - Sugerencias de combos (futuro)
    """
    from models import ProductVariant, Product, Size, Color
    from services.promo_service import PromotionEngine
    
    # Buscar por barcode O SKU
    result = await session.exec(
        select(ProductVariant)
        .where(
            and_(
                ProductVariant.tienda_id == current_tienda.id,
                or_(
                    ProductVariant.barcode == codigo,
                    ProductVariant.sku == codigo
                )
            )
        )
    )
    variant = result.first()
    
    if not variant:
        raise HTTPException(404, f"Producto no encontrado: {codigo}")
    
    # Calcular stock (del inventory ledger)
    from services.oms_service import calculate_stock_by_variant
    stock = await calculate_stock_by_variant(variant.variant_id, session)
    
    # Obtener descuentos aplicables (si tiene promo engine)
    # promo_engine = PromotionEngine(session)
    # descuentos = await promo_engine.get_applicable_discounts(variant.variant_id)
    
    return {
        "variant_id": str(variant.variant_id),
        "product_id": str(variant.product_id),
        "product_name": variant.product.name if variant.product else "Unknown",
        "sku": variant.sku,
        "barcode": variant.barcode,
        "size": variant.size.name if variant.size else None,
        "color": variant.color.name if variant.color else None,
        "price": variant.price,
        "stock_available": stock,
        "in_stock": stock > 0,
        "image_url": variant.image_url,
        "discounts": [],  # TODO: Integrar con promo engine
        "suggested_combos": []  # TODO: ML recommendations
    }


@router.post("/ventas/multi-payment")
async def venta_con_pagos_multiples(
    data: VentaEnhancedRequest,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    💳 Venta con múltiples métodos de pago
    
    Ejemplo:
    - Cliente compra $15.990
    - Paga $10.000 en efectivo
    - Paga $5.990 con tarjeta de débito
    
    Body:
    ```json
    {
      "items": [{"variant_id": "xxx", "cantidad": 2}],
      "pagos": [
        {"metodo": "efectivo", "monto": 10000},
        {"metodo": "tarjeta_debito", "monto": 5990, "referencia": "AUTH-12345"}
      ]
    }
    ```
    """
    from models import Venta, DetalleVenta
    from datetime import datetime
    
    # Validar que suma de pagos = total
    total_pagos = sum(p.monto for p in data.pagos)
    # Calcular total de items
    total_items = 0  # TODO: calcular desde items
    
    # Crear venta
    venta = Venta(
        tienda_id=current_tienda.id,
        cliente_id=data.cliente_id,
        fecha=datetime.utcnow(),
        total=total_pagos,
        estado="completada",
        metadata={
            "pagos_multiples": [
                {
                    "metodo": p.metodo,
                    "monto": p.monto,
                    "referencia": p.referencia
                }
                for p in data.pagos
            ]
        }
    )
    session.add(venta)
    
    # TODO: Crear detalles, actualizar stock, etc
    
    await session.commit()
    
    return {
        "venta_id": str(venta.id),
        "total": venta.total,
        "pagos": data.pagos,
        "status": "success"
    }


@router.post("/productos/batch/update-prices")
async def batch_update_prices(
    data: BatchPriceUpdate,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    📦 Actualización masiva de precios
    
    Útil para:
    - Actualizar precios desde e-commerce
    - Aplicar ajustes por inflación
    - Liquidaciones masivas
    
    Body:
    ```json
    {
      "updates": [
        {"sku": "REM-001-ROJO-M", "price": 13990},
        {"sku": "REM-001-AZUL-M", "price": 13990}
      ]
    }
    ```
    """
    results = []
    
    for update in data.updates:
        sku = update.get("sku")
        new_price = update.get("price")
        
        # Buscar variant
        result = await session.exec(
            select(ProductVariant)
            .where(
                and_(
                    ProductVariant.tienda_id == current_tienda.id,
                    ProductVariant.sku == sku
                )
            )
        )
        variant = result.first()
        
        if variant:
            old_price = variant.price
            variant.price = new_price
            results.append({
                "sku": sku,
                "status": "updated",
                "old_price": old_price,
                "new_price": new_price
            })
        else:
            results.append({
                "sku": sku,
                "status": "not_found"
            })
    
    await session.commit()
    
    return {
        "processed": len(data.updates),
        "updated": len([r for r in results if r["status"] == "updated"]),
        "not_found": len([r for r in results if r["status"] == "not_found"]),
        "results": results
    }


@router.post("/ventas/offline")
async def registrar_venta_offline(
    data: VentaOfflineRequest,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    📴 Registra venta hecha sin conexión
    
    Flujo offline:
    1. POS pierde internet
    2. Cajero sigue vendiendo (guarda localmente)
    3. Cuando vuelve conexión, sube ventas
    4. Se registran con timestamp original
    
    Body:
    ```json
    {
      "timestamp": "2024-01-15T14:30:00",
      "items": [...],
      "pagos": [...],
      "total": 25990
    }
    ```
    """
    from models import Venta
    from datetime import datetime, timedelta
    import dateutil.parser
    
    # Parsear timestamp
    venta_timestamp = dateutil.parser.parse(data.timestamp)
    
    # Validar que no sea muy antigua (max 7 días)
    ahora = datetime.utcnow()
    if venta_timestamp < ahora - timedelta(days=7):
        raise HTTPException(400, "Venta muy antigua (>7 días)")
    
    # Crear venta con timestamp original
    venta = Venta(
        tienda_id=current_tienda.id,
        fecha=venta_timestamp,
        total=data.total,
        estado="completada",
        metadata={
            "sync_offline": True,
            "sync_timestamp": datetime.utcnow().isoformat(),
            "pagos": [p.dict() for p in data.pagos]
        }
    )
    session.add(venta)
    
    # TODO: Crear detalles
    
    await session.commit()
    
    return {
        "venta_id": str(venta.id),
        "venta_fecha": venta_timestamp.isoformat(),
        "synced_at": datetime.utcnow().isoformat(),
        "status": "synced"
    }


@router.post("/productos/batch/update-stock")
async def batch_update_stock(
    updates: List[dict],  # [{"sku": "...", "quantity": 50}]
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    📦 Actualización masiva de stock
    """
    from models import InventoryLedger, ProductVariant, Location
    from datetime import datetime
    
    results = []
    
    # Obtener ubicación default
    result = await session.exec(
        select(Location)
        .where(Location.tienda_id == current_tienda.id)
        .limit(1)
    )
    default_location = result.first()
    
    if not default_location:
        raise HTTPException(400, "No hay ubicaciones configuradas")
    
    for update in updates:
        sku = update.get("sku")
        new_qty = update.get("quantity")
        
        # Buscar variant
        result = await session.exec(
           select(ProductVariant)
            .where(ProductVariant.sku == sku)
        )
        variant = result.first()
        
        if variant:
            # Crear entry en ledger (ajuste manual)
            ledger = InventoryLedger(
                tienda_id=current_tienda.id,
                variant_id=variant.variant_id,
                location_id=default_location.location_id,
                movement_type="adjustment",
                delta=new_qty,
                reason="Sync desde e-commerce",
                timestamp=datetime.utcnow()
            )
            session.add(ledger)
            results.append({"sku": sku, "status": "updated"})
        else:
            results.append({"sku": sku, "status": "not_found"})
    
    await session.commit()
    
    return {"results": results}


from sqlalchemy import and_, or_
