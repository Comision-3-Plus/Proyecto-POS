"""
Schemas Pydantic para Inventory Ledger System
Requests y Responses para productos con variantes
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# =====================================================
# SCHEMAS PARA DIMENSIONES (Talles y Colores)
# =====================================================

class SizeRead(BaseModel):
    """Schema para leer un talle"""
    id: int
    tienda_id: UUID
    name: str
    sort_order: int
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ColorRead(BaseModel):
    """Schema para leer un color"""
    id: int
    tienda_id: UUID
    name: str
    hex_code: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}


class LocationRead(BaseModel):
    """Schema para leer una ubicación"""
    location_id: UUID
    tienda_id: UUID
    name: str
    type: str
    address: Optional[str] = None
    is_default: bool
    external_erp_id: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}


# =====================================================
# SCHEMAS PARA VARIANTES DE PRODUCTO
# =====================================================

class ProductVariantCreate(BaseModel):
    """Schema para crear una variante al crear un producto"""
    size_id: Optional[int] = Field(None, description="ID del talle")
    color_id: Optional[int] = Field(None, description="ID del color")
    initial_stock: float = Field(..., ge=0, description="Stock inicial en la ubicación default")
    location_id: Optional[UUID] = Field(None, description="Ubicación donde se carga el stock (default si no se especifica)")
    price: float = Field(..., gt=0, description="Precio de venta")
    barcode: Optional[str] = Field(None, max_length=50, description="Código de barras EAN13")
    
    @field_validator('initial_stock')
    def validate_stock(cls, v):
        if v < 0:
            raise ValueError('Stock inicial no puede ser negativo')
        return v


class ProductVariantRead(BaseModel):
    """Schema para leer una variante con dimensiones expandidas"""
    variant_id: UUID
    product_id: UUID
    tienda_id: UUID
    sku: str
    size: Optional[SizeRead] = None
    color: Optional[ColorRead] = None
    price: float
    barcode: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    # Stock actual (calculado desde ledger)
    stock_total: Optional[float] = Field(None, description="Stock total en todas las ubicaciones")
    
    model_config = {"from_attributes": True}


class ProductVariantWithStock(BaseModel):
    """Schema para variante con detalle de stock por ubicación"""
    variant_id: UUID
    sku: str
    size_name: Optional[str] = None
    color_name: Optional[str] = None
    price: float
    barcode: Optional[str] = None
    stock_by_location: List[dict] = Field(default_factory=list, description="Stock por ubicación")
    stock_total: float = Field(default=0, description="Stock total")


# =====================================================
# SCHEMAS PARA PRODUCTOS
# =====================================================

class ProductCreate(BaseModel):
    """
    Schema para crear un producto CON variantes obligatorias
    Breaking change: ya no acepta JSONB, requiere variantes estructuradas
    """
    name: str = Field(..., min_length=1, max_length=255, description="Nombre del producto")
    base_sku: Optional[str] = Field(None, min_length=1, max_length=50, description="SKU base (se genera automáticamente si no se provee)")
    description: Optional[str] = Field(None, description="Descripción detallada")
    category: Optional[str] = Field(None, max_length=100, description="Categoría")
    variants: List[ProductVariantCreate] = Field(..., min_length=1, description="Lista de variantes (mínimo 1)")
    
    @field_validator('variants')
    def validate_variants(cls, v):
        if not v or len(v) == 0:
            raise ValueError('Debe crear al menos una variante')
        return v
    
    @field_validator('base_sku')
    def validate_sku(cls, v):
        if v is None:
            return v
        # SKU solo alfanuméricos y guiones
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('SKU solo puede contener letras, números, guiones y guiones bajos')
        return v.upper()


class ProductRead(BaseModel):
    """Schema para leer un producto (con primera variante para UI)"""
    product_id: UUID
    tienda_id: UUID
    name: str
    base_sku: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Conteo de variantes
    variants_count: Optional[int] = Field(None, description="Número de variantes activas")
    
    # Primera variante con stock (para UI rápida)
    variants: List[Dict[str, Any]] = Field(default_factory=list, description="Primera variante con stock_total")
    
    model_config = {"from_attributes": True}


class ProductDetail(BaseModel):
    """Schema para detalle completo del producto con variantes"""
    product_id: UUID
    tienda_id: UUID
    name: str
    base_sku: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Variantes expandidas
    variants: List[ProductVariantRead] = Field(default_factory=list)
    
    model_config = {"from_attributes": True}


# =====================================================
# SCHEMAS PARA INVENTORY LEDGER
# =====================================================

class InventoryTransactionCreate(BaseModel):
    """Schema para crear una transacción de inventario"""
    variant_id: UUID
    location_id: UUID
    delta: float = Field(..., description="Cambio en stock: +N entradas, -N salidas")
    transaction_type: str = Field(..., description="SALE, PURCHASE, RETURN, ADJUSTMENT, INITIAL_STOCK, TRANSFER")
    reference_doc: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    
    @field_validator('delta')
    def validate_delta(cls, v):
        if v == 0:
            raise ValueError('Delta no puede ser cero')
        return v
    
    @field_validator('transaction_type')
    def validate_transaction_type(cls, v):
        valid_types = ['SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'INITIAL_STOCK', 'TRANSFER']
        if v.upper() not in valid_types:
            raise ValueError(f'Tipo de transacción debe ser uno de: {", ".join(valid_types)}')
        return v.upper()


class InventoryTransactionRead(BaseModel):
    """Schema para leer una transacción de inventario"""
    transaction_id: UUID
    tienda_id: UUID
    variant_id: UUID
    location_id: UUID
    delta: float
    transaction_type: str
    reference_doc: Optional[str] = None
    notes: Optional[str] = None
    occurred_at: datetime
    created_by: Optional[UUID] = None
    
    model_config = {"from_attributes": True}


class StockSummary(BaseModel):
    """Schema para resumen de stock de una variante"""
    variant_id: UUID
    sku: str
    product_name: str
    size_name: Optional[str] = None
    color_name: Optional[str] = None
    stock_by_location: List[dict] = Field(
        default_factory=list,
        description="Lista de ubicaciones con stock: [{location_name, location_id, stock}]"
    )
    total_stock: float = Field(description="Stock total en todas las ubicaciones")


# =====================================================
# SCHEMAS DE RESPUESTA PARA API
# =====================================================

class ProductCreateResponse(BaseModel):
    """Respuesta al crear un producto con variantes"""
    product: ProductRead
    variants_created: List[ProductVariantRead]
    inventory_transactions: int = Field(description="Número de transacciones creadas")
    message: str = "Producto y variantes creados exitosamente"


class AddVariantRequest(BaseModel):
    """Request para agregar una nueva variante a un producto existente"""
    size_id: Optional[int] = None
    color_id: Optional[int] = None
    price: float = Field(..., gt=0)
    barcode: Optional[str] = None
    initial_stock: float = Field(default=0, ge=0)
    location_id: Optional[UUID] = None


class StockAdjustmentRequest(BaseModel):
    """Request para ajustar el stock de una variante"""
    variant_id: UUID
    location_id: UUID
    delta: float = Field(..., description="Ajuste: +N para aumentar, -N para reducir")
    notes: Optional[str] = Field(None, description="Motivo del ajuste")
    
    @field_validator('delta')
    def validate_delta(cls, v):
        if v == 0:
            raise ValueError('Delta no puede ser cero')
        return v
