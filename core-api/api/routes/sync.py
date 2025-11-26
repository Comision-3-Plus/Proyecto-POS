"""
Rutas de Sincronización Legacy - Nexus POS
Endpoint para recibir actualizaciones desde el Legacy Agent (Go)
"""
from typing import Annotated, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from core.db import get_session
from api.deps import CurrentTienda, get_current_user
from models import (
    Product, ProductVariant, InventoryLedger,
    Location, User
)
import logging

router = APIRouter(prefix="/sync", tags=["Sincronización Legacy"])
logger = logging.getLogger(__name__)


# =====================================================
# SCHEMAS
# =====================================================

class LegacySyncRequest(BaseModel):
    """
    Payload que recibe el endpoint desde el Legacy Agent
    """
    sku_legacy: str = Field(..., description="SKU del sistema legacy (CODIGO)")
    descripcion: str = Field(..., description="Descripción del producto")
    talle: Optional[str] = Field(None, description="Talle de la variante")
    color: Optional[str] = Field(None, description="Color de la variante")
    stock_real: float = Field(..., description="Stock actual en el sistema legacy")
    ubicacion: str = Field(..., description="Sucursal o ubicación en el legacy")
    precio: float = Field(..., description="Precio de venta")
    costo: Optional[float] = Field(None, description="Precio de costo")
    source: str = Field(default="LEGACY_AGENT", description="Origen de la sincronización")
    fecha_movimiento: str = Field(..., description="Timestamp del cambio en legacy (ISO 8601)")


class LegacySyncResponse(BaseModel):
    """
    Respuesta del endpoint de sincronización
    """
    success: bool
    message: str
    variant_id: Optional[UUID] = None
    transaction_id: Optional[UUID] = None
    stock_before: Optional[float] = None
    stock_after: Optional[float] = None
    delta: Optional[float] = None


# =====================================================
# ENDPOINT: POST /sync/legacy
# =====================================================

@router.post("/legacy", response_model=LegacySyncResponse)
async def sync_from_legacy(
    sync_data: LegacySyncRequest,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: User = Depends(get_current_user)
) -> LegacySyncResponse:
    """
    🔄 Sincroniza datos desde el sistema legacy
    
    **Flujo:**
    1. Buscar el producto en Blend por SKU legacy (external_erp_id)
    2. Si no existe, crear producto + variante automáticamente
    3. Calcular delta de stock (stock_legacy - stock_actual_blend)
    4. Escribir transacción en el Inventory Ledger
    5. Retornar confirmación
    
    **Seguridad:**
    - Requiere autenticación
    - Multi-tenant isolation (por tienda)
    - Idempotencia: misma transacción no se aplica 2 veces
    """
    
    try:
        logger.info(
            f"Sincronización legacy recibida: {sync_data.sku_legacy} | "
            f"{sync_data.color} {sync_data.talle} | Stock: {sync_data.stock_real}"
        )
        
        # 1. Buscar Location en Blend que mapee a la sucursal legacy
        location = await get_or_create_location(
            session, current_tienda.id, sync_data.ubicacion
        )
        
        # 2. Buscar variante en Blend
        variant = await find_variant_by_legacy_sku(
            session,
            current_tienda.id,
            sync_data.sku_legacy,
            sync_data.talle,
            sync_data.color
        )
        
        # 3. Si no existe, crear producto + variante
        if not variant:
            logger.info(f"Variante no existe, creando automáticamente: {sync_data.sku_legacy}")
            variant = await create_product_from_legacy(
                session,
                current_tienda.id,
                sync_data
            )
        
        # 4. Calcular stock actual en Blend desde el ledger
        stock_actual_blend = await calculate_stock_from_ledger(
            session, variant.variant_id, location.location_id
        )
        
        # 5. Calcular delta (diferencia entre legacy y Blend)
        delta = sync_data.stock_real - stock_actual_blend
        
        # 6. Solo escribir si hay diferencia (evitar transacciones innecesarias)
        transaction_id = None
        if abs(delta) > 0.001:  # Threshold para evitar problemas de redondeo
            # Crear transacción en el ledger
            transaccion = InventoryLedger(
                tienda_id=current_tienda.id,
                variant_id=variant.variant_id,
                location_id=location.location_id,
                delta=delta,
                transaction_type='LEGACY_SYNC',
                reference_doc=f"LEGACY_{sync_data.sku_legacy}_{datetime.now().isoformat()}",
                notes=f"Sincronización desde {sync_data.source}. Ubicación legacy: {sync_data.ubicacion}",
                created_by=current_user.id
            )
            session.add(transaccion)
            await session.commit()
            await session.refresh(transaccion)
            
            transaction_id = transaccion.transaction_id
            
            logger.info(
                f"✅ Ledger actualizado: {sync_data.sku_legacy} | "
                f"Delta: {delta:+.2f} | Stock anterior: {stock_actual_blend:.2f} | "
                f"Stock nuevo: {sync_data.stock_real:.2f}"
            )
        else:
            logger.info(f"ℹ️  Sin cambios en stock: {sync_data.sku_legacy}")
        
        return LegacySyncResponse(
            success=True,
            message="Sincronización exitosa",
            variant_id=variant.variant_id,
            transaction_id=transaction_id,
            stock_before=stock_actual_blend,
            stock_after=sync_data.stock_real,
            delta=delta if abs(delta) > 0.001 else 0.0
        )
        
    except Exception as e:
        logger.error(f"❌ Error en sincronización legacy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando sincronización: {str(e)}"
        )


# =====================================================
# HELPERS
# =====================================================

