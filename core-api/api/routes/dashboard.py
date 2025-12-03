"""
Dashboard Endpoints - Nexus POS
Endpoints consolidados para vista de dashboard con métricas clave
"""
from datetime import datetime, timedelta
from typing import Annotated, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from pydantic import BaseModel

from core.db import get_session
import logging
from core.cache import cached
from models import Product, ProductVariant, InventoryLedger, Venta, DetalleVenta, Location
from api.deps import CurrentTienda

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# === SCHEMAS ===

class MetricaVentas(BaseModel):
    """Métrica de ventas"""
    hoy: float
    ayer: float
    semana: float
    mes: float
    tickets_emitidos: int  # Cantidad de ventas (tickets) hoy
    cambio_diario_porcentaje: float
    cambio_semanal_porcentaje: float
    ultimos_7_dias: list[dict[str, Any]]  # [{"fecha": "2025-11-20", "total": 12500}, ...]


class MetricaInventario(BaseModel):
    """Métrica de inventario"""
    total_productos: int
    productos_activos: int
    productos_bajo_stock: int
    valor_total_inventario: float


class ProductoDestacado(BaseModel):
    """Producto destacado del dashboard"""
    id: str
    nombre: str
    sku: str
    stock: float
    ventas_hoy: int


class DashboardResumen(BaseModel):
    """Resumen completo del dashboard"""
    ventas: MetricaVentas
    inventario: MetricaInventario
    productos_destacados: list[ProductoDestacado]
    alertas_criticas: int
    ultima_actualizacion: datetime


# === ENDPOINTS ===

