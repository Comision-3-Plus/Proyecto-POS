"""
RFID Models - Integración con Lectores RFID
Sistema de checkout masivo y control de inventario rápido
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB


class RFIDTag(SQLModel, table=True):
    """
    Tag RFID asociado a una variante de producto
    
    Formato EPC (Electronic Product Code):
    - 96 bits unique identifier
    - Formato: SGTIN-96 (Serialized Global Trade Item Number)
    """
    __tablename__ = "rfid_tags"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False, index=True)
    
    # EPC (identificador único)
    epc: str = Field(
        unique=True,
        index=True,
        nullable=False,
        max_length=24,
        description="Electronic Product Code (hex string 96-bit)"
    )
    # Ejemplo: "3034257BF7194E4000001A81"
    
    # Variante asociada
    variant_id: UUID = Field(
        foreign_key="product_variants.variant_id",
        nullable=False,
        index=True
    )
    
    # Ubicación actual
    location_id: Optional[UUID] = Field(
        default=None,
        foreign_key="locations.location_id",
        description="Última ubicación detectada"
    )
    
    # Estado
    estado: str = Field(
        default="active",
        nullable=False,
        description="active, sold, stolen, damaged, missing"
    )
    
    # Última lectura
    ultima_lectura: Optional[datetime] = None
    ultimo_lector_id: Optional[str] = None
    
    # Metadata de fabricación
    fecha_encodificacion: datetime = Field(default_factory=datetime.utcnow)
    lote_fabricacion: Optional[str] = None
    tag_metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Metadata adicional del tag"
    )
    
    # Venta (si fue vendido)
    venta_id: Optional[UUID] = Field(
        default=None,
        foreign_key="ventas.id",
        description="Venta donde se vendió este tag"
    )
    fecha_venta: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RFIDScanSession(SQLModel, table=True):
    """
    Sesión de escaneo RFID
    
    Casos de uso:
    1. Checkout rápido: Cliente pone canasto lleno, se escanean todos los items en segundos
    2. Inventario: Se pasa raqueta por todo el local, escanea todo en minutos
    3. Recepción de mercadería: Escaneo masivo al recibir stock
    4. Anti-robo: Detecta items no pagados saliendo de la tienda
    """
    __tablename__ = "rfid_scan_sessions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False)
    
    # Tipo de escaneo
    tipo: str = Field(
        nullable=False,
        description="checkout, inventory, receiving, anti_theft"
    )
    
    # Usuario que ejecutó
    usuario_id: Optional[UUID] = Field(
        default=None,
        foreign_key="users.id"
    )
    
    # Ubicación
    location_id: Optional[UUID] = Field(
        default=None,
        foreign_key="locations.location_id"
    )
    
    # Dispositivo lector
    reader_id: str = Field(
        nullable=False,
        description="ID del lector RFID físico"
    )
    reader_model: Optional[str] = None  # "Zebra FX9600", "Impinj R700"
    
    # Resultados
    tags_escaneados: int = 0
    tags_unicos: int = 0  # Si escanea el mismo tag 10 veces, cuenta como 1
    
    # Tiempos
    inicio: datetime = Field(default_factory=datetime.utcnow)
    fin: Optional[datetime] = None
    duracion_segundos: Optional[float] = None
    
    # Si es checkout, referencia a la venta
    venta_id: Optional[UUID] = Field(
        default=None,
        foreign_key="ventas.id"
    )
    
    # Items detectados
    items: List["RFIDScanItem"] = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class RFIDScanItem(SQLModel, table=True):
    """
    Item individual detectado en una sesión de escaneo
    """
    __tablename__ = "rfid_scan_items"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: UUID = Field(
        foreign_key="rfid_scan_sessions.id",
        nullable=False,
        index=True
    )
    
    # Tag escaneado
    epc: str = Field(nullable=False, index=True)
    
    # Producto identificado
    variant_id: Optional[UUID] = Field(
        default=None,
        foreign_key="product_variants.variant_id"
    )
    
    # Señal
    rssi: Optional[int] = Field(
        default=None,
        description="Received Signal Strength Indicator (dBm)"
    )
    
    # Timestamp de detección
    detectado_en: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    
    # Antena del lector que lo detectó
    antenna_id: Optional[int] = None
    
    # Relaciones
    session: Optional["RFIDScanSession"] = Relationship(back_populates="items")


class RFIDReader(SQLModel, table=True):
    """
    Lector RFID registrado en el sistema
    """
    __tablename__ = "rfid_readers"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False)
    
    # Identificación
    reader_id: str = Field(
        unique=True,
        index=True,
        nullable=False,
        description="MAC address o serial number del lector"
    )
    
    nombre: str = Field(nullable=False)  # "Caja 1 - POS", "Inventario Depósito"
    
    # Tipo de lector
    tipo: str = Field(
        nullable=False,
        description="fixed, handheld, portal"
    )
    # - fixed: Lector fijo (ej: en mostrador de caja)
    # - handheld: Raqueta portátil (para inventario)
    # - portal: Portal anti-robo en la salida
    
    modelo: Optional[str] = None
    fabricante: Optional[str] = None
    
    # Ubicación física
    location_id: Optional[UUID] = Field(
        default=None,
        foreign_key="locations.location_id"
    )
    
    # Configuración
    potencia_transmision: Optional[int] = Field(
        default=30,
        description="Potencia en dBm (típico: 20-30 dBm)"
    )
    
    frecuencia: Optional[str] = Field(
        default="865-868",
        description="Rango de frecuencia MHz (UHF: 865-868 MHz en Argentina)"
    )
    
    # Estado
    is_active: bool = True
    last_heartbeat: Optional[datetime] = None
    
    # IP/Conexión
    ip_address: Optional[str] = None
    puerto: Optional[int] = 5084  # Puerto LLRP estándar
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RFIDInventoryDiscrepancy(SQLModel, table=True):
    """
    Discrepancias detectadas durante inventario RFID
    """
    __tablename__ = "rfid_inventory_discrepancies"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False)
    session_id: UUID = Field(foreign_key="rfid_scan_sessions.id", nullable=False)
    
    variant_id: UUID = Field(foreign_key="product_variants.variant_id", nullable=False)
    location_id: UUID = Field(foreign_key="locations.location_id", nullable=False)
    
    # Cantidades
    cantidad_sistema: int = Field(
        nullable=False,
        description="Lo que dice el sistema (inventory ledger)"
    )
    cantidad_fisica: int = Field(
        nullable=False,
        description="Lo que se encontró con RFID"
    )
    diferencia: int = Field(nullable=False)  # Puede ser + o -
    
    # Estado
    resuelto: bool = False
    notas: Optional[str] = None
    
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
