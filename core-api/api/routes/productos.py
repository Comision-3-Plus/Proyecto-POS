"""
Rutas de Productos - Inventory Ledger System
BREAKING CHANGES: API completamente nueva con variantes y ledger
"""
from typing import Annotated, Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from core.db import get_session
from core.cache import invalidate_cache
import logging
from models import (
    Product, ProductVariant, InventoryLedger,
    Size, Color, Location, Tienda
)
from schemas_models.inventory_ledger import (
    ProductCreate,
    ProductRead,
    ProductDetail,
    ProductVariantRead,
    ProductVariantWithStock,
    StockSummary,
    ProductCreateResponse,
    AddVariantRequest,
    InventoryTransactionCreate,
    SizeRead,
    ColorRead
)
from api.deps import CurrentTienda

router = APIRouter(prefix="/productos", tags=["Productos - Inventory Ledger"])
logger = logging.getLogger(__name__)


# =====================================================
# CATÁLOGOS: SIZES, COLORS, LOCATIONS
# =====================================================

@router.get("/sizes", response_model=List[SizeRead])
async def listar_sizes(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> List[SizeRead]:
    """
    Lista todos los talles de la tienda ordenados por sort_order
    """
    query = select(Size).where(
        Size.tienda_id == current_tienda.id
    ).order_by(Size.sort_order)
    
    result = await session.execute(query)
    sizes = result.scalars().all()
    
    return [SizeRead.model_validate(s) for s in sizes]


@router.get("/colors", response_model=List[ColorRead])
async def listar_colors(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> List[ColorRead]:
    """
    Lista todos los colores de la tienda
    """
    query = select(Color).where(
        Color.tienda_id == current_tienda.id
    ).order_by(Color.name)
    
    result = await session.execute(query)
    colors = result.scalars().all()
    
    return [ColorRead.model_validate(c) for c in colors]


@router.get("/locations", response_model=List)
async def listar_locations(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> List[dict]:
    """
    Lista todas las ubicaciones (sucursales/depósitos) de la tienda
    """
    query = select(Location).where(
        Location.tienda_id == current_tienda.id
    ).order_by(Location.is_default.desc(), Location.name)
    
    result = await session.execute(query)
    locations = result.scalars().all()
    
    return [
        {
            "location_id": str(loc.location_id),
            "name": loc.name,
            "type": loc.type,
            "address": loc.address,
            "is_default": loc.is_default
        }
        for loc in locations
    ]


# =====================================================
# HELPERS: GENERACIÓN DE SKU Y CÁLCULO DE STOCK
# =====================================================

def generate_variant_sku(base_sku: str, color_name: Optional[str], size_name: Optional[str]) -> str:
    """
    Genera SKU único para una variante
    Formato: BASE-COLOR-SIZE o BASE-COLOR o BASE-SIZE
    """
    parts = [base_sku.upper()]
    if color_name:
        parts.append(color_name.upper().replace(' ', ''))
    if size_name:
        parts.append(size_name.upper().replace(' ', ''))
    
    return '-'.join(parts)


async def calculate_stock_by_variant(
    session: AsyncSession,
    variant_id: UUID,
    location_id: Optional[UUID] = None
) -> float:
    """
    Calcula stock actual de una variante desde el ledger
    Si location_id es None, devuelve stock total de todas las ubicaciones
    """
    query = select(func.sum(InventoryLedger.delta)).where(
        InventoryLedger.variant_id == variant_id
    )
    
    if location_id:
        query = query.where(InventoryLedger.location_id == location_id)
    
    result = await session.execute(query)
    stock = result.scalar()
    return float(stock) if stock is not None else 0.0


async def get_stock_by_location(
    session: AsyncSession,
    variant_id: UUID
) -> List[dict]:
    """
    Obtiene stock de una variante por cada ubicación
    """
    query = select(
        Location.location_id,
        Location.name,
        Location.type,
        func.sum(InventoryLedger.delta).label('stock')
    ).select_from(InventoryLedger).join(
        Location, InventoryLedger.location_id == Location.location_id
    ).where(
        InventoryLedger.variant_id == variant_id
    ).group_by(
        Location.location_id, Location.name, Location.type
    )
    
    result = await session.execute(query)
    locations_stock = []
    
    for row in result:
        locations_stock.append({
            "location_id": str(row.location_id),
            "location_name": row.name,
            "location_type": row.type,
            "stock": float(row.stock) if row.stock else 0.0
        })
    
    return locations_stock


# =====================================================
# POST /productos - CREAR PRODUCTO CON VARIANTES
# =====================================================

@router.post("/", response_model=ProductCreateResponse, status_code=status.HTTP_201_CREATED)
async def crear_producto(
    producto_data: ProductCreate,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ProductCreateResponse:
    """
    Crea un producto padre CON variantes obligatorias
    
    **BREAKING CHANGE**: Ya no acepta JSONB. Requiere:
    - Lista de variantes (mínimo 1)
    - Cada variante con size_id, color_id, price, initial_stock
    
    **Flujo transaccional:**
    1. Crea Product padre
    2. Para cada variante:
       - Genera SKU único
       - Crea ProductVariant
       - Crea transacción INITIAL_STOCK en ledger
    3. Todo en una transacción ACID
    """
    # Validar que base_sku no esté duplicado
    query = select(Product).where(
        Product.tienda_id == current_tienda.id,
        Product.base_sku == producto_data.base_sku
    )
    result = await session.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un producto con base_sku '{producto_data.base_sku}'"
        )
    
    # Obtener ubicación default de la tienda
    default_location_query = select(Location).where(
        Location.tienda_id == current_tienda.id,
        Location.is_default == True
    )
    default_location_result = await session.execute(default_location_query)
    default_location = default_location_result.scalar_one_or_none()
    
    if not default_location:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="La tienda no tiene una ubicación default configurada"
        )
    
    try:
        # 1. Crear producto padre
        nuevo_producto = Product(
            tienda_id=current_tienda.id,
            name=producto_data.name,
            base_sku=producto_data.base_sku,
            description=producto_data.description,
            category=producto_data.category,
            is_active=True
        )
        session.add(nuevo_producto)
        await session.flush()  # Para obtener el product_id
        
        variantes_creadas = []
        transacciones_count = 0
        
        # 2. Crear variantes
        for variant_data in producto_data.variants:
            # Obtener nombres de size y color si existen
            size_name = None
            color_name = None
            
            if variant_data.size_id:
                size_query = select(Size).where(
                    Size.id == variant_data.size_id,
                    Size.tienda_id == current_tienda.id
                )
                size_result = await session.execute(size_query)
                size = size_result.scalar_one_or_none()
                if size:
                    size_name = size.name
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Talle con ID {variant_data.size_id} no encontrado"
                    )
            
            if variant_data.color_id:
                color_query = select(Color).where(
                    Color.id == variant_data.color_id,
                    Color.tienda_id == current_tienda.id
                )
                color_result = await session.execute(color_query)
                color = color_result.scalar_one_or_none()
                if color:
                    color_name = color.name
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Color con ID {variant_data.color_id} no encontrado"
                    )
            
            # Generar SKU único
            variant_sku = generate_variant_sku(producto_data.base_sku, color_name, size_name)
            
            # Validar SKU único
            sku_check = select(ProductVariant).where(
                ProductVariant.tienda_id == current_tienda.id,
                ProductVariant.sku == variant_sku
            )
            sku_result = await session.execute(sku_check)
            if sku_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe una variante con SKU '{variant_sku}'"
                )
            
            # Crear variante
            nueva_variante = ProductVariant(
                product_id=nuevo_producto.product_id,
                tienda_id=current_tienda.id,
                sku=variant_sku,
                size_id=variant_data.size_id,
                color_id=variant_data.color_id,
                price=variant_data.price,
                barcode=variant_data.barcode,
                is_active=True
            )
            session.add(nueva_variante)
            await session.flush()  # Para obtener variant_id
            
            # Crear transacción de stock inicial si hay stock
            if variant_data.initial_stock > 0:
                ubicacion_destino = variant_data.location_id or default_location.location_id
                # Convertir a UUID si es string
                if isinstance(ubicacion_destino, str):
                    ubicacion_destino = UUID(ubicacion_destino)
                
                transaccion = InventoryLedger(
                    tienda_id=current_tienda.id,
                    variant_id=nueva_variante.variant_id,
                    location_id=ubicacion_destino,
                    delta=variant_data.initial_stock,
                    transaction_type='INITIAL_STOCK',
                    reference_doc=f"PRODUCT_CREATION_{nuevo_producto.product_id}",
                    notes=f"Stock inicial al crear producto"
                )
                session.add(transaccion)
                transacciones_count += 1
            
            variantes_creadas.append(nueva_variante)
        
        # Commit de toda la transacción
        await session.commit()
        
        # Refresh para obtener relaciones
        await session.refresh(nuevo_producto)
        for variante in variantes_creadas:
            await session.refresh(variante)
        
        # Invalidar caché
        invalidate_cache(f"productos:{current_tienda.id}")
        
        logger.info(
            f"Producto creado: {nuevo_producto.product_id} con {len(variantes_creadas)} variantes"
        )
        
        # Construir respuesta
        producto_dict = {
            "product_id": str(nuevo_producto.product_id),
            "tienda_id": str(nuevo_producto.tienda_id),
            "name": nuevo_producto.name,
            "base_sku": nuevo_producto.base_sku,
            "description": nuevo_producto.description,
            "category": nuevo_producto.category,
            "is_active": nuevo_producto.is_active,
            "created_at": nuevo_producto.created_at,
            "updated_at": nuevo_producto.updated_at,
            "variants_count": len(variantes_creadas),
            "variants": []
        }
        producto_read = ProductRead(**producto_dict)
        
        variantes_read = []
        for variante in variantes_creadas:
            # Cargar relaciones de size y color
            await session.refresh(variante, attribute_names=['size', 'color'])
            
            variant_dict = {
                "variant_id": str(variante.variant_id),
                "product_id": str(variante.product_id),
                "tienda_id": str(variante.tienda_id),
                "sku": variante.sku,
                "size_id": variante.size_id,
                "size_name": variante.size.name if variante.size else None,
                "color_id": variante.color_id,
                "color_name": variante.color.name if variante.color else None,
                "price": float(variante.price),
                "barcode": variante.barcode,
                "is_active": variante.is_active,
                "created_at": variante.created_at,
                "stock_total": float(await calculate_stock_by_variant(session, variante.variant_id))
            }
            variantes_read.append(ProductVariantRead(**variant_dict))
        
        return ProductCreateResponse(
            product=producto_read,
            variants_created=variantes_read,
            inventory_transactions=transacciones_count
        )
        
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Error creando producto: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando producto: {str(e)}"
        )


