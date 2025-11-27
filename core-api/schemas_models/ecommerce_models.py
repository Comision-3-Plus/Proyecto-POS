"""
E-commerce Integration Models
Sistema de conectores multi-plataforma
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime, func, Text
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum


class PlataformaEcommerce(str, Enum):
    """Plataformas soportadas"""
    SHOPIFY = "shopify"
    WOOCOMMERCE = "woocommerce"
    TIENDANUBE = "tiendanube"
    CUSTOM = "custom"


class IntegracionEcommerce(SQLModel, table=True):
    """
    Configuración de integración con plataforma e-commerce
    """
    __tablename__ = "integraciones_ecommerce"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False, index=True)
    
    # Plataforma
    plataforma: PlataformaEcommerce = Field(nullable=False)
    nombre: str = Field(nullable=False)  # "Mi Shopify Principal"
    
    # Credenciales (ENCRIPTADAS)
    # Usar Fernet de cryptography library
    config_encrypted: str = Field(
        sa_column=Column(Text),
        description="Credenciales encriptadas con Fernet"
    )
    # Formato antes de encriptar (JSON):
    # Shopify: {"shop_url": "...", "access_token": "..."}
    # WooCommerce: {"store_url": "...", "consumer_key": "...", "consumer_secret": "..."}
    # Custom: {"base_url": "...", "api_key": "..."}
    
    # Estado de conexión
    is_active: bool = True
    last_test: Optional[datetime] = None
    connection_status: str = Field(
        default="pending",
        description="pending, connected, error"
    )
    last_error: Optional[str] = None
    
    # Sincronización
    auto_sync_products: bool = True
    auto_sync_stock: bool = True
    auto_sync_orders: bool = False
    
    sync_interval_minutes: int = 15
    last_sync: Optional[datetime] = None
    last_sync_status: Optional[str] = None
    
    # Mapeo de ubicaciones
    # location_id de Nexus → location_id de plataforma
    location_mapping: Optional[Dict[str, str]] = Field(
        default=None,
        sa_column=Column(JSONB)
    )
    
    # Webhooks configurados
    webhooks_configured: bool = False
    webhook_ids: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSONB)
    )
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )


class SyncLog(SQLModel, table=True):
    """
    Log de sincronizaciones
    """
    __tablename__ = "sync_logs"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integracion_id: UUID = Field(
        foreign_key="integraciones_ecommerce.id",
        nullable=False,
        index=True
    )
    
    tipo: str = Field(
        nullable=False,
        description="products, stock, orders"
    )
    
    direccion: str = Field(
        nullable=False,
        description="import (ecommerce→pos), export (pos→ecommerce)"
    )
    
    # Resultados
    status: str = Field(
        nullable=False,
        description="success, partial, error"
    )
    
    items_procesados: int = 0
    items_exitosos: int = 0
    items_fallidos: int = 0
    
    # Detalles de errores
    errores: Optional[List[Dict]] = Field(
        default=None,
        sa_column=Column(JSONB)
    )
    
    # Tiempos
    inicio: datetime = Field(default_factory=datetime.utcnow)
    fin: Optional[datetime] = None
    duracion_segundos: Optional[float] = None
    
    # Metadata
    sync_metadata: Optional[Dict] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Metadata adicional de la sincronización"
    )


class ProductMapping(SQLModel, table=True):
    """
    Mapeo de productos entre Nexus y e-commerce
    """
    __tablename__ = "product_mappings"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integracion_id: UUID = Field(
        foreign_key="integraciones_ecommerce.id",
        nullable=False,
        index=True
    )
    
    # IDs internos
    product_id: UUID = Field(
        foreign_key="products.product_id",
        nullable=False,
        index=True
    )
    variant_id: Optional[UUID] = Field(
        default=None,
        foreign_key="product_variants.variant_id",
        index=True
    )
    
    # IDs externos (e-commerce)
    external_product_id: str = Field(nullable=False, index=True)
    external_variant_id: Optional[str] = Field(default=None, index=True)
    
    # Metadata
    last_synced: Optional[datetime] = None
    sync_errors: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class APIKey(SQLModel, table=True):
    """
    API Keys para integración custom
    """
    __tablename__ = "api_keys"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False, index=True)
    
    # Key (hasheada)
    key_hash: str = Field(unique=True, nullable=False, index=True)
    key_prefix: str = Field(
        nullable=False,
        description="Primeros 8 caracteres para identificar"
    )
    
    nombre: str = Field(nullable=False)
    
    # Permisos (scopes)
    scopes: List[str] = Field(
        sa_column=Column(JSONB),
        description="['products:read', 'products:write', 'stock:write']"
    )
    
    # Estado
    is_active: bool = True
    last_used: Optional[datetime] = None
    uso_count: int = 0
    
    # Expiración
    expires_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
