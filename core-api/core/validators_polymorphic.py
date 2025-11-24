"""
Validadores Polimórficos para Productos - Nexus POS
Sistema de validación dinámica según tipo de producto
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
from core.exceptions import NexusPOSException


class RopaAtributos(BaseModel):
    """Validador para productos de tipo 'ropa'"""
    talle: str = Field(..., description="Talle del producto (XS, S, M, L, XL, XXL)")
    color: str = Field(..., description="Color del producto")
    temporada: Optional[str] = Field(None, description="Temporada (Verano, Invierno, Primavera, Otoño)")
    material: Optional[str] = Field(None, description="Material principal (Algodón, Poliéster, etc.)")
    
    @field_validator('talle')
    @classmethod
    def validar_talle(cls, v: str) -> str:
        talles_validos = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 
                         '36', '38', '40', '42', '44', '46', '48', '50']
        if v.upper() not in talles_validos:
            raise ValueError(f"Talle '{v}' no válido. Opciones: {', '.join(talles_validos)}")
        return v.upper()


class CarneAtributos(BaseModel):
    """Validador para productos de tipo 'pesable' (carnes, fiambres)"""
    origen: Optional[str] = Field(None, description="Origen del producto (Argentina, Brasil, etc.)")
    corte: Optional[str] = Field(None, description="Tipo de corte (Vacío, Asado, Bife, etc.)")
    fecha_envasado: Optional[str] = Field(None, description="Fecha de envasado (YYYY-MM-DD)")
    fecha_vencimiento: Optional[str] = Field(None, description="Fecha de vencimiento (YYYY-MM-DD)")
    
    @field_validator('fecha_envasado', 'fecha_vencimiento')
    @classmethod
    def validar_formato_fecha(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # Validar formato YYYY-MM-DD
        import datetime
        try:
            datetime.datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError("Formato de fecha debe ser YYYY-MM-DD")


class ServicioAtributos(BaseModel):
    """Validador para productos de tipo 'servicio'"""
    duracion_minutos: Optional[int] = Field(None, ge=1, description="Duración del servicio en minutos")
    requiere_turno: bool = Field(default=False, description="Si requiere turno previo")
    profesional_asignado: Optional[str] = Field(None, description="Nombre del profesional")


class AlimentoAtributos(BaseModel):
    """Validador para productos de tipo 'alimento'"""
    marca: Optional[str] = Field(None, description="Marca del producto")
    sabor: Optional[str] = Field(None, description="Sabor/Variedad")
    fecha_vencimiento: Optional[str] = Field(None, description="Fecha de vencimiento (YYYY-MM-DD)")
    lote: Optional[str] = Field(None, description="Número de lote")
    
    @field_validator('fecha_vencimiento')
    @classmethod
    def validar_formato_fecha(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import datetime
        try:
            datetime.datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError("Formato de fecha debe ser YYYY-MM-DD")


class BebidaAtributos(BaseModel):
    """Validador para productos de tipo 'bebida'"""
    marca: str = Field(..., description="Marca de la bebida")
    graduacion_alcoholica: Optional[float] = Field(None, ge=0, le=100, description="% de alcohol")
    tamaño: Optional[str] = Field(None, description="Tamaño del envase (355ml, 1L, etc.)")
    refrigerado: bool = Field(default=False, description="Si requiere refrigeración")


# Mapa de validadores por tipo
VALIDATORS_MAP: Dict[str, BaseModel] = {
    'ropa': RopaAtributos,
    'pesable': CarneAtributos,
    'servicio': ServicioAtributos,
    'alimento': AlimentoAtributos,
    'bebida': BebidaAtributos,
}


def validar_atributos_producto(tipo: str, atributos: Dict[str, Any]) -> Dict[str, Any]:
    """
    Valida los atributos de un producto según su tipo.
    
    Args:
        tipo: Tipo de producto (ropa, pesable, servicio, etc.)
        atributos: Diccionario con los atributos a validar
    
    Returns:
        Dict con los atributos validados y sanitizados
    
    Raises:
        NexusPOSException: Si los atributos no cumplen con el schema del tipo
    """
    # Si es tipo 'general', no validar atributos específicos
    if tipo == 'general':
        return atributos
    
    # Obtener el validador correspondiente
    validator = VALIDATORS_MAP.get(tipo)
    
    if validator is None:
        raise NexusPOSException(
            status_code=400,
            detail=f"Tipo de producto '{tipo}' no soportado. Tipos válidos: {', '.join(VALIDATORS_MAP.keys())}, general"
        )
    
    # Validar los atributos usando Pydantic
    try:
        modelo_validado = validator(**atributos)
        return modelo_validado.model_dump(exclude_none=True)
    except Exception as e:
        raise NexusPOSException(
            status_code=422,
            detail=f"Error de validación para producto tipo '{tipo}': {str(e)}"
        )


def validar_stock_segun_tipo(tipo: str, stock_actual: float) -> None:
    """
    Valida que el stock sea coherente con el tipo de producto.
    
    Args:
        tipo: Tipo de producto
        stock_actual: Stock actual del producto
    
    Raises:
        NexusPOSException: Si el stock no es válido para el tipo
    """
    if tipo == 'servicio' and stock_actual != 0:
        raise NexusPOSException(
            status_code=422,
            detail="Los productos de tipo 'servicio' no deben tener stock físico (debe ser 0)"
        )
    
    if tipo == 'pesable' and stock_actual < 0:
        raise NexusPOSException(
            status_code=422,
            detail="El stock de productos pesables no puede ser negativo"
        )
    
    if tipo in ['ropa', 'alimento', 'bebida', 'general'] and stock_actual < 0:
        raise NexusPOSException(
            status_code=422,
            detail=f"El stock de productos tipo '{tipo}' no puede ser negativo"
        )
