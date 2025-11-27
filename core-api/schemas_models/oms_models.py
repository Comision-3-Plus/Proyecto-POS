"""
OMS - Order Management System
Smart Routing para fulfillment inteligente desde múltiples ubicaciones
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB


class OrdenOmnicanal(SQLModel, table=True):
    """
    Orden unificada que puede venir de:
    - Venta en local físico (POS)
    - Compra online (Shopify, WooCommerce)
    - Pedido telefónico
    - WhatsApp
    """
    __tablename__ = "ordenes_omnicanal"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False, index=True)
    
    # Identificadores
    numero_orden: str = Field(unique=True, index=True)  # "ORD-2024-00123"
    external_order_id: Optional[str] = Field(
        default=None,
        nullable=True,
        description="ID de la orden en el e-commerce (Shopify order #1234)"
    )
    
    # Canal de origen
    canal: str = Field(
        nullable=False,
        index=True,
        description="online, pos, telefono, whatsapp"
    )
    plataforma: Optional[str] = Field(
        default=None,
        description="shopify, woocommerce, tiendanube, pos"
    )
    
    # Cliente
    cliente_id: Optional[UUID] = Field(
        default=None,
        foreign_key="clientes.id",
        nullable=True
    )
    
    # Dirección de envío
    shipping_address: Dict[str, Any] = Field(sa_column=Column(JSONB))
    # {
    #   "nombre": "Juan Pérez",
    #   "direccion": "Av. Cabildo 1234",
    #   "ciudad": "CABA",
    #   "provincia": "Buenos Aires",
    #   "codigo_postal": "1426",
    #   "telefono": "11-2345-6789",
    #   "lat": -34.5678,  # Para cálculo de distancia
    #   "lng": -58.1234
    # }
    
    # Totales
    subtotal: float
    descuentos: float = 0.0
    envio: float = 0.0
    total: float
    
    # Estado de fulfillment
    fulfillment_status: str = Field(
        default="pending",
        index=True,
        description="pending, analyzing, assigned, preparing, shipped, delivered, cancelled"
    )
    
    # Ubicación asignada para despacho
    fulfillment_location_id: Optional[UUID] = Field(
        default=None,
        foreign_key="locations.location_id",
        nullable=True,
        description="Desde dónde se va a despachar (decidido por algoritmo)"
    )
    
    # Routing decision metadata
    routing_decision: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Metadata de la decisión del algoritmo de routing"
    )
    # {
    #   "algorithm_version": "v1.0",
    #   "candidates": [
    #     {"location_id": "xxx", "score": 85, "shipping_cost": 1500, "distance_km": 5},
    #     {"location_id": "yyy", "score": 70, "shipping_cost": 2500, "distance_km": 25}
    #   ],
    #   "selected": "xxx",
    #   "reason": "lowest_total_cost"
    # }
    
    # Método de envío
    shipping_method: str = Field(
        default="standard",
        description="standard, express, same_day, pickup"
    )
    
    # Fechas
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    assigned_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    
    # Relaciones
    items: List["OrdenItem"] = Relationship(
        back_populates="orden",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class OrdenItem(SQLModel, table=True):
    """
    Items de una orden omnicanal
    """
    __tablename__ = "orden_items"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    orden_id: UUID = Field(foreign_key="ordenes_omnicanal.id", nullable=False)
    
    variant_id: UUID = Field(foreign_key="product_variants.variant_id", nullable=False)
    
    cantidad: int = Field(nullable=False)
    precio_unitario: float = Field(nullable=False)
    subtotal: float = Field(nullable=False)
    
    # Stock allocation
    allocated_from_location: Optional[UUID] = Field(
        default=None,
        foreign_key="locations.location_id"
    )
    
    # Relaciones
    orden: Optional["OrdenOmnicanal"] = Relationship(back_populates="items")


class ShippingZone(SQLModel, table=True):
    """
    Zonas de envío con costos configurables
    """
    __tablename__ = "shipping_zones"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False)
    
    nombre: str = Field(nullable=False)  # "CABA", "GBA Norte", "Interior"
    
    # Definición geográfica
    provincias: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Lista de provincias incluidas"
    )
    codigos_postales: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Lista de CPs incluidos"
    )
    
    # Costos por método
    costo_standard: float = 0.0
    costo_express: float = 0.0
    costo_same_day: float = 0.0
    
    # Tiempos estimados (en días)
    dias_standard: int = 5
    dias_express: int = 2
    dias_same_day: int = 1
    
    # Umbral de envío gratis
    umbral_envio_gratis: Optional[float] = None
    
    is_active: bool = True


class LocationCapability(SQLModel, table=True):
    """
    Capacidades de cada ubicación para fulfillment
    """
    __tablename__ = "location_capabilities"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: UUID = Field(
        foreign_key="locations.location_id",
        nullable=False,
        unique=True
    )
    
    # Capacidades
    puede_despachar: bool = True
    puede_recibir_pickup: bool = True
    
    # Horarios de despacho
    horario_despacho: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB)
    )
    # {
    #   "lunes": {"inicio": "09:00", "fin": "18:00"},
    #   "martes": {"inicio": "09:00", "fin": "18:00"}
    # }
    
    # Métodos de envío soportados
    soporta_same_day: bool = False
    soporta_express: bool = True
    soporta_standard: bool = True
    
    # Prioridad (1-10, mayor = más prioritario)
    prioridad: int = 5
    
    # Costos operativos
    costo_picking: float = 500.0  # Costo de preparar un pedido
    costo_packing: float = 300.0  # Costo de empaquetar
    
    # Ubicación geográfica
    latitud: Optional[float] = None
    longitud: Optional[float] = None