# =====================================================
# GET /productos - LISTAR PRODUCTOS
# =====================================================

@router.get("/", response_model=List[ProductRead])
async def listar_productos(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None, description="Buscar por nombre o base_sku"),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = True
) -> List[ProductRead]:
    """
    Lista productos padre CON primera variante y stock para UI rápida
    
    Optimizado con SQL directo para mejor performance
    """
    from sqlalchemy import text
    
    sql = """
        SELECT 
            p.product_id,
            p.tienda_id,
            p.name,
            p.base_sku,
            p.description,
            p.category,
            p.is_active,
            p.created_at,
            p.updated_at,
            COUNT(DISTINCT pv.variant_id) FILTER (WHERE pv.is_active = true) as variants_count,
            (SELECT json_agg(v_data)
             FROM (
                SELECT 
                    pv2.variant_id,
                    pv2.sku,
                    pv2.price,
                    pv2.is_active,
                    COALESCE(SUM(il.delta), 0) as stock_total
                FROM product_variants pv2
                LEFT JOIN inventory_ledger il ON pv2.variant_id = il.variant_id
                WHERE pv2.product_id = p.product_id AND pv2.is_active = true
                GROUP BY pv2.variant_id, pv2.sku, pv2.price, pv2.is_active
                ORDER BY pv2.created_at
                LIMIT 1
             ) v_data
            ) as first_variant
        FROM products p
        LEFT JOIN product_variants pv ON p.product_id = pv.product_id
        WHERE p.tienda_id = :tienda_id
    """
    
    params = {"tienda_id": str(current_tienda.id)}
    
    if search:
        sql += " AND (p.name ILIKE :search OR p.base_sku ILIKE :search)"
        params["search"] = f"%{search}%"
    
    if category:
        sql += " AND p.category = :category"
        params["category"] = category
    
    if is_active is not None:
        sql += " AND p.is_active = :is_active"
        params["is_active"] = is_active
    
    sql += """
        GROUP BY p.product_id
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :skip
    """
    
    params["limit"] = limit
    params["skip"] = skip
    
    result = await session.execute(text(sql), params)
    rows = result.fetchall()
    
    # Construir respuesta
    productos_response = []
    for row in rows:
        variants = []
        if row[10]:  # first_variant
            variant_data = row[10][0] if isinstance(row[10], list) and len(row[10]) > 0 else row[10]
            if variant_data:
                variants.append({
                    "variant_id": variant_data.get("variant_id"),
                    "sku": variant_data.get("sku"),
                    "price": variant_data.get("price"),
                    "is_active": variant_data.get("is_active"),
                    "stock_total": variant_data.get("stock_total", 0)
                })
        
        producto_dict = {
            "product_id": str(row[0]),
            "tienda_id": str(row[1]),
            "name": row[2],
            "base_sku": row[3],
            "description": row[4],
            "category": row[5],
            "is_active": row[6],
            "created_at": row[7],
            "updated_at": row[8],
            "variants_count": row[9] or 0,
            "variants": variants
        }
        productos_response.append(ProductRead(**producto_dict))
    
    return productos_response


