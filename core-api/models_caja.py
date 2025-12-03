"""
Modelos para Caja (Apertura/Cierre de Turnos)
"""
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4


class CashRegisterShift(SQLModel, table=True):
    """Turno de Caja - Apertura/Cierre"""
    __tablename__ = "cash_register_shifts"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Referencias
    tienda_id: UUID = Field(foreign_key="tiendas.id", index=True)
    usuario_apertura_id: UUID = Field(foreign_key="usuarios.id")
    usuario_cierre_id: Optional[UUID] = Field(default=None, foreign_key="usuarios.id")
    
    # Timestamps
    fecha_apertura: datetime = Field(default_factory=datetime.utcnow)
    fecha_cierre: Optional[datetime] = Field(default=None)
    
    # Montos de apertura
    monto_inicial_efectivo: Decimal = Field(default=Decimal("0"), max_digits=15, decimal_places=2)
    monto_inicial_notas: Optional[str] = Field(default=None)
    
    # Montos de cierre (calculados al cerrar)
    monto_esperado_efectivo: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    monto_real_efectivo: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    diferencia_efectivo: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    
    # Totales por método de pago (al cierre)
    total_efectivo: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    total_tarjeta_debito: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    total_tarjeta_credito: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    total_transferencia: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    total_qr: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    
    # Contadores
    cantidad_ventas: int = Field(default=0)
    cantidad_devoluciones: int = Field(default=0)
    
    # Montos totales
    total_ventas: Decimal = Field(default=Decimal("0"), max_digits=15, decimal_places=2)
    total_devoluciones: Decimal = Field(default=Decimal("0"), max_digits=15, decimal_places=2)
    
    # Estado
    estado: str = Field(default="abierto")  # abierto, cerrado
    notas_cierre: Optional[str] = Field(default=None)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CashMovement(SQLModel, table=True):
    """Movimientos de efectivo (ingresos/egresos) durante el turno"""
    __tablename__ = "cash_movements"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Referencias
    shift_id: UUID = Field(foreign_key="cash_register_shifts.id", index=True)
    usuario_id: UUID = Field(foreign_key="usuarios.id")
    
    # Datos del movimiento
    tipo: str = Field()  # ingreso, egreso
    monto: Decimal = Field(max_digits=15, decimal_places=2)
    concepto: str = Field()
    notas: Optional[str] = Field(default=None)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ShiftCashCount(SQLModel, table=True):
    """Arqueo de efectivo (desglose por denominación)"""
    __tablename__ = "shift_cash_counts"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Referencia
    shift_id: UUID = Field(foreign_key="cash_register_shifts.id", index=True)
    
    # Desglose de billetes
    billetes_1000: int = Field(default=0)
    billetes_500: int = Field(default=0)
    billetes_200: int = Field(default=0)
    billetes_100: int = Field(default=0)
    billetes_50: int = Field(default=0)
    billetes_20: int = Field(default=0)
    billetes_10: int = Field(default=0)
    
    # Desglose de monedas
    monedas_10: int = Field(default=0)
    monedas_5: int = Field(default=0)
    monedas_2: int = Field(default=0)
    monedas_1: int = Field(default=0)
    monedas_050: int = Field(default=0)
    monedas_025: int = Field(default=0)
    
    # Total calculado
    total: Decimal = Field(max_digits=15, decimal_places=2)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