@router.get("/resumen", response_model=DashboardResumen)
@cached(ttl_seconds=30, key_prefix="dashboard")  # Cache habilitado - 30 segundos
async def obtener_dashboard_resumen(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> DashboardResumen:
    """
    Endpoint principal del dashboard con todas las métricas consolidadas
    
    Incluye:
    - Ventas (hoy, ayer, semana, mes con % de cambio)
    - Inventario (totales, bajo stock, valor)
    - Productos destacados
    - Alertas críticas
    
    **Cacheado por 30 segundos para mejor performance**
    """
    logger.info(f"Generando dashboard para tienda {current_tienda.id}")
    
    # Rangos de fechas
    ahora = datetime.utcnow()
    hoy_inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    ayer_inicio = hoy_inicio - timedelta(days=1)
    semana_inicio = hoy_inicio - timedelta(days=7)
    mes_inicio = hoy_inicio - timedelta(days=30)
    
    # === VENTAS ===
    # Ventas de hoy (total dinero)
    stmt_hoy = select(func.coalesce(func.sum(Venta.total), 0)).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= hoy_inicio,
            Venta.status_pago == 'pagado'
        )
    )
    ventas_hoy = (await session.execute(stmt_hoy)).scalar()
    
    # Tickets emitidos hoy (cantidad de ventas)
    stmt_tickets = select(func.count(Venta.id)).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= hoy_inicio,
            Venta.status_pago == 'pagado'
        )
    )
    tickets_emitidos = (await session.execute(stmt_tickets)).scalar()
    
    # Ventas de ayer
    stmt_ayer = select(func.coalesce(func.sum(Venta.total), 0)).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= ayer_inicio,
            Venta.fecha < hoy_inicio,
            Venta.status_pago == 'pagado'
        )
    )
    ventas_ayer = (await session.execute(stmt_ayer)).scalar()
    
    # Ventas de la semana
    stmt_semana = select(func.coalesce(func.sum(Venta.total), 0)).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= semana_inicio,
            Venta.status_pago == 'pagado'
        )
    )
    ventas_semana = (await session.execute(stmt_semana)).scalar()
    
    # Ventas del mes
    stmt_mes = select(func.coalesce(func.sum(Venta.total), 0)).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= mes_inicio,
            Venta.status_pago == 'pagado'
        )
    )
    ventas_mes = (await session.execute(stmt_mes)).scalar()
    
    # Ventas de los últimos 7 días con breakdown diario
    stmt_7dias = select(
        func.date_trunc('day', Venta.fecha).label('fecha'),
        func.coalesce(func.sum(Venta.total), 0).label('total')
    ).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= semana_inicio,
            Venta.status_pago == 'pagado'
        )
    ).group_by('fecha').order_by('fecha')
    
    result_7dias = await session.execute(stmt_7dias)
    ventas_7dias = [
        {
            "fecha": row[0].strftime('%Y-%m-%d') if row[0] else '',
            "total": float(row[1] or 0)
        }
        for row in result_7dias.all()
    ]
    
    # Calcular cambios porcentuales
    cambio_diario = ((ventas_hoy - ventas_ayer) / ventas_ayer * 100) if ventas_ayer > 0 else 0
    semana_pasada = ventas_semana - ventas_hoy  # Aproximación
    cambio_semanal = ((ventas_hoy - (semana_pasada / 7)) / (semana_pasada / 7) * 100) if semana_pasada > 0 else 0
    
    # === INVENTARIO ===
    # Contar productos totales (productos padre)
    stmt_total = select(func.count(Product.product_id)).where(Product.tienda_id == current_tienda.id)
    total_productos = (await session.execute(stmt_total)).scalar() or 0
    
    # Contar productos activos
    stmt_activos = select(func.count(Product.product_id)).where(
        and_(Product.tienda_id == current_tienda.id, Product.is_active == True)
    )
    productos_activos = (await session.execute(stmt_activos)).scalar() or 0
    
    # Contar variantes bajo stock (con stock < 10)
    # Primero obtenemos el stock actual por variante desde InventoryLedger
    stmt_bajo_stock = select(
        InventoryLedger.variant_id,
        func.sum(InventoryLedger.delta).label('stock_actual')
    ).join(
        ProductVariant, InventoryLedger.variant_id == ProductVariant.variant_id
    ).where(
        ProductVariant.tienda_id == current_tienda.id
    ).group_by(
        InventoryLedger.variant_id
    ).having(
        func.sum(InventoryLedger.delta) <= 10
    )
    result_bajo_stock = await session.execute(stmt_bajo_stock)
    productos_bajo_stock = len(result_bajo_stock.all())
    
    # Valor total del inventario (suma de stock * precio de todas las variantes)
    stmt_valor = select(
        ProductVariant.variant_id,
        ProductVariant.price,
        func.sum(InventoryLedger.delta).label('stock_actual')
    ).join(
        InventoryLedger, ProductVariant.variant_id == InventoryLedger.variant_id
    ).where(
        ProductVariant.tienda_id == current_tienda.id
    ).group_by(
        ProductVariant.variant_id, ProductVariant.price
    )
    result_valor = await session.execute(stmt_valor)
    valor_inventario = sum(
        (row.stock_actual or 0) * (row.price or 0) 
        for row in result_valor.all()
    )

    
    # === PRODUCTOS DESTACADOS (más vendidos hoy) ===
    # Por ahora retornamos una lista vacía - necesitaría actualizar DetalleVenta para usar variant_id
    destacados = []
    
    # === ALERTAS CRÍTICAS ===
    # Variantes con stock crítico (< 5)
    stmt_alertas = select(
        InventoryLedger.variant_id,
        func.sum(InventoryLedger.delta).label('stock_actual')
    ).join(
        ProductVariant, InventoryLedger.variant_id == ProductVariant.variant_id
    ).where(
        ProductVariant.tienda_id == current_tienda.id
    ).group_by(
        InventoryLedger.variant_id
    ).having(
        and_(
            func.sum(InventoryLedger.delta) < 5,
            func.sum(InventoryLedger.delta) >= 0
        )
    )
    result_alertas = await session.execute(stmt_alertas)
    alertas = len(result_alertas.all())

    
    return DashboardResumen(
        ventas=MetricaVentas(
            hoy=float(ventas_hoy),
            ayer=float(ventas_ayer),
            semana=float(ventas_semana),
            mes=float(ventas_mes),
            tickets_emitidos=tickets_emitidos or 0,
            cambio_diario_porcentaje=round(cambio_diario, 2),
            cambio_semanal_porcentaje=round(cambio_semanal, 2),
            ultimos_7_dias=ventas_7dias
        ),
        inventario=MetricaInventario(
            total_productos=total_productos or 0,
            productos_activos=productos_activos or 0,
            productos_bajo_stock=productos_bajo_stock or 0,
            valor_total_inventario=float(valor_inventario or 0)
        ),
        productos_destacados=destacados,
        alertas_criticas=alertas,
        ultima_actualizacion=datetime.utcnow()
    )


@router.get("/ventas-tiempo-real")
async def obtener_ventas_tiempo_real(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> dict:
    """
    Ventas de las últimas 24 horas agrupadas por hora (para gráfico en tiempo real)
    
    **Sin caché para datos en tiempo real**
    """
    hace_24h = datetime.utcnow() - timedelta(hours=24)
    
    stmt = select(
        func.date_trunc('hour', Venta.fecha).label('hora'),
        func.count(Venta.id).label('cantidad'),
        func.sum(Venta.total).label('total')
    ).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= hace_24h,
            Venta.status_pago == 'pagado'
        )
    ).group_by('hora').order_by('hora')
    
    result = await session.execute(stmt)
    
    return {
        "periodo": "ultimas_24h",
        "datos": [
            {
                "hora": row[0].isoformat() if row[0] else None,
                "cantidad_ventas": row[1],
                "total": float(row[2] or 0)
            }
            for row in result.all()
        ]
    }