# =====================================================
# GET /productos/{id} - DETALLE PRODUCTO
# =====================================================

@router.get("/{product_id}", response_model=ProductDetail)
async def obtener_producto(
    product_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ProductDetail:
    """
    Obtiene detalle completo del producto CON variantes expandidas
    """
    query = select(Product).options(
        selectinload(Product.variants).selectinload(ProductVariant.size),
        selectinload(Product.variants).selectinload(ProductVariant.color)
    ).where(
        Product.product_id == product_id,
        Product.tienda_id == current_tienda.id
    )
    
    result = await session.execute(query)
    producto = result.scalar_one_or_none()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Construir respuesta con variantes
    producto_dict = ProductDetail.model_validate(producto).model_dump()
    
    # Agregar stock a cada variante
    variantes_con_stock = []
    for variante in producto.variants:
        if variante.is_active:
            variant_dict = ProductVariantRead.model_validate(variante).model_dump()
            variant_dict['stock_total'] = await calculate_stock_by_variant(session, variante.variant_id)
            variantes_con_stock.append(ProductVariantRead(**variant_dict))
    
    producto_dict['variants'] = variantes_con_stock
    
    return ProductDetail(**producto_dict)


# =====================================================
# GET /productos/{id}/variants - LISTAR VARIANTES
# =====================================================

@router.get("/{product_id}/variants", response_model=List[ProductVariantWithStock])
async def listar_variantes_producto(
    product_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> List[ProductVariantWithStock]:
    """
    Lista todas las variantes de un producto con stock por ubicación
    """
    # Verificar que el producto existe y pertenece a la tienda
    product_query = select(Product).where(
        Product.product_id == product_id,
        Product.tienda_id == current_tienda.id
    )
    product_result = await session.execute(product_query)
    if not product_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Obtener variantes
    variants_query = select(ProductVariant).options(
        selectinload(ProductVariant.size),
        selectinload(ProductVariant.color)
    ).where(
        ProductVariant.product_id == product_id,
        ProductVariant.is_active == True
    )
    
    variants_result = await session.execute(variants_query)
    variantes = variants_result.scalars().all()
    
    # Construir respuesta con stock por ubicación
    variantes_response = []
    for variante in variantes:
        stock_by_loc = await get_stock_by_location(session, variante.variant_id)
        total_stock = sum(loc['stock'] for loc in stock_by_loc)
        
        variantes_response.append(ProductVariantWithStock(
            variant_id=variante.variant_id,
            sku=variante.sku,
            size_name=variante.size.name if variante.size else None,
            color_name=variante.color.name if variante.color else None,
            price=variante.price,
            barcode=variante.barcode,
            stock_by_location=stock_by_loc,
            stock_total=total_stock
        ))
    
    return variantes_response


# =====================================================
# GET /productos/variants/{variant_id}/stock
# =====================================================

@router.get("/variants/{variant_id}/stock", response_model=StockSummary)
async def obtener_stock_variante(
    variant_id: UUID,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> StockSummary:
    """
    Obtiene resumen de stock de una variante específica por ubicación
    """
    # Obtener variante con relaciones
    query = select(ProductVariant).options(
        selectinload(ProductVariant.product),
        selectinload(ProductVariant.size),
        selectinload(ProductVariant.color)
    ).where(
        ProductVariant.variant_id == variant_id,
        ProductVariant.tienda_id == current_tienda.id
    )
    
    result = await session.execute(query)
    variante = result.scalar_one_or_none()
    
    if not variante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variante no encontrada"
        )
    
    # Obtener stock por ubicación
    stock_by_loc = await get_stock_by_location(session, variant_id)
    total_stock = sum(loc['stock'] for loc in stock_by_loc)
    
    return StockSummary(
        variant_id=variant_id,
        sku=variante.sku,
        product_name=variante.product.name,
        size_name=variante.size.name if variante.size else None,
        color_name=variante.color.name if variante.color else None,
        stock_by_location=stock_by_loc,
        total_stock=total_stock
    )


# =====================================================
# POST /productos/{id}/variants - AGREGAR VARIANTE
# =====================================================

@router.post("/{product_id}/variants", response_model=ProductVariantRead, status_code=status.HTTP_201_CREATED)
async def agregar_variante(
    product_id: UUID,
    variant_data: AddVariantRequest,
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ProductVariantRead:
    """
    Agrega una nueva variante a un producto existente
    """
    # Verificar producto
    product_query = select(Product).where(
        Product.product_id == product_id,
        Product.tienda_id == current_tienda.id
    )
    product_result = await session.execute(product_query)
    producto = product_result.scalar_one_or_none()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Obtener nombres de size y color
    size_name = None
    color_name = None
    
    if variant_data.size_id:
        size = await session.get(Size, variant_data.size_id)
        if not size or size.tienda_id != current_tienda.id:
            raise HTTPException(status_code=404, detail="Talle no encontrado")
        size_name = size.name
    
    if variant_data.color_id:
        color = await session.get(Color, variant_data.color_id)
        if not color or color.tienda_id != current_tienda.id:
            raise HTTPException(status_code=404, detail="Color no encontrado")
        color_name = color.name
    
    # Generar SKU
    variant_sku = generate_variant_sku(producto.base_sku, color_name, size_name)
    
    # Validar SKU único
    sku_check = select(ProductVariant).where(
        ProductVariant.tienda_id == current_tienda.id,
        ProductVariant.sku == variant_sku
    )
    if (await session.execute(sku_check)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Variante con SKU '{variant_sku}' ya existe")
    
    # Crear variante
    nueva_variante = ProductVariant(
        product_id=product_id,
        tienda_id=current_tienda.id,
        sku=variant_sku,
        size_id=variant_data.size_id,
        color_id=variant_data.color_id,
        price=variant_data.price,
        barcode=variant_data.barcode
    )
    session.add(nueva_variante)
    await session.flush()
    
    # Crear stock inicial si hay
    if variant_data.initial_stock > 0:
        # Obtener ubicación default
        default_location = (await session.execute(
            select(Location).where(
                Location.tienda_id == current_tienda.id,
                Location.is_default == True
            )
        )).scalar_one()
        
        transaccion = InventoryLedger(
            tienda_id=current_tienda.id,
            variant_id=nueva_variante.variant_id,
            location_id=variant_data.location_id or default_location.location_id,
            delta=variant_data.initial_stock,
            transaction_type='INITIAL_STOCK',
            notes="Stock inicial al agregar variante"
        )
        session.add(transaccion)
    
    await session.commit()
    await session.refresh(nueva_variante, attribute_names=['size', 'color'])
    
    variant_dict = ProductVariantRead.model_validate(nueva_variante).model_dump()
    variant_dict['stock_total'] = await calculate_stock_by_variant(session, nueva_variante.variant_id)
    
    return ProductVariantRead(**variant_dict)
