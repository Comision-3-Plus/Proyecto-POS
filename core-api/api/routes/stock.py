"""
API Routes: Stock / Inventario
Endpoints para gestión de stock e inventory ledger
"""
from typing import List, Optional, Annotated
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from pydantic import BaseModel, Field

from core.db import get_session
from models import InventoryLedger, ProductVariant, Product, Location
from api.deps import CurrentTienda

router = APIRouter(prefix="/stock", tags=["Stock"])

# =====================================================
# SCHEMAS
# =====================================================

class StockByLocation(BaseModel):
    """Stock por ubicación"""
    location_id: str
    location_name: str
    stock: float


class ProductVariantStock(BaseModel):
    """Stock de una variante de producto"""
    variant_id: str
    product_id: str
    product_name: str
    sku: str
    size_name: Optional[str] = None
    color_name: Optional[str] = None
    price: float
    stock_total: float
    stock_by_location: List[StockByLocation]


class InventoryTransactionRead(BaseModel):
    """Transacción de inventario"""
    transaction_id: str
    variant_id: str
    location_id: str
    delta: float
    reference_type: str
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    created_by: str
    
    # Info adicional
    product_name: Optional[str] = None
    sku: Optional[str] = None
    location_name: Optional[str] = None


class StockAdjustmentRequest(BaseModel):
    """Request para ajuste de inventario"""
    variant_id: UUID
    location_id: UUID
    delta: float = Field(..., description="+N para entrada, -N para salida")
    notes: Optional[str] = Field(None, max_length=500)


class StockTransferRequest(BaseModel):
    """Request para transferencia de stock"""
    variant_id: UUID
    from_location_id: UUID
    to_location_id: UUID
    quantity: float = Field(..., gt=0)
    notes: Optional[str] = Field(None, max_length=500)


class LocationRead(BaseModel):
    """Ubicación/Almacén"""
    location_id: str
    tienda_id: str
    name: str
    type: str
    address: Optional[str] = None
    is_active: bool
    
    model_config = {"from_attributes": True}


# =====================================================
# ENDPOINTS
# =====================================================

