"""
Schemas para módulo de Caja
"""
from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field
from uuid import UUID


# --- APERTURA DE CAJA ---

class ShiftOpenRequest(BaseModel):
    """Request para abrir turno de caja"""
    monto_inicial_efectivo: Decimal = Field(ge=0)
    notas: Optional[str] = None


class ShiftOpenResponse(BaseModel):
    """Response de apertura de turno"""
    id: UUID
    fecha_apertura: datetime
    monto_inicial_efectivo: Decimal
    usuario_apertura_nombre: str
    estado: str


# --- CIERRE DE CAJA ---

class CashCountInput(BaseModel):
    """Desglose de efectivo para arqueo"""
    billetes_1000: int = Field(default=0, ge=0)
    billetes_500: int = Field(default=0, ge=0)
    billetes_200: int = Field(default=0, ge=0)
    billetes_100: int = Field(default=0, ge=0)
    billetes_50: int = Field(default=0, ge=0)
    billetes_20: int = Field(default=0, ge=0)
    billetes_10: int = Field(default=0, ge=0)
    
    monedas_10: int = Field(default=0, ge=0)
    monedas_5: int = Field(default=0, ge=0)
    monedas_2: int = Field(default=0, ge=0)
    monedas_1: int = Field(default=0, ge=0)
    monedas_050: int = Field(default=0, ge=0)
    monedas_025: int = Field(default=0, ge=0)
    
    def calculate_total(self) -> Decimal:
        """Calcula el total del arqueo"""
        total = Decimal("0")
        total += Decimal(self.billetes_1000) * Decimal("1000")
        total += Decimal(self.billetes_500) * Decimal("500")
        total += Decimal(self.billetes_200) * Decimal("200")
        total += Decimal(self.billetes_100) * Decimal("100")
        total += Decimal(self.billetes_50) * Decimal("50")
        total += Decimal(self.billetes_20) * Decimal("20")
        total += Decimal(self.billetes_10) * Decimal("10")
        
        total += Decimal(self.monedas_10) * Decimal("10")
        total += Decimal(self.monedas_5) * Decimal("5")
        total += Decimal(self.monedas_2) * Decimal("2")
        total += Decimal(self.monedas_1) * Decimal("1")
        total += Decimal(self.monedas_050) * Decimal("0.50")
        total += Decimal(self.monedas_025) * Decimal("0.25")
        
        return total


class ShiftCloseRequest(BaseModel):
    """Request para cerrar turno de caja"""
    cash_count: CashCountInput
    notas: Optional[str] = None


class ShiftCloseResponse(BaseModel):
    """Response de cierre de turno"""
    id: UUID
    fecha_apertura: datetime
    fecha_cierre: datetime
    
    # Montos
    monto_inicial_efectivo: Decimal
    monto_esperado_efectivo: Decimal
    monto_real_efectivo: Decimal
    diferencia_efectivo: Decimal
    
    # Totales por método
    total_efectivo: Decimal
    total_tarjeta_debito: Decimal
    total_tarjeta_credito: Decimal
    total_transferencia: Decimal
    total_qr: Decimal
    
    # Contadores
    cantidad_ventas: int
    cantidad_devoluciones: int
    total_ventas: Decimal
    total_devoluciones: Decimal
    
    estado: str


# --- MOVIMIENTOS DE EFECTIVO ---

class CashMovementCreate(BaseModel):
    """Crear movimiento de efectivo"""
    tipo: str = Field(pattern="^(ingreso|egreso)$")
    monto: Decimal = Field(gt=0)
    concepto: str = Field(min_length=3, max_length=200)
    notas: Optional[str] = None


class CashMovementResponse(BaseModel):
    """Response de movimiento de efectivo"""
    id: UUID
    shift_id: UUID
    tipo: str
    monto: Decimal
    concepto: str
    notas: Optional[str]
    usuario_nombre: str
    created_at: datetime


# --- CONSULTAS ---

class ShiftSummary(BaseModel):
    """Resumen de turno actual"""
    id: UUID
    fecha_apertura: datetime
    usuario_apertura_nombre: str
    monto_inicial_efectivo: Decimal
    
    # Totales acumulados (ventas del turno)
    total_ventas_actual: Decimal
    cantidad_ventas_actual: int
    total_devoluciones_actual: Decimal
    cantidad_devoluciones_actual: int
    
    # Efectivo esperado
    efectivo_esperado: Decimal
    
    estado: str


class ShiftHistoryItem(BaseModel):
    """Item de historial de turnos"""
    id: UUID
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime]
    usuario_apertura_nombre: str
    usuario_cierre_nombre: Optional[str]
    
    monto_inicial_efectivo: Decimal
    total_ventas: Decimal
    cantidad_ventas: int
    
    diferencia_efectivo: Optional[Decimal]
    estado: str
