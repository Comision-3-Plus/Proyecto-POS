"""
Rule Engine - Motor de Promociones Avanzado
Sistema de reglas scriptable para promociones complejas
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from pydantic import BaseModel


class TipoPromo(str, Enum):
    """Tipos de promociones soportadas"""
    DESCUENTO_PORCENTAJE = "descuento_porcentaje"  # 20% OFF
    DESCUENTO_MONTO = "descuento_monto"  # $5000 OFF
    COMBO_2X1 = "combo_2x1"  # 2x1
    COMBO_3X2 = "combo_3x2"  # 3x2
    COMBO_NXM = "combo_nxm"  # Llevá N pagá M
    TIERED_PRICING = "tiered_pricing"  # Llevá 3+ = 10% OFF, 6+ = 20% OFF
    BUNDLE = "bundle"  # Remera + Jean = 15% OFF
    REGALO = "regalo"  # Comprá X llevá Y gratis
    ENVIO_GRATIS = "envio_gratis"  # Free shipping
    CUPON = "cupon"  # Código promocional


class Promocion(SQLModel, table=True):
    """
    Promoción con reglas scriptables
    
    Ejemplos:
    1. "20% en toda la colección Verano 2024"
    2. "2x1 en jeans + remera gratis si comprás con Galicia"
    3. "Llevá 3 prendas = 10% OFF, 6 prendas = 20% OFF"
    4. "Cupon PRUNE2024 = $5000 OFF en compras >$30000"
    """
    __tablename__ = "promociones"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False, index=True)
    
    # Identificación
    nombre: str = Field(nullable=False)  # "Black Friday 2024"
    descripcion: Optional[str] = None
    codigo_promocional: Optional[str] = Field(
        default=None,
        unique=True,
        index=True,
        description="Código para ingr esar (PRUNE2024, VERANO20)"
    )
    
    # Tipo y configuración
    tipo: TipoPromo = Field(nullable=False)
    
    # ===== REGLAS (JSON Logic) =====
    # Usamos JSON Logic para hacer las reglas scriptables
    # https://jsonlogic.com/
    
    reglas: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        description="Condiciones que deben cumplirse (JSON Logic)"
    )
    # Ejemplos:
    # Simple: {">=": [{"var": "total"}, 30000]}  → Total >= $30000
    # AND: {"and": [
    #   {">=": [{"var": "cantidad_items"}, 3]},
    #   {"in": [{"var": "forma_pago"}, ["tarjeta_galicia", "tarjeta_santander"]]}
    # ]}
    # OR con colección: {"or": [
    #   {"==": [{"var": "coleccion_id"}, "uuid-primavera"]},
    #   {"in": [{"var": "categoria"}, ["remeras", "vestidos"]]}
    # ]}
    
    accion: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        description="Acción a ejecutar si se cumple (descuento, regalo, etc)"
    )
    # Ejemplos:
    # Descuento %: {"tipo": "descuento_porcentaje", "valor": 20}
    # Descuento $: {"tipo": "descuento_monto", "valor": 5000}
    # 2x1: {"tipo": "combo_2x1", "productos": ["uuid1", "uuid2"]}
    # Tiered: {
    #   "tipo": "tiered_pricing",
    #   "tiers": [
    #     {"min_cantidad": 3, "descuento_porcentaje": 10},
    #     {"min_cantidad": 6, "descuento_porcentaje": 20},
    #     {"min_cantidad": 10, "descuento_porcentaje": 30}
    #   ]
    # }
    # Regalo: {
    #   "tipo": "regalo",
    #   "producto_regalo_id": "uuid-remera-basica",
    #   "cantidad": 1
    # }
    
    # Restricciones de aplicación
    productos_aplicables: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Lista de product_ids o variant_ids a los que aplica"
    )
    
    colecciones_aplicables: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Lista de coleccion_id"
    )
    
    categorias_aplicables: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Lista de categorías"
    )
    
    # Vigencia
    fecha_inicio: datetime = Field(nullable=False)
    fecha_fin: datetime = Field(nullable=False)
    
    # Días de la semana (1=Lun, 7=Dom)
    dias_semana: Optional[List[int]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Si está vacío, aplica todos los días"
    )
    
    # Horarios (solo para POS físico)
    hora_inicio: Optional[str] = None  # "09:00"
    hora_fin: Optional[str] = None  # "21:00"
    
    # Restricciones de uso
    usos_maximos: Optional[int] = None  # NULL = ilimitados
    usos_maximos_por_cliente: Optional[int] = None
    usos_actuales: int = 0
    
    # Monto mínimo de compra
    monto_minimo_compra: Optional[float] = None
    
    # Cantidad mínima de items
    cantidad_minima_items: Optional[int] = None
    
    # Canales donde aplica
    canales_aplicables: List[str] = Field(
        default_factory=lambda: ["pos", "online"],
        sa_column=Column(JSONB),
        description="['pos', 'online', 'app']"
    )
    
    # Formas de pago específicas
    formas_pago_aplicables: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="['efectivo', 'tarjeta_galicia', 'qr_mercadopago']"
    )
    
    # Configuración de combinación
    es_acumulable: bool = Field(
        default=False,
        description="Puede combinarse con otras promos"
    )
    prioridad: int = Field(
        default=0,
        description="Mayor prioridad = se aplica primero (0-100)"
    )
    
    # Display
    badge_texto: Optional[str] = None  # "20% OFF", "2x1", "HOT SALE"
    badge_color: Optional[str] = None  # "#FF0000"
    
    # Estado
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PromocionUso(SQLModel, table=True):
    """
    Registro de uso de promociones
    Para tracking y límites por cliente
    """
    __tablename__ = "promocion_usos"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    promocion_id: UUID = Field(foreign_key="promociones.id", nullable=False, index=True)
    cliente_id: Optional[UUID] = Field(default=None, foreign_key="clientes.id", index=True)
    venta_id: UUID = Field(foreign_key="ventas.id", nullable=False)
    
    descuento_aplicado: float = Field(nullable=False)
    
    usado_en: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class DescuentoCalculado(BaseModel):
    """
    Resultado del cálculo de descuentos
    """
    promociones_aplicadas: List[dict]
    descuento_total: float
    total_original: float
    total_final: float
    
    # Detalle por item
    items_con_descuento: List[dict]
    # [
    #   {
    #     "variant_id": "xxx",
    #     "precio_original": 12990,
    #     "descuento": 2598,
    #     "precio_final": 10392,
    #     "promociones": ["Black Friday", "Cupon VERANO"]
    #   }
    # ]
    
    # Regalos añadidos
    items_regalo: List[dict] = []

