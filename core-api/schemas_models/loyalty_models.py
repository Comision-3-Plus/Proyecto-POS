"""
Loyalty Models - Sistema de Fidelización Omnicanal
Puntos, Wallet y Gift Cards unificados
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum


class TipoTransaccionWallet(str, Enum):
    """Tipos de transacciones en la wallet"""
    ACUMULACION_COMPRA = "acumulacion_compra"  # Sumó puntos comprando
    CANJE_PUNTOS = "canje_puntos"  # Usó puntos para pagar
    REGALO = "regalo"  # Regalo de la marca
    EXPIRACION = "expiracion"  # Puntos expirados
    AJUSTE_MANUAL = "ajuste_manual"  # Corrección manual
    DEVOLUCION = "devolucion"  # Devolución de compra
    

class CustomerWallet(SQLModel, table=True):
    """
    Billetera omnicanal del cliente
    
    Points across channels:
    - Gana puntos en POS físico → los usa online
    - Gana puntos en Shopify → los usa en local
    - Gift cards compradas online → las gasta en local
    """
    __tablename__ = "customer_wallets"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False, index=True)
    cliente_id: UUID = Field(
        foreign_key="clientes.id",
        nullable=False,
        unique=True,
        index=True
    )
    
    # Puntos
    puntos_disponibles: int = Field(default=0, nullable=False)
    puntos_lifetime: int = Field(
        default=0,
        description="Total de puntos ganados históricamente"
    )
    
    # Valor en pesos de los puntos
    valor_punto: float = Field(
        default=1.0,
        description="$1 = 1 punto (configurable por tienda)"
    )
    
    # Nivel del programa de fidelidad
    tier: str = Field(
        default="bronze",
        description="bronze, silver, gold, platinum"
    )
    tier_desde: Optional[datetime] = None
    
    # Gift cards balance
    gift_cards_balance: float = Field(
        default=0.0,
        description="Saldo total de gift cards activas"
    )
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )


class WalletTransaction(SQLModel, table=True):
    """
    Transacciones de la wallet
    Append-only log para auditoría
    """
    __tablename__ = "wallet_transactions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    wallet_id: UUID = Field(foreign_key="customer_wallets.id", nullable=False, index=True)
    
    tipo: TipoTransaccionWallet = Field(nullable=False)
    
    # Cambio en puntos
    puntos_delta: int = Field(
        nullable=False,
        description="+ ganados, - gastados"
    )
    
    # Referencia a la venta que generó/usó puntos
    venta_id: Optional[UUID] = Field(default=None, foreign_key="ventas.id")
    
    # Canal donde ocurrió
    canal: str = Field(
        nullable=False,
        description="pos, online, app"
    )
    
    # Descripción
    descripcion: str = Field(nullable=False)
    # "Ganaste 1299 puntos por compra de $12990"
    # "Canjeaste 5000 puntos = $5000 de descuento"
    
    # Metadata adicional
    transaction_metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Metadata adicional de la transacción"
    )
    
    # Fecha
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True)
    )


class GiftCard(SQLModel, table=True):
    """
    Gift Card digital/física
    
    Flow:
    1. Cliente compra GC de $10000 online (Shopify)
    2. Recibe código QR por email
    3. Va al local físico
    4. Cajero escanea QR → $10000 de descuento
    """
    __tablename__ = "gift_cards"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False)
    
    # Código único
    codigo: str = Field(
        unique=True,
        index=True,
        nullable=False,
        description="GC-XXXX-YYYY-ZZZZ o QR code data"
    )
    
    # Propietario
    cliente_id: Optional[UUID] = Field(
        default=None,
        foreign_key="clientes.id",
        description="Quién la compró/recibió"
    )
    
    # Valores
    monto_original: float = Field(nullable=False)
    monto_actual: float = Field(nullable=False)
    
    # Estado
    estado: str = Field(
        default="active",
        nullable=False,
        description="active, redeemed, expired, cancelled"
    )
    
    # Vigencia
    fecha_emision: datetime = Field(default_factory=datetime.utcnow)
    fecha_expiracion: Optional[datetime] = Field(
        default=None,
        description="NULL = no expira"
    )
    
    # Comprada en
    canal_compra: str = Field(
        nullable=False,
        description="online, pos, app"
    )
    venta_origen_id: Optional[UUID] = Field(
        default=None,
        foreign_key="ventas.id",
        description="Venta donde se compró la GC"
    )
    
    # Metadata
    es_regalo: bool = Field(
        default=False,
        description="Si fue comprada como regalo"
    )
    mensaje_regalo: Optional[str] = None
    destinatario_email: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GiftCardUso(SQLModel, table=True):
    """
    Uso de gift card
    Log de cada vez que se usa
    """
    __tablename__ = "gift_card_usos"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    gift_card_id: UUID = Field(foreign_key="gift_cards.id", nullable=False, index=True)
    
    venta_id: UUID = Field(foreign_key="ventas.id", nullable=False)
    
    monto_usado: float = Field(nullable=False)
    monto_restante: float = Field(nullable=False, description="Después de este uso")
    
    canal: str = Field(nullable=False)
    
    usado_en: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class LoyaltyProgram(SQLModel, table=True):
    """
    Configuración del programa de fidelidad por tienda
    """
    __tablename__ = "loyalty_programs"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        unique=True
    )
    
    # Configuración de acumulación
    es_activo: bool = True
    tasa_acumulacion: float = Field(
        default=0.10,
        description="10% del monto de compra en puntos (ej: $1000 → 100 puntos)"
    )
    
    # Valor de punto
    valor_punto_pesos: float = Field(
        default=1.0,
        description="1 punto = $1"
    )
    
    # Puntos mínimos para canjear
    puntos_minimos_canje: int = Field(default=1000)
    
    # Expiración de puntos
    puntos_expiran: bool = False
    dias_expiracion_puntos: Optional[int] = Field(
        default=365,
        description="Días hasta que expiran los puntos"
    )
    
    # Tiers del programa
    tiers: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB)
    )
    # {
    #   "bronze": {"min_puntos": 0, "multiplicador": 1.0, "beneficios": []},
    #   "silver": {"min_puntos": 10000, "multiplicador": 1.2, "beneficios": ["envio_gratis"]},
    #   "gold": {"min_puntos": 50000, "multiplicador": 1.5, "beneficios": ["preventa", "descuento_10"]},
    #   "platinum": {"min_puntos": 100000, "multiplicador": 2.0, "beneficios": ["styling_personal"]}
    # }
    
    # Bonos especiales
    puntos_bienvenida: int = Field(
        default=500,
        description="Puntos al registrarse"
    )
    puntos_cumpleaños: int = Field(
        default=1000,
        description="Puntos en cumpleaños"
    )
    
    # Referral program
    puntos_referido: int = Field(
        default=2000,
        description="Puntos por traer un amigo"
    )
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)