@router.get("/resumen", response_model=List[ProductVariantStock])
async def stock_resumen(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> List[ProductVariantStock]:
    """
    Resumen de stock de todas las variantes con ubicaciones
    """
    sql = text("""
        WITH stock_data AS (
            SELECT 
                pv.variant_id,
                pv.product_id,
                p.name as product_name,
                pv.sku,
                s.name as size_name,
                c.name as color_name,
                pv.price,
                COALESCE(SUM(il.delta), 0) as stock_total,
                json_agg(
                    json_build_object(
                        'location_id', l.location_id::text,
                        'location_name', l.name,
                        'stock', COALESCE(SUM(il.delta) FILTER (WHERE il.location_id = l.location_id), 0)
                    )
                ) FILTER (WHERE l.location_id IS NOT NULL) as stock_by_location
            FROM product_variants pv
            INNER JOIN products p ON pv.product_id = p.product_id
            LEFT JOIN sizes s ON pv.size_id = s.size_id
            LEFT JOIN colors c ON pv.color_id = c.color_id
            LEFT JOIN inventory_ledger il ON pv.variant_id = il.variant_id
            LEFT JOIN locations l ON il.location_id = l.location_id AND l.is_active = true
            WHERE p.tienda_id = :tienda_id AND pv.is_active = true
            GROUP BY pv.variant_id, pv.product_id, p.name, pv.sku, s.name, c.name, pv.price
        )
        SELECT * FROM stock_data
        ORDER BY product_name, sku
        LIMIT :limit OFFSET :offset
    """)
    
    result = await session.execute(sql, {
        "tienda_id": str(current_tienda.id),
        "limit": limit,
        "offset": offset
    })
    rows = result.fetchall()
    
    return [
        ProductVariantStock(
            variant_id=str(row[0]),
            product_id=str(row[1]),
            product_name=row[2],
            sku=row[3],
            size_name=row[4],
            color_name=row[5],
            price=float(row[6]),
            stock_total=float(row[7]),
            stock_by_location=row[8] if row[8] else []
        )
        for row in rows
    ]


@router.get("/variant/{variant_id}", response_model=ProductVariantStock)
async def stock_by_variant(
    variant_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ProductVariantStock:
    """
    Stock de una variante específica con desglose por ubicaciones
    """
    sql = text("""
        SELECT 
            pv.variant_id,
            pv.product_id,
            p.name as product_name,
            pv.sku,
            s.name as size_name,
            c.name as color_name,
            pv.price,
            COALESCE(SUM(il.delta), 0) as stock_total,
            json_agg(
                json_build_object(
                    'location_id', l.location_id::text,
                    'location_name', l.name,
                    'stock', COALESCE(SUM(il.delta) FILTER (WHERE il.location_id = l.location_id), 0)
                )
            ) FILTER (WHERE l.location_id IS NOT NULL) as stock_by_location
        FROM product_variants pv
        INNER JOIN products p ON pv.product_id = p.product_id
        LEFT JOIN sizes s ON pv.size_id = s.size_id
        LEFT JOIN colors c ON pv.color_id = c.color_id
        LEFT JOIN inventory_ledger il ON pv.variant_id = il.variant_id
        LEFT JOIN locations l ON il.location_id = l.location_id AND l.is_active = true
        WHERE pv.variant_id = :variant_id AND p.tienda_id = :tienda_id
        GROUP BY pv.variant_id, pv.product_id, p.name, pv.sku, s.name, c.name, pv.price
    """)
    
    result = await session.execute(sql, {
        "variant_id": str(variant_id),
        "tienda_id": str(current_tienda.id)
    })
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variante no encontrada"
        )
    
    return ProductVariantStock(
        variant_id=str(row[0]),
        product_id=str(row[1]),
        product_name=row[2],
        sku=row[3],
        size_name=row[4],
        color_name=row[5],
        price=float(row[6]),
        stock_total=float(row[7]),
        stock_by_location=row[8] if row[8] else []
    )


@router.get("/transactions", response_model=List[InventoryTransactionRead])
async def stock_transactions(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    variant_id: Optional[UUID] = Query(None),
    location_id: Optional[UUID] = Query(None),
    reference_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> List[InventoryTransactionRead]:
    """
    Historial de transacciones de inventario
    """
    sql = """
        SELECT 
            il.transaction_id,
            il.variant_id,
            il.location_id,
            il.delta,
            il.reference_type,
            il.reference_id,
            il.notes,
            il.created_at,
            il.created_by,
            p.name as product_name,
            pv.sku,
            l.name as location_name
        FROM inventory_ledger il
        INNER JOIN product_variants pv ON il.variant_id = pv.variant_id
        INNER JOIN products p ON pv.product_id = p.product_id
        LEFT JOIN locations l ON il.location_id = l.location_id
        WHERE p.tienda_id = :tienda_id
    """
    
    params = {"tienda_id": str(current_tienda.id)}
    
    if variant_id:
        sql += " AND il.variant_id = :variant_id"
        params["variant_id"] = str(variant_id)
    
    if location_id:
        sql += " AND il.location_id = :location_id"
        params["location_id"] = str(location_id)
    
    if reference_type:
        sql += " AND il.reference_type = :reference_type"
        params["reference_type"] = reference_type
    
    sql += " ORDER BY il.created_at DESC LIMIT :limit OFFSET :offset"
    params["limit"] = limit
    params["offset"] = offset
    
    result = await session.execute(text(sql), params)
    rows = result.fetchall()
    
    return [
        InventoryTransactionRead(
            transaction_id=str(row[0]),
            variant_id=str(row[1]),
            location_id=str(row[2]),
            delta=float(row[3]),
            reference_type=row[4],
            reference_id=str(row[5]) if row[5] else None,
            notes=row[6],
            created_at=row[7],
            created_by=str(row[8]),
            product_name=row[9],
            sku=row[10],
            location_name=row[11]
        )
        for row in rows
    ]


@router.post("/adjustment", response_model=InventoryTransactionRead, status_code=status.HTTP_201_CREATED)
async def create_adjustment(
    data: StockAdjustmentRequest,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> InventoryTransactionRead:
    """
    Crear ajuste manual de inventario (entrada/salida)
    """
    # Verificar que la variante existe y pertenece a la tienda
    query = select(ProductVariant).join(Product).where(
        ProductVariant.variant_id == data.variant_id,
        Product.tienda_id == current_tienda.id
    )
    result = await session.execute(query)
    variant = result.scalar_one_or_none()
    
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variante no encontrada"
        )
    
    # Verificar que la ubicación existe y pertenece a la tienda
    query_loc = select(Location).where(
        Location.location_id == data.location_id,
        Location.tienda_id == current_tienda.id
    )
    result_loc = await session.execute(query_loc)
    location = result_loc.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ubicación no encontrada"
        )
    
    # Crear transacción
    transaction = InventoryLedger(
        variant_id=data.variant_id,
        location_id=data.location_id,
        delta=data.delta,
        reference_type="adjustment",
        notes=data.notes,
        created_by=current_tienda.id  # TODO: usar user_id del usuario actual
    )
    
    session.add(transaction)
    await session.commit()
    await session.refresh(transaction)
    
    # Obtener info adicional para respuesta
    sql = text("""
        SELECT p.name, pv.sku, l.name
        FROM inventory_ledger il
        INNER JOIN product_variants pv ON il.variant_id = pv.variant_id
        INNER JOIN products p ON pv.product_id = p.product_id
        LEFT JOIN locations l ON il.location_id = l.location_id
        WHERE il.transaction_id = :transaction_id
    """)
    
    result_info = await session.execute(sql, {"transaction_id": str(transaction.transaction_id)})
    info_row = result_info.fetchone()
    
    return InventoryTransactionRead(
        transaction_id=str(transaction.transaction_id),
        variant_id=str(transaction.variant_id),
        location_id=str(transaction.location_id),
        delta=transaction.delta,
        reference_type=transaction.reference_type,
        reference_id=str(transaction.reference_id) if transaction.reference_id else None,
        notes=transaction.notes,
        created_at=transaction.created_at,
        created_by=str(transaction.created_by),
        product_name=info_row[0] if info_row else None,
        sku=info_row[1] if info_row else None,
        location_name=info_row[2] if info_row else None
    )


@router.post("/transfer", status_code=status.HTTP_201_CREATED)
async def transfer_stock(
    data: StockTransferRequest,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Transferir stock entre ubicaciones
    """
    # Validar que las ubicaciones son diferentes
    if data.from_location_id == data.to_location_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las ubicaciones deben ser diferentes"
        )
    
    # Verificar variante
    query = select(ProductVariant).join(Product).where(
        ProductVariant.variant_id == data.variant_id,
        Product.tienda_id == current_tienda.id
    )
    result = await session.execute(query)
    variant = result.scalar_one_or_none()
    
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variante no encontrada"
        )
    
    # Verificar ubicaciones
    query_locs = select(Location).where(
        Location.location_id.in_([data.from_location_id, data.to_location_id]),
        Location.tienda_id == current_tienda.id
    )
    result_locs = await session.execute(query_locs)
    locations = result_locs.scalars().all()
    
    if len(locations) != 2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Una o ambas ubicaciones no encontradas"
        )
    
    # Verificar stock suficiente en ubicación origen
    sql_stock = text("""
        SELECT COALESCE(SUM(delta), 0)
        FROM inventory_ledger
        WHERE variant_id = :variant_id AND location_id = :location_id
    """)
    result_stock = await session.execute(sql_stock, {
        "variant_id": str(data.variant_id),
        "location_id": str(data.from_location_id)
    })
    stock_actual = result_stock.scalar()
    
    if stock_actual < data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente en ubicación origen (disponible: {stock_actual})"
        )
    
    # Crear transacciones (salida y entrada)
    transaction_from = InventoryLedger(
        variant_id=data.variant_id,
        location_id=data.from_location_id,
        delta=-data.quantity,
        reference_type="transfer",
        notes=f"Transferencia a otra ubicación. {data.notes or ''}".strip(),
        created_by=current_tienda.id
    )
    
    transaction_to = InventoryLedger(
        variant_id=data.variant_id,
        location_id=data.to_location_id,
        delta=data.quantity,
        reference_type="transfer",
        notes=f"Transferencia desde otra ubicación. {data.notes or ''}".strip(),
        created_by=current_tienda.id
    )
    
    # Vincular transacciones
    session.add(transaction_from)
    await session.flush()
    
    transaction_to.reference_id = transaction_from.transaction_id
    transaction_from.reference_id = transaction_to.transaction_id
    
    session.add(transaction_to)
    await session.commit()
    
    return {
        "message": "Transferencia completada exitosamente",
        "from_transaction_id": str(transaction_from.transaction_id),
        "to_transaction_id": str(transaction_to.transaction_id),
        "quantity": data.quantity
    }


@router.get("/locations", response_model=List[LocationRead])
async def get_locations(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    is_active: Optional[bool] = Query(True)
) -> List[LocationRead]:
    """
    Listar ubicaciones de la tienda
    """
    query = select(Location).where(Location.tienda_id == current_tienda.id)
    
    if is_active is not None:
        query = query.where(Location.is_active == is_active)
    
    query = query.order_by(Location.name)
    
    result = await session.execute(query)
    locations = result.scalars().all()
    
    return [
        LocationRead(
            location_id=str(loc.location_id),
            tienda_id=str(loc.tienda_id),
            name=loc.name,
            type=loc.type,
            address=loc.address,
            is_active=loc.is_active
        )
        for loc in locations
    ]


@router.get("/low-stock", response_model=List[ProductVariantStock])
async def low_stock_products(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    threshold: int = Query(10, ge=0, description="Umbral de stock bajo")
) -> List[ProductVariantStock]:
    """
    Productos con stock bajo (alerta)
    """
    sql = text("""
        WITH stock_data AS (
            SELECT 
                pv.variant_id,
                pv.product_id,
                p.name as product_name,
                pv.sku,
                s.name as size_name,
                c.name as color_name,
                pv.price,
                COALESCE(SUM(il.delta), 0) as stock_total,
                json_agg(
                    json_build_object(
                        'location_id', l.location_id::text,
                        'location_name', l.name,
                        'stock', COALESCE(SUM(il.delta) FILTER (WHERE il.location_id = l.location_id), 0)
                    )
                ) FILTER (WHERE l.location_id IS NOT NULL) as stock_by_location
            FROM product_variants pv
            INNER JOIN products p ON pv.product_id = p.product_id
            LEFT JOIN sizes s ON pv.size_id = s.size_id
            LEFT JOIN colors c ON pv.color_id = c.color_id
            LEFT JOIN inventory_ledger il ON pv.variant_id = il.variant_id
            LEFT JOIN locations l ON il.location_id = l.location_id AND l.is_active = true
            WHERE p.tienda_id = :tienda_id AND pv.is_active = true
            GROUP BY pv.variant_id, pv.product_id, p.name, pv.sku, s.name, c.name, pv.price
            HAVING COALESCE(SUM(il.delta), 0) <= :threshold
        )
        SELECT * FROM stock_data
        ORDER BY stock_total ASC, product_name
    """)
    
    result = await session.execute(sql, {
        "tienda_id": str(current_tienda.id),
        "threshold": threshold
    })
    rows = result.fetchall()
    
    return [
        ProductVariantStock(
            variant_id=str(row[0]),
            product_id=str(row[1]),
            product_name=row[2],
            sku=row[3],
            size_name=row[4],
            color_name=row[5],
            price=float(row[6]),
            stock_total=float(row[7]),
            stock_by_location=row[8] if row[8] else []
        )
        for row in rows
    ]
