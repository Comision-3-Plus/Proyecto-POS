"""
Retail Models - Modelos específicos para retail de ropa
Categorías de productos y webhooks para e-commerce
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, func, Text
from sqlalchemy.dialects.postgresql import JSONB

if TYPE_CHECKING:
    from models import Tienda, Product


class ProductCategory(SQLModel, table=True):
    """
    Categorías jerárquicas de productos
    Permite organizar productos en árbol de categorías
    
    Ejemplo:
    - Ropa (parent_id=None)
      - Remeras (parent_id=Ropa.id)
        - Remeras Manga Corta (parent_id=Remeras.id)
        - Remeras Manga Larga (parent_id=Remeras.id)
      - Pantalones (parent_id=Ropa.id)
    """
    __tablename__ = "product_categories"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece la categoría"
    )
    
    name: str = Field(
        max_length=100,
        nullable=False,
        description="Nombre de la categoría: Remeras, Pantalones, Calzado"
    )
    slug: str = Field(
        max_length=100,
        nullable=False,
        index=True,
        description="Slug URL-friendly: remeras, pantalones, calzado"
    )
    
    # Jerarquía
    parent_id: Optional[UUID] = Field(
        default=None,
        foreign_key="product_categories.id",
        nullable=True,
        index=True,
        description="ID de la categoría padre (NULL = raíz)"
    )
    
    sort_order: int = Field(
        default=0,
        nullable=False,
        description="Orden de visualización"
    )
    
    # Información adicional
    description: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Descripción de la categoría"
    )
    image_url: Optional[str] = Field(
        default=None,
        max_length=500,
        nullable=True,
        description="URL de imagen representativa"
    )
    
    is_active: bool = Field(
        default=True,
        nullable=False,
        description="Si la categoría está activa"
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
    tienda: Optional["Tienda"] = Relationship(back_populates="product_categories")
    parent: Optional["ProductCategory"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={
            "remote_side": "ProductCategory.id",
            "foreign_keys": "[ProductCategory.parent_id]"
        }
    )
    children: List["ProductCategory"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    products: List["Product"] = Relationship(back_populates="category")


class Webhook(SQLModel, table=True):
    """
    Webhooks para notificaciones a e-commerce custom
    Sistema de eventos salientes
    """
    __tablename__ = "webhooks"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False
    )
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda"
    )
    
    url: str = Field(
        max_length=500,
        nullable=False,
        description="URL de destino del webhook"
    )
    
    events: List[str] = Field(
        sa_column=Column(JSONB),
        description="Eventos suscritos: ['product.created', 'stock.changed', 'sale.created']"
    )
    
    secret: str = Field(
        max_length=100,
        nullable=False,
        description="Secret para firmar requests (HMAC SHA256)"
    )
    
    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True,
        description="Si el webhook está activo"
    )
    
    # Estadísticas
    last_triggered: Optional[datetime] = Field(
        default=None,
        nullable=True,
        description="Última vez que se disparó"
    )
    trigger_count: int = Field(
        default=0,
        nullable=False,
        description="Cantidad de veces disparado"
    )
    last_error: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Último error si falló"
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
    tienda: Optional["Tienda"] = Relationship(back_populates="webhooks")


class ProductoLegacy(SQLModel, table=True):
    """
    ⚠️ DEPRECATED - Modelo legacy de Producto
    
    Este modelo se mantiene solo para migración histórica.
    USAR: Product + ProductVariant + InventoryLedger
    
    Tabla: productos_legacy (renombrada de productos)
    """
    __tablename__ = "productos_legacy"
    
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
        description="Stock disponible actual (DEPRECATED - usar InventoryLedger)"
    )
    unidad_medida: str = Field(
        max_length=20,
        default="UNIDAD",
        nullable=False,
        description="Unidad de medida: UNIDAD, KILO, LITRO, METRO"
    )
    tipo: str = Field(
        max_length=50,
        nullable=False,
        description="Tipo de producto: general, ropa, pesable"
    )
    atributos: dict = Field(
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
    
    # Columna discriminadora Multi-Tenant
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda a la que pertenece el producto"
    )
    
    # ✅ CAMPOS DE MIGRACIÓN
    is_migrated: bool = Field(
        default=False,
        nullable=False,
        index=True,
        description="Si ya fue migrado a Product/ProductVariant"
    )
    migrated_to_product_id: Optional[UUID] = Field(
        default=None,
        nullable=True,
        description="ID del Product al que fue migrado"
    )
    migration_notes: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Notas sobre la migración"
    )
