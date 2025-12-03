"""
Modelos de Base de Datos - Nexus POS
SQLModel con soporte Multi-Tenant
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB

# Importar modelos de auditoría
from models_audit import AuditLog, PermissionAudit  # noqa: F401

# Importar modelos adicionales de schemas_models
from schemas_models.ecommerce_models import (  # noqa: F401
    IntegracionEcommerce,
    SyncLog,
    ProductMapping,
    APIKey
)
from schemas_models.retail_models import (  # noqa: F401
    ProductCategory,
    Webhook,
    ProductoLegacy
)

# ⚠️ MODELOS ELIMINADOS (tablas eliminadas en migración):
# - loyalty_models: CustomerWallet, WalletTransaction, GiftCard, GiftCardUso, LoyaltyProgram
# - promo_models: Promocion, PromocionUso
# - rfid_models: RFIDTag, RFIDScanSession, RFIDScanItem, RFIDReader, RFIDInventoryDiscrepancy
# - oms_models: OrdenOmnicanal, OrdenItem, ShippingZone, LocationCapability


class Tienda(SQLModel, table=True):
    """
    Modelo de Tienda - Entidad principal Multi-Tenant
    Cada tienda representa un cliente independiente del sistema
    """
    __tablename__ = "tiendas"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    nombre: str = Field(
        max_length=255,
        nullable=False,
        index=True
    )
    rubro: str = Field(
        default="general",
        max_length=50,
        nullable=False,
        description="Categoría del negocio: ropa, carniceria, ferreteria, etc."
    )
    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Relaciones
    users: List["User"] = Relationship(back_populates="tienda")
    clientes: List["Cliente"] = Relationship(back_populates="tienda")
    productos: List["Producto"] = Relationship(back_populates="tienda")
    ventas: List["Venta"] = Relationship(back_populates="tienda")
    insights: List["Insight"] = Relationship(back_populates="tienda")
    sesiones_caja: List["SesionCaja"] = Relationship(back_populates="tienda")
    movimientos_caja: List["MovimientoCaja"] = Relationship(back_populates="tienda")
    proveedores: List["Proveedor"] = Relationship(back_populates="tienda")
    ordenes_compra: List["OrdenCompra"] = Relationship(back_populates="tienda")
    facturas: List["Factura"] = Relationship(back_populates="tienda")
    
    # Nuevas relaciones para inventory ledger
    locations: List["Location"] = Relationship(back_populates="tienda")
    sizes: List["Size"] = Relationship(back_populates="tienda")
    colors: List["Color"] = Relationship(back_populates="tienda")
    products: List["Product"] = Relationship(back_populates="tienda")
    
    # ✅ RETAIL: Categorías y webhooks
    product_categories: List["ProductCategory"] = Relationship(back_populates="tienda")
    webhooks: List["Webhook"] = Relationship(back_populates="tienda")


# =====================================================
# NUEVOS MODELOS: INVENTORY LEDGER SYSTEM
# =====================================================

class Size(SQLModel, table=True):
    """
    Modelo de Talle - Dimensión de producto
    Catálogo de talles por tienda (S, M, L, XL, 38, 40, etc.)
    """
    __tablename__ = "sizes"
    
    id: int = Field(
        default=None,
        primary_key=True,
        nullable=False
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el talle"
    )
    name: str = Field(
        max_length=20,
        nullable=False,
        description="Nombre del talle: S, M, L, 42, etc."
    )
    sort_order: int = Field(
        default=0,
        nullable=False,
        description="Orden para mostrar (S=1, M=2, L=3, etc.)"
    )
    category: Optional[str] = Field(
        default=None,
        max_length=50,
        nullable=True,
        description="Categoría de talle: numeric (42, 44), alpha (S, M, L), shoe (38, 39)"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Relaciones
    tienda: Optional["Tienda"] = Relationship(back_populates="sizes")
    variants: List["ProductVariant"] = Relationship(back_populates="size")


class Color(SQLModel, table=True):
    """
    Modelo de Color - Dimensión de producto
    Catálogo de colores por tienda con código hex
    """
    __tablename__ = "colors"
    
    id: int = Field(
        default=None,
        primary_key=True,
        nullable=False
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el color"
    )
    name: str = Field(
        max_length=50,
        nullable=False,
        description="Nombre del color: Rojo, Azul, Negro, etc."
    )
    hex_code: Optional[str] = Field(
        default=None,
        max_length=7,
        nullable=True,
        description="Código hexadecimal del color para UI: #FF0000"
    )
    sample_image_url: Optional[str] = Field(
        default=None,
        max_length=500,
        nullable=True,
        description="URL de imagen de muestra del color/textura"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Relaciones
    tienda: Optional["Tienda"] = Relationship(back_populates="colors")
    variants: List["ProductVariant"] = Relationship(back_populates="color")


class Location(SQLModel, table=True):
    """
    Modelo de Ubicación - Sucursal o Depósito
    Soporte multi-sucursal nativo con auto-provisioning de default
    """
    __tablename__ = "locations"
    
    location_id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False,
        alias="location_id"
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece la ubicación"
    )
    name: str = Field(
        max_length=100,
        nullable=False,
        description="Nombre de la ubicación: Sucursal Centro, Depósito Principal"
    )
    type: str = Field(
        max_length=20,
        nullable=False,
        description="Tipo: STORE, WAREHOUSE, VIRTUAL"
    )
    address: Optional[str] = Field(
        default=None,
        max_length=200,
        nullable=True,
        description="Dirección física de la ubicación"
    )
    is_default: bool = Field(
        default=False,
        nullable=False,
        description="Si es la ubicación default de la tienda"
    )
    external_erp_id: Optional[str] = Field(
        default=None,
        max_length=50,
        nullable=True,
        description="ID externo para integración con ERP (Lince, etc.)"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Relaciones
    tienda: Optional["Tienda"] = Relationship(back_populates="locations")
    inventory_transactions: List["InventoryLedger"] = Relationship(back_populates="location")


class Product(SQLModel, table=True):
    """
    Modelo de Producto Padre - Sin stock directo
    El stock se calcula desde las variantes a través del ledger
    """
    __tablename__ = "products"
    
    product_id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False,
        alias="product_id"
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el producto"
    )
    name: str = Field(
        max_length=255,
        nullable=False,
        index=True,
        description="Nombre del producto: Remera Básica, Pantalón Cargo, etc."
    )
    base_sku: str = Field(
        max_length=50,
        nullable=False,
        index=True,
        description="SKU base del producto (sin variante): REMERA-BASIC"
    )
    description: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Descripción detallada del producto"
    )
    category: Optional[str] = Field(
        default=None,
        max_length=100,
        nullable=True,
        description="Categoría del producto: indumentaria, calzado, accesorios"
    )
    
    # ✅ NUEVOS CAMPOS RETAIL DE ROPA
    season: Optional[str] = Field(
        default=None,
        max_length=50,
        nullable=True,
        description="Temporada: Verano 2025, Invierno 2024, Primavera-Verano 2025"
    )
    brand: Optional[str] = Field(
        default=None,
        max_length=100,
        nullable=True,
        description="Marca: Nike, Adidas, Zara, Propia"
    )
    material: Optional[str] = Field(
        default=None,
        max_length=200,
        nullable=True,
        description="Material: Algodón 100%, Poliéster 65% Algodón 35%"
    )
    care_instructions: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Instrucciones de cuidado: Lavar a mano, No planchar"
    )
    country_of_origin: Optional[str] = Field(
        default=None,
        max_length=100,
        nullable=True,
        description="País de origen: Argentina, China, Bangladesh"
    )
    images: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Array de URLs de imágenes: ['https://...jpg', 'https://...jpg']"
    )
    meta_title: Optional[str] = Field(
        default=None,
        max_length=200,
        nullable=True,
        description="Título SEO para e-commerce"
    )
    meta_description: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Descripción SEO para e-commerce"
    )
    tags: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Tags para búsqueda: ['verano', 'casual', 'deportivo']"
    )
    category_id: Optional[UUID] = Field(
        default=None,
        foreign_key="product_categories.id",
        nullable=True,
        index=True,
        description="ID de la categoría del producto"
    )
    
    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    )
    
    # Relaciones
    tienda: Optional["Tienda"] = Relationship(back_populates="products")
    category: Optional["ProductCategory"] = Relationship(back_populates="products")
    variants: List["ProductVariant"] = Relationship(
        back_populates="product",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class ProductVariant(SQLModel, table=True):
    """
    Modelo de Variante de Producto - Hijo con Talle/Color
    Cada variante tiene su propio SKU único y precio
    """
    __tablename__ = "product_variants"
    
    variant_id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False,
        alias="variant_id"
    )
    product_id: UUID = Field(
        foreign_key="products.product_id",
        nullable=False,
        index=True,
        description="ID del producto padre"
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda (desnormalizado para performance)"
    )
    sku: str = Field(
        max_length=100,
        nullable=False,
        index=True,
        description="SKU único generado: BASE-COLOR-TALLE"
    )
    size_id: Optional[int] = Field(
        default=None,
        foreign_key="sizes.id",
        nullable=True,
        description="ID del talle (NULL para productos sin talle)"
    )
    color_id: Optional[int] = Field(
        default=None,
        foreign_key="colors.id",
        nullable=True,
        description="ID del color (NULL para productos sin color)"
    )
    price: float = Field(
        nullable=False,
        description="Precio de venta de esta variante"
    )
    barcode: Optional[str] = Field(
        default=None,
        max_length=50,
        nullable=True,
        index=True,
        description="Código de barras EAN13 para escáner"
    )
    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Relaciones
    product: Optional["Product"] = Relationship(back_populates="variants")
    size: Optional["Size"] = Relationship(back_populates="variants")
    color: Optional["Color"] = Relationship(back_populates="variants")
    inventory_transactions: List["InventoryLedger"] = Relationship(
        back_populates="variant",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class InventoryLedger(SQLModel, table=True):
    """
    Modelo de Libro Mayor de Inventario - APPEND ONLY
    NUNCA se actualiza, solo se insertan transacciones
    Stock actual = SUM(delta) WHERE variant_id = X AND location_id = Y
    """
    __tablename__ = "inventory_ledger"
    
    transaction_id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False,
        alias="transaction_id"
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda (para particionamiento)"
    )
    variant_id: UUID = Field(
        foreign_key="product_variants.variant_id",
        nullable=False,
        index=True,
        description="ID de la variante del producto"
    )
    location_id: UUID = Field(
        foreign_key="locations.location_id",
        nullable=False,
        index=True,
        description="ID de la ubicación donde ocurre el movimiento"
    )
    delta: float = Field(
        nullable=False,
        description="Cambio en stock: +N entradas, -N salidas"
    )
    transaction_type: str = Field(
        max_length=50,
        nullable=False,
        index=True,
        description="Tipo: SALE, PURCHASE, RETURN, ADJUSTMENT, INITIAL_STOCK, TRANSFER"
    )
    reference_doc: Optional[str] = Field(
        default=None,
        max_length=100,
        nullable=True,
        description="ID de documento relacionado: venta_id, orden_compra_id, etc."
    )
    notes: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Notas adicionales sobre la transacción"
    )
    occurred_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now()),
        description="Cuándo ocurrió la transacción"
    )
    created_by: Optional[UUID] = Field(
        default=None,
        nullable=True,
        description="ID del usuario que creó la transacción"
    )
    
    # Relaciones
    variant: Optional["ProductVariant"] = Relationship(back_populates="inventory_transactions")
    location: Optional["Location"] = Relationship(back_populates="inventory_transactions")


# =====================================================
# FIN NUEVOS MODELOS - INVENTORY LEDGER
# =====================================================



class User(SQLModel, table=True):
    """
    Modelo de Usuario - Con aislamiento Multi-Tenant
    Cada usuario pertenece a una tienda específica (tienda_id)
    """
    __tablename__ = "users"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    email: str = Field(
        max_length=255,
        nullable=False,
        unique=True,
        index=True
    )
    hashed_password: str = Field(
        nullable=False,
        description="Password hasheado con bcrypt"
    )
    full_name: str = Field(
        max_length=255,
        nullable=False
    )
    rol: str = Field(
        max_length=50,
        nullable=False,
        description="Rol del usuario: owner, cajero, admin"
    )
    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Columna discriminadora Multi-Tenant (CRÍTICA)
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el usuario"
    )
    
    # Relaciones
    tienda: Optional[Tienda] = Relationship(back_populates="users")
    sesiones_caja: List["SesionCaja"] = Relationship(back_populates="usuario")


class Cliente(SQLModel, table=True):
    """
    Modelo de Cliente - CRM básico multi-tenant
    Registro de clientes para fidelización, historial y marketing
    """
    __tablename__ = "clientes"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    nombre: str = Field(
        max_length=255,
        nullable=False,
        index=True,
        description="Nombre completo del cliente"
    )
    email: Optional[str] = Field(
        default=None,
        max_length=255,
        nullable=True,
        index=True,
        description="Email del cliente para marketing y notificaciones"
    )
    telefono: Optional[str] = Field(
        default=None,
        max_length=50,
        nullable=True,
        description="Teléfono de contacto"
    )
    documento_tipo: Optional[str] = Field(
        default=None,
        max_length=20,
        nullable=True,
        description="Tipo de documento: DNI, CUIL, CUIT, PASAPORTE"
    )
    documento_numero: Optional[str] = Field(
        default=None,
        max_length=20,
        nullable=True,
        index=True,
        description="Número de documento"
    )
    fecha_nacimiento: Optional[datetime] = Field(
        default=None,
        nullable=True,
        description="Fecha de nacimiento para birthday rewards"
    )
    direccion: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Dirección del cliente"
    )
    ciudad: Optional[str] = Field(
        default=None,
        max_length=100,
        nullable=True
    )
    provincia: Optional[str] = Field(
        default=None,
        max_length=100,
        nullable=True
    )
    codigo_postal: Optional[str] = Field(
        default=None,
        max_length=20,
        nullable=True
    )
    notas: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Notas internas sobre el cliente"
    )
    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    )
    
    # Columna discriminadora Multi-Tenant (CRÍTICA)
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el cliente"
    )
    
    # Relaciones
    tienda: Optional[Tienda] = Relationship(back_populates="clientes")


class Producto(SQLModel, table=True):
    """
    Modelo de Producto - Polimórfico con JSONB
    Soporta diferentes tipos de productos con atributos personalizados
    """
    __tablename__ = "productos"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    nombre: str = Field(
        max_length=255,
        nullable=False,
        index=True
    )
    sku: str = Field(
        max_length=100,
        nullable=False,
        index=True,
        description="Código único del producto (Stock Keeping Unit)"
    )
    descripcion: Optional[str] = Field(
        default=None,
        nullable=True
    )
    precio_venta: float = Field(
        nullable=False,
        description="Precio de venta al público"
    )
    precio_costo: float = Field(
        nullable=False,
        description="Precio de costo del producto"
    )
    stock_actual: float = Field(
        default=0.0,
        nullable=False,
        description="Stock disponible actual (puede ser decimal para productos pesables)"
    )
    unidad_medida: str = Field(
        max_length=20,
        default="UNIDAD",
        nullable=False,
        description="Unidad de medida: UNIDAD (botellas, paquetes), KILO (productos pesables), LITRO, METRO"
    )
    tipo: str = Field(
        max_length=50,
        nullable=False,
        description="Tipo de producto: general, ropa, pesable"
    )
    atributos: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB),
        description="Atributos personalizados según el tipo de producto"
    )
    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    )
    
    # Columna discriminadora Multi-Tenant (CRÍTICA)
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el producto"
    )
    
    # Relaciones
    tienda: Optional[Tienda] = Relationship(back_populates="productos")
    detalles_venta: List["DetalleVenta"] = Relationship(back_populates="producto")
    detalles_orden: List["DetalleOrden"] = Relationship(back_populates="producto")


class Venta(SQLModel, table=True):
    """
    Modelo de Venta - Transacción de venta completa
    Cabecera de la venta con totales y método de pago
    """
    __tablename__ = "ventas"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    fecha: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now())
    )
    total: float = Field(
        nullable=False,
        description="Total calculado de la venta"
    )
    metodo_pago: str = Field(
        max_length=50,
        nullable=False,
        description="Método de pago: efectivo, tarjeta_debito, tarjeta_credito, transferencia"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Campos de Pago y Facturación
    status_pago: str = Field(
        default="pendiente",
        max_length=50,
        nullable=False,
        index=True,
        description="Estado del pago: pendiente, pagado, anulado"
    )
    payment_id: Optional[str] = Field(
        default=None,
        max_length=255,
        nullable=True,
        index=True,
        description="ID de la transacción en Mercado Pago u otro proveedor"
    )
    afip_cae: Optional[str] = Field(
        default=None,
        max_length=50,
        nullable=True,
        description="Código de Autorización Electrónica de AFIP"
    )
    afip_cae_vto: Optional[datetime] = Field(
        default=None,
        nullable=True,
        description="Fecha de vencimiento del CAE"
    )
    
    # Columna discriminadora Multi-Tenant (CRÍTICA)
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece la venta"
    )
    
    # Relaciones
    tienda: Optional[Tienda] = Relationship(back_populates="ventas")
    detalles: List["DetalleVenta"] = Relationship(back_populates="venta", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    factura: Optional["Factura"] = Relationship(back_populates="venta")


class DetalleVenta(SQLModel, table=True):
    """
    Modelo de Detalle de Venta - Items individuales de una venta
    Snapshot de precios al momento de la transacción
    """
    __tablename__ = "detalles_venta"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    cantidad: float = Field(
        nullable=False,
        description="Cantidad vendida (puede ser decimal para productos pesables)"
    )
    precio_unitario: float = Field(
        nullable=False,
        description="Precio unitario al momento de la venta (snapshot)"
    )
    subtotal: float = Field(
        nullable=False,
        description="Subtotal calculado: cantidad * precio_unitario"
    )
    
    # Foreign Keys
    venta_id: UUID = Field(
        foreign_key="ventas.id",
        nullable=False,
        index=True
    )
    producto_id: UUID = Field(
        foreign_key="productos.id",
        nullable=False,
        index=True
    )
    
    # Relaciones
    venta: Optional[Venta] = Relationship(back_populates="detalles")
    producto: Optional[Producto] = Relationship(back_populates="detalles_venta")


class Insight(SQLModel, table=True):
    """
    Modelo de Insight - Alertas y recomendaciones inteligentes
    Generadas automáticamente por el motor de análisis
    """
    __tablename__ = "insights"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    tipo: str = Field(
        max_length=100,
        nullable=False,
        index=True,
        description="Tipo de insight: STOCK_BAJO, VENTAS_DIARIAS, PRODUCTO_POPULAR, etc."
    )
    mensaje: str = Field(
        nullable=False,
        description="Mensaje descriptivo del insight para mostrar al usuario"
    )
    nivel_urgencia: str = Field(
        max_length=50,
        nullable=False,
        index=True,
        description="Nivel de urgencia: BAJA, MEDIA, ALTA, CRITICA"
    )
    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True,
        description="Si el insight está activo o fue archivado"
    )
    extra_data: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB),
        description="Datos adicionales específicos del insight (producto_id, monto, etc.)"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now())
    )
    
    # Columna discriminadora Multi-Tenant (CRÍTICA)
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el insight"
    )
    
    # Relaciones
    tienda: Optional[Tienda] = Relationship(back_populates="insights")


class SesionCaja(SQLModel, table=True):
    """
    Modelo de Sesión de Caja - Control de apertura y cierre de caja
    Gestiona el flujo de efectivo por sesión y turno de trabajo
    """
    __tablename__ = "sesiones_caja"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    fecha_apertura: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now()),
        description="Fecha y hora de apertura de la caja"
    )
    fecha_cierre: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True, index=True),
        description="Fecha y hora de cierre de la caja"
    )
    monto_inicial: float = Field(
        nullable=False,
        description="Monto inicial con el que se abre la caja"
    )
    monto_final: Optional[float] = Field(
        default=None,
        nullable=True,
        description="Monto final al cerrar la caja"
    )
    diferencia: Optional[float] = Field(
        default=None,
        nullable=True,
        description="Diferencia entre el monto esperado y el monto real al cierre"
    )
    estado: str = Field(
        default="abierta",
        max_length=50,
        nullable=False,
        index=True,
        description="Estado de la sesión: abierta, cerrada"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Foreign Keys
    usuario_id: UUID = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
        description="ID del usuario responsable de la sesión de caja"
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece la sesión"
    )
    
    # Relaciones
    usuario: Optional["User"] = Relationship(back_populates="sesiones_caja")
    tienda: Optional[Tienda] = Relationship(back_populates="sesiones_caja")
    movimientos: List["MovimientoCaja"] = Relationship(back_populates="sesion", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class MovimientoCaja(SQLModel, table=True):
    """
    Modelo de Movimiento de Caja - Registro de ingresos y egresos
    Documenta todos los movimientos de efectivo durante una sesión
    """
    __tablename__ = "movimientos_caja"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    tipo: str = Field(
        max_length=50,
        nullable=False,
        index=True,
        description="Tipo de movimiento: INGRESO, EGRESO"
    )
    monto: float = Field(
        nullable=False,
        description="Monto del movimiento"
    )
    descripcion: str = Field(
        nullable=False,
        description="Descripción del movimiento de caja"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now())
    )
    
    # Foreign Keys
    sesion_id: UUID = Field(
        foreign_key="sesiones_caja.id",
        nullable=False,
        index=True,
        description="ID de la sesión de caja a la que pertenece el movimiento"
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el movimiento"
    )
    
    # Relaciones
    sesion: Optional[SesionCaja] = Relationship(back_populates="movimientos")
    tienda: Optional[Tienda] = Relationship(back_populates="movimientos_caja")


class Proveedor(SQLModel, table=True):
    """
    Modelo de Proveedor - Gestión de proveedores
    Registro de empresas o personas que proveen mercadería
    """
    __tablename__ = "proveedores"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    razon_social: str = Field(
        max_length=255,
        nullable=False,
        index=True,
        description="Razón social o nombre del proveedor"
    )
    cuit: str = Field(
        max_length=20,
        nullable=False,
        index=True,
        description="CUIT o identificación fiscal del proveedor"
    )
    email: Optional[str] = Field(
        default=None,
        max_length=255,
        nullable=True,
        description="Email de contacto del proveedor"
    )
    telefono: Optional[str] = Field(
        default=None,
        max_length=50,
        nullable=True,
        description="Teléfono de contacto del proveedor"
    )
    direccion: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Dirección física del proveedor"
    )
    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True,
        description="Si el proveedor está activo"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Columna discriminadora Multi-Tenant (CRÍTICA)
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el proveedor"
    )
    
    # Relaciones
    tienda: Optional[Tienda] = Relationship(back_populates="proveedores")
    ordenes_compra: List["OrdenCompra"] = Relationship(back_populates="proveedor")


class OrdenCompra(SQLModel, table=True):
    """
    Modelo de Orden de Compra - Cabecera de la compra
    Gestiona las órdenes de compra a proveedores
    """
    __tablename__ = "ordenes_compra"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    fecha_emision: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now()),
        description="Fecha de emisión de la orden"
    )
    estado: str = Field(
        default="PENDIENTE",
        max_length=50,
        nullable=False,
        index=True,
        description="Estado de la orden: PENDIENTE, RECIBIDA, CANCELADA"
    )
    total: float = Field(
        nullable=False,
        description="Total calculado de la orden de compra"
    )
    observaciones: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Observaciones o notas sobre la orden"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Foreign Keys
    proveedor_id: UUID = Field(
        foreign_key="proveedores.id",
        nullable=False,
        index=True,
        description="ID del proveedor de la orden"
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece la orden"
    )
    
    # Relaciones
    proveedor: Optional[Proveedor] = Relationship(back_populates="ordenes_compra")
    tienda: Optional[Tienda] = Relationship(back_populates="ordenes_compra")
    detalles: List["DetalleOrden"] = Relationship(back_populates="orden", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class DetalleOrden(SQLModel, table=True):
    """
    Modelo de Detalle de Orden de Compra - Items de la compra
    Snapshot de precios de costo al momento de la compra
    """
    __tablename__ = "detalles_orden"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    cantidad: float = Field(
        nullable=False,
        description="Cantidad del producto en la orden"
    )
    precio_costo_unitario: float = Field(
        nullable=False,
        description="Precio de costo unitario al momento de la compra (snapshot)"
    )
    subtotal: float = Field(
        nullable=False,
        description="Subtotal calculado: cantidad * precio_costo_unitario"
    )
    
    # Foreign Keys
    orden_id: UUID = Field(
        foreign_key="ordenes_compra.id",
        nullable=False,
        index=True,
        description="ID de la orden de compra"
    )
    producto_id: UUID = Field(
        foreign_key="productos.id",
        nullable=False,
        index=True,
        description="ID del producto"
    )
    
    # Relaciones
    orden: Optional[OrdenCompra] = Relationship(back_populates="detalles")
    producto: Optional["Producto"] = Relationship(back_populates="detalles_orden")


class Factura(SQLModel, table=True):
    """
    Modelo de Factura Electrónica - Comprobante Fiscal AFIP
    Registro de facturas emitidas con autorización electrónica
    """
    __tablename__ = "facturas"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    tipo_factura: str = Field(
        max_length=1,
        nullable=False,
        index=True,
        description="Tipo de factura: A, B, C"
    )
    punto_venta: int = Field(
        nullable=False,
        index=True,
        description="Punto de venta configurado en AFIP"
    )
    numero_comprobante: int = Field(
        nullable=False,
        index=True,
        description="Número de comprobante secuencial"
    )
    cae: str = Field(
        max_length=50,
        nullable=False,
        index=True,
        description="Código de Autorización Electrónica de AFIP"
    )
    vencimiento_cae: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
        description="Fecha de vencimiento del CAE"
    )
    cliente_doc_tipo: str = Field(
        max_length=20,
        nullable=False,
        description="Tipo de documento del cliente: DNI, CUIT, CUIL"
    )
    cliente_doc_nro: str = Field(
        max_length=20,
        nullable=False,
        index=True,
        description="Número de documento del cliente"
    )
    monto_neto: float = Field(
        nullable=False,
        description="Monto neto gravado (sin IVA)"
    )
    monto_iva: float = Field(
        nullable=False,
        description="Monto del IVA"
    )
    monto_total: float = Field(
        nullable=False,
        description="Monto total de la factura (neto + IVA)"
    )
    url_pdf: Optional[str] = Field(
        default=None,
        nullable=True,
        description="URL del PDF de la factura generado"
    )
    fecha_emision: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now()),
        description="Fecha de emisión de la factura"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    # Foreign Keys
    venta_id: UUID = Field(
        foreign_key="ventas.id",
        nullable=False,
        unique=True,  # Relación 1 a 1
        index=True,
        description="ID de la venta asociada a esta factura"
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda que emite la factura"
    )
    
    # Relaciones
    venta: Optional["Venta"] = Relationship(back_populates="factura")
    tienda: Optional[Tienda] = Relationship(back_populates="facturas")