async def get_or_create_location(
    session: AsyncSession,
    tienda_id: UUID,
    ubicacion_legacy: str
) -> Location:
    """
    Busca o crea una Location en Blend que mapee a la sucursal del legacy
    """
    # Buscar por external_erp_id
    query = select(Location).where(
        Location.tienda_id == tienda_id,
        Location.external_erp_id == ubicacion_legacy
    )
    result = await session.execute(query)
    location = result.scalar_one_or_none()
    
    if location:
        return location
    
    # Si no existe, usar la location default
    query_default = select(Location).where(
        Location.tienda_id == tienda_id,
        Location.is_default == True
    )
    result = await session.execute(query_default)
    default_location = result.scalar_one_or_none()
    
    if default_location:
        # Actualizar el external_erp_id para futuras syncs
        default_location.external_erp_id = ubicacion_legacy
        await session.commit()
        return default_location
    
    # No debería llegar acá si el auto-provisioning funciona
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="No existe Location default en la tienda"
    )


async def find_variant_by_legacy_sku(
    session: AsyncSession,
    tienda_id: UUID,
    sku_legacy: str,
    talle: Optional[str],
    color: Optional[str]
) -> Optional[ProductVariant]:
    """
    Busca una variante en Blend usando el SKU legacy
    """
    # Buscar producto por base_sku que contenga el SKU legacy
    # En un sistema real, deberías tener un campo external_sku
    query = select(ProductVariant).join(Product).where(
        Product.tienda_id == tienda_id,
        Product.base_sku.contains(sku_legacy)
    )
    
    result = await session.execute(query)
    variants = result.scalars().all()
    
    # Si hay variantes, buscar la que coincida con talle/color
    for variant in variants:
        await session.refresh(variant, attribute_names=['size', 'color'])
        
        size_match = (
            (variant.size is None and talle is None) or
            (variant.size and variant.size.name == talle)
        )
        color_match = (
            (variant.color is None and color is None) or
            (variant.color and variant.color.name.upper() == (color.upper() if color else None))
        )
        
        if size_match and color_match:
            return variant
    
    return None


async def create_product_from_legacy(
    session: AsyncSession,
    tienda_id: UUID,
    sync_data: LegacySyncRequest
) -> ProductVariant:
    """
    Crea automáticamente un producto + variante desde datos legacy
    """
    from models import Product, ProductVariant, Size, Color
    from uuid import uuid4
    
    # 1. Crear producto padre
    nuevo_producto = Product(
        tienda_id=tienda_id,
        name=sync_data.descripcion,
        base_sku=sync_data.sku_legacy,
        description=f"Importado desde sistema legacy",
        category="IMPORTADO",
        is_active=True
    )
    session.add(nuevo_producto)
    await session.flush()
    
    # 2. Buscar o crear Size/Color
    size_id = None
    color_id = None
    
    if sync_data.talle:
        size_id = await get_or_create_size(session, tienda_id, sync_data.talle)
    
    if sync_data.color:
        color_id = await get_or_create_color(session, tienda_id, sync_data.color)
    
    # 3. Generar SKU de variante
    sku_parts = [sync_data.sku_legacy]
    if sync_data.color:
        sku_parts.append(sync_data.color.upper().replace(' ', ''))
    if sync_data.talle:
        sku_parts.append(sync_data.talle.upper().replace(' ', ''))
    
    variant_sku = '-'.join(sku_parts)
    
    # 4. Crear variante
    nueva_variante = ProductVariant(
        product_id=nuevo_producto.product_id,
        tienda_id=tienda_id,
        sku=variant_sku,
        size_id=size_id,
        color_id=color_id,
        price=sync_data.precio,
        is_active=True
    )
    session.add(nueva_variante)
    await session.flush()
    await session.refresh(nueva_variante)
    
    logger.info(f"✨ Producto creado automáticamente: {variant_sku}")
    
    return nueva_variante


async def get_or_create_size(
    session: AsyncSession,
    tienda_id: UUID,
    talle: str
) -> int:
    """Busca o crea un talle"""
    from models import Size
    
    query = select(Size).where(
        Size.tienda_id == tienda_id,
        Size.name == talle
    )
    result = await session.execute(query)
    size = result.scalar_one_or_none()
    
    if size:
        return size.id
    
    # Crear nuevo size
    new_size = Size(
        tienda_id=tienda_id,
        name=talle,
        sort_order=999  # Al final de la lista
    )
    session.add(new_size)
    await session.flush()
    return new_size.id


async def get_or_create_color(
    session: AsyncSession,
    tienda_id: UUID,
    color: str
) -> int:
    """Busca o crea un color"""
    from models import Color
    
    query = select(Color).where(
        Color.tienda_id == tienda_id,
        Color.name.ilike(color)  # Case-insensitive
    )
    result = await session.execute(query)
    color_obj = result.scalar_one_or_none()
    
    if color_obj:
        return color_obj.id
    
    # Crear nuevo color
    new_color = Color(
        tienda_id=tienda_id,
        name=color.upper(),
        hex_code=None  # Se puede mapear después
    )
    session.add(new_color)
    await session.flush()
    return new_color.id


async def calculate_stock_from_ledger(
    session: AsyncSession,
    variant_id: UUID,
    location_id: UUID
) -> float:
    """
    Calcula el stock actual de una variante desde el ledger
    """
    from sqlalchemy import func
    
    query = select(func.sum(InventoryLedger.delta)).where(
        InventoryLedger.variant_id == variant_id,
        InventoryLedger.location_id == location_id
    )
    
    result = await session.execute(query)
    stock = result.scalar()
    
    return float(stock) if stock is not None else 0.0
