"""
Reportes y Analytics - Nexus POS
Endpoints para generación de reportes de negocio
"""
import logging
from typing import Annotated, List, Optional
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from core.db import get_session
from models import Venta, DetalleVenta, Producto
from api.deps import CurrentTienda
from pydantic import BaseModel, Field


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reportes", tags=["Reportes"])


# === SCHEMAS ===

class ProductoMasVendido(BaseModel):
    """Schema para productos más vendidos"""
    producto_id: UUID
    sku: str
    nombre: str
    cantidad_vendida: float
    total_recaudado: float
    veces_vendido: int
    
class VentasPorPeriodo(BaseModel):
    """Schema para ventas por período"""
    fecha: str
    cantidad_ventas: int
    total_vendido: float
    ticket_promedio: float
    
class ResumenVentas(BaseModel):
    """Schema para resumen de ventas"""
    periodo_inicio: datetime
    periodo_fin: datetime
    total_ventas: int
    monto_total: float
    ticket_promedio: float
    metodo_pago_mas_usado: Optional[str] = None
    producto_mas_vendido: Optional[str] = None
    
class RentabilidadProducto(BaseModel):
    """Schema para análisis de rentabilidad"""
    producto_id: UUID
    nombre: str
    sku: str
    cantidad_vendida: float
    costo_total: float
    ingreso_total: float
    utilidad_bruta: float
    margen_porcentaje: float


# === ENDPOINTS ===

@router.get("/ventas/resumen", response_model=ResumenVentas)
async def obtener_resumen_ventas(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    fecha_desde: Optional[datetime] = Query(None, description="Fecha inicial (default: hace 30 días)"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha final (default: hoy)")
) -> ResumenVentas:
    """
    Obtiene un resumen general de ventas para un período
    
    Incluye:
    - Total de ventas realizadas
    - Monto total vendido
    - Ticket promedio
    - Método de pago más usado
    - Producto más vendido
    """
    # Defaults de fechas
    if fecha_hasta is None:
        fecha_hasta = datetime.utcnow()
    if fecha_desde is None:
        fecha_desde = fecha_hasta - timedelta(days=30)
    
    logger.info(f"Generando resumen de ventas para tienda {current_tienda.id} desde {fecha_desde} hasta {fecha_hasta}")
    
    # Query principal de ventas
    stmt = select(
        func.count(Venta.id).label('total_ventas'),
        func.sum(Venta.total).label('monto_total'),
        func.avg(Venta.total).label('ticket_promedio')
    ).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= fecha_desde,
            Venta.fecha <= fecha_hasta,
            Venta.status_pago == 'pagado'
        )
    )
    
    result = await session.execute(stmt)
    row = result.one()
    
    # Método de pago más usado
    stmt_metodo = select(
        Venta.metodo_pago,
        func.count(Venta.id).label('count')
    ).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= fecha_desde,
            Venta.fecha <= fecha_hasta,
            Venta.status_pago == 'pagado'
        )
    ).group_by(Venta.metodo_pago).order_by(desc('count')).limit(1)
    
    result_metodo = await session.execute(stmt_metodo)
    metodo_row = result_metodo.first()
    metodo_mas_usado = metodo_row[0] if metodo_row else None
    
    # Producto más vendido
    stmt_producto = select(
        Producto.nombre,
        func.sum(DetalleVenta.cantidad).label('total')
    ).join(
        DetalleVenta, Producto.id == DetalleVenta.producto_id
    ).join(
        Venta, DetalleVenta.venta_id == Venta.id
    ).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= fecha_desde,
            Venta.fecha <= fecha_hasta,
            Venta.status_pago == 'pagado'
        )
    ).group_by(Producto.nombre).order_by(desc('total')).limit(1)
    
    result_producto = await session.execute(stmt_producto)
    producto_row = result_producto.first()
    producto_mas_vendido = producto_row[0] if producto_row else None
    
    return ResumenVentas(
        periodo_inicio=fecha_desde,
        periodo_fin=fecha_hasta,
        total_ventas=row.total_ventas or 0,
        monto_total=float(row.monto_total or 0),
        ticket_promedio=float(row.ticket_promedio or 0),
        metodo_pago_mas_usado=metodo_mas_usado,
        producto_mas_vendido=producto_mas_vendido
    )


@router.get("/productos/mas-vendidos", response_model=List[ProductoMasVendido])
async def obtener_productos_mas_vendidos(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    limite: int = Query(10, ge=1, le=100, description="Cantidad de productos a retornar"),
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None)
) -> List[ProductoMasVendido]:
    """
    Retorna los productos más vendidos ordenados por cantidad
    
    Útil para:
    - Identificar productos estrella
    - Optimizar inventario
    - Planificar promociones
    """
    # Defaults de fechas
    if fecha_hasta is None:
        fecha_hasta = datetime.utcnow()
    if fecha_desde is None:
        fecha_desde = fecha_hasta - timedelta(days=30)
    
    stmt = select(
        Producto.id.label('producto_id'),
        Producto.sku,
        Producto.nombre,
        func.sum(DetalleVenta.cantidad).label('cantidad_vendida'),
        func.sum(DetalleVenta.subtotal).label('total_recaudado'),
        func.count(DetalleVenta.id).label('veces_vendido')
    ).join(
        DetalleVenta, Producto.id == DetalleVenta.producto_id
    ).join(
        Venta, DetalleVenta.venta_id == Venta.id
    ).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= fecha_desde,
            Venta.fecha <= fecha_hasta,
            Venta.status_pago == 'pagado'
        )
    ).group_by(
        Producto.id, Producto.sku, Producto.nombre
    ).order_by(
        desc('cantidad_vendida')
    ).limit(limite)
    
    result = await session.execute(stmt)
    rows = result.all()
    
    return [
        ProductoMasVendido(
            producto_id=row.producto_id,
            sku=row.sku,
            nombre=row.nombre,
            cantidad_vendida=float(row.cantidad_vendida),
            total_recaudado=float(row.total_recaudado),
            veces_vendido=row.veces_vendido
        )
        for row in rows
    ]


@router.get("/productos/rentabilidad", response_model=List[RentabilidadProducto])
async def analizar_rentabilidad_productos(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    limite: int = Query(20, ge=1, le=100),
    orden: str = Query("utilidad", regex="^(utilidad|margen|cantidad)$")
) -> List[RentabilidadProducto]:
    """
    Analiza la rentabilidad de productos vendidos
    
    Calcula:
    - Costo total (precio_costo × cantidad)
    - Ingreso total (precio_venta × cantidad)
    - Utilidad bruta (ingreso - costo)
    - Margen de ganancia (%)
    
    Permite ordenar por:
    - utilidad: Mayor ganancia absoluta
    - margen: Mayor porcentaje de ganancia
    - cantidad: Más vendidos
    """
    stmt = select(
        Producto.id.label('producto_id'),
        Producto.nombre,
        Producto.sku,
        Producto.precio_costo,
        Producto.precio_venta,
        func.sum(DetalleVenta.cantidad).label('cantidad_vendida'),
        func.sum(DetalleVenta.subtotal).label('ingreso_total')
    ).join(
        DetalleVenta, Producto.id == DetalleVenta.producto_id
    ).join(
        Venta, DetalleVenta.venta_id == Venta.id
    ).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.status_pago == 'pagado'
        )
    ).group_by(
        Producto.id, Producto.nombre, Producto.sku,
        Producto.precio_costo, Producto.precio_venta
    )
    
    result = await session.execute(stmt)
    rows = result.all()
    
    # Calcular rentabilidad
    productos_rentabilidad = []
    for row in rows:
        cantidad_vendida = float(row.cantidad_vendida)
        costo_total = row.precio_costo * cantidad_vendida
        ingreso_total = float(row.ingreso_total)
        utilidad_bruta = ingreso_total - costo_total
        margen_porcentaje = (utilidad_bruta / ingreso_total * 100) if ingreso_total > 0 else 0
        
        productos_rentabilidad.append(
            RentabilidadProducto(
                producto_id=row.producto_id,
                nombre=row.nombre,
                sku=row.sku,
                cantidad_vendida=cantidad_vendida,
                costo_total=costo_total,
                ingreso_total=ingreso_total,
                utilidad_bruta=utilidad_bruta,
                margen_porcentaje=margen_porcentaje
            )
        )
    
    # Ordenar según parámetro
    if orden == "utilidad":
        productos_rentabilidad.sort(key=lambda x: x.utilidad_bruta, reverse=True)
    elif orden == "margen":
        productos_rentabilidad.sort(key=lambda x: x.margen_porcentaje, reverse=True)
    elif orden == "cantidad":
        productos_rentabilidad.sort(key=lambda x: x.cantidad_vendida, reverse=True)
    
    return productos_rentabilidad[:limite]


@router.get("/ventas/tendencia-diaria", response_model=List[VentasPorPeriodo])
async def obtener_tendencia_ventas_diaria(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    dias: int = Query(30, ge=7, le=365, description="Cantidad de días a analizar")
) -> List[VentasPorPeriodo]:
    """
    Retorna la tendencia de ventas día por día
    
    Útil para:
    - Gráficos de tendencia
    - Identificar patrones de venta
    - Proyecciones de demanda
    """
    fecha_desde = datetime.utcnow() - timedelta(days=dias)
    
    stmt = select(
        func.date(Venta.fecha).label('fecha'),
        func.count(Venta.id).label('cantidad_ventas'),
        func.sum(Venta.total).label('total_vendido'),
        func.avg(Venta.total).label('ticket_promedio')
    ).where(
        and_(
            Venta.tienda_id == current_tienda.id,
            Venta.fecha >= fecha_desde,
            Venta.status_pago == 'pagado'
        )
    ).group_by(
        func.date(Venta.fecha)
    ).order_by(
        func.date(Venta.fecha)
    )
    
    result = await session.execute(stmt)
    rows = result.all()
    
    return [
        VentasPorPeriodo(
            fecha=row.fecha.isoformat() if row.fecha else "",
            cantidad_ventas=row.cantidad_ventas or 0,
            total_vendido=float(row.total_vendido or 0),
            ticket_promedio=float(row.ticket_promedio or 0)
        )
        for row in rows
    ]


# =====================================================
# NUEVOS ENDPOINTS PARA REPORTES EXTENDIDOS
# =====================================================

class VentasPorCategoria(BaseModel):
    """Ventas agrupadas por categoría"""
    category: str
    total_ventas: float
    cantidad_productos: int
    porcentaje: float


class VentasPorMetodoPago(BaseModel):
    """Ventas agrupadas por método de pago"""
    metodo_pago: str
    total_ventas: float
    cantidad_transacciones: int
    porcentaje: float


class VentaDetalleItem(BaseModel):
    """Item de venta"""
    producto: str
    sku: str
    cantidad: float
    precio_unitario: float
    subtotal: float


class VentaDetalle(BaseModel):
    """Detalle de una venta"""
    venta_id: str
    fecha: datetime
    total: float
    metodo_pago: str
    estado: str
    items: List[VentaDetalleItem]


@router.get("/por-categoria", response_model=List[VentasPorCategoria])
async def ventas_por_categoria(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    dias: int = Query(30, ge=1, le=365)
) -> List[VentasPorCategoria]:
    """
    Ventas agrupadas por categoría de producto
    """
    from sqlalchemy import text
    
    fecha_desde = datetime.utcnow() - timedelta(days=dias)
    
    sql = text("""
        WITH ventas_categoria AS (
            SELECT 
                COALESCE(p.category, 'Sin categoría') as category,
                SUM(dv.precio_unitario * dv.cantidad) as total_ventas,
                COUNT(DISTINCT dv.producto_id) as cantidad_productos
            FROM detalle_ventas dv
            INNER JOIN ventas v ON dv.venta_id = v.id
            INNER JOIN productos p ON dv.producto_id = p.id
            WHERE v.tienda_id = :tienda_id
              AND v.fecha >= :fecha_desde
              AND v.status_pago = 'pagado'
            GROUP BY p.category
        ),
        total_ventas AS (
            SELECT SUM(total_ventas) as total FROM ventas_categoria
        )
        SELECT 
            vc.category,
            vc.total_ventas,
            vc.cantidad_productos,
            (vc.total_ventas / NULLIF(tv.total, 0) * 100) as porcentaje
        FROM ventas_categoria vc
        CROSS JOIN total_ventas tv
        ORDER BY vc.total_ventas DESC
    """)
    
    result = await session.execute(sql, {
        "tienda_id": str(current_tienda.id),
        "fecha_desde": fecha_desde
    })
    rows = result.fetchall()
    
    return [
        VentasPorCategoria(
            category=row[0],
            total_ventas=float(row[1] or 0),
            cantidad_productos=row[2] or 0,
            porcentaje=float(row[3] or 0)
        )
        for row in rows
    ]


@router.get("/por-metodo-pago", response_model=List[VentasPorMetodoPago])
async def ventas_por_metodo_pago(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    dias: int = Query(30, ge=1, le=365)
) -> List[VentasPorMetodoPago]:
    """
    Ventas agrupadas por método de pago
    """
    from sqlalchemy import text
    
    fecha_desde = datetime.utcnow() - timedelta(days=dias)
    
    sql = text("""
        WITH ventas_metodo AS (
            SELECT 
                COALESCE(metodo_pago, 'No especificado') as metodo_pago,
                SUM(total) as total_ventas,
                COUNT(*) as cantidad_transacciones
            FROM ventas
            WHERE tienda_id = :tienda_id
              AND fecha >= :fecha_desde
              AND status_pago = 'pagado'
            GROUP BY metodo_pago
        ),
        total_ventas AS (
            SELECT SUM(total_ventas) as total FROM ventas_metodo
        )
        SELECT 
            vm.metodo_pago,
            vm.total_ventas,
            vm.cantidad_transacciones,
            (vm.total_ventas / NULLIF(tv.total, 0) * 100) as porcentaje
        FROM ventas_metodo vm
        CROSS JOIN total_ventas tv
        ORDER BY vm.total_ventas DESC
    """)
    
    result = await session.execute(sql, {
        "tienda_id": str(current_tienda.id),
        "fecha_desde": fecha_desde
    })
    rows = result.fetchall()
    
    return [
        VentasPorMetodoPago(
            metodo_pago=row[0],
            total_ventas=float(row[1] or 0),
            cantidad_transacciones=row[2] or 0,
            porcentaje=float(row[3] or 0)
        )
        for row in rows
    ]


@router.get("/ventas-detalle", response_model=List[VentaDetalle])
async def ventas_detalle(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    fecha_inicio: Optional[datetime] = Query(None),
    fecha_fin: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
) -> List[VentaDetalle]:
    """
    Lista detallada de ventas individuales con items
    """
    from sqlalchemy import text
    
    # Defaults de fechas
    if fecha_fin is None:
        fecha_fin = datetime.utcnow()
    if fecha_inicio is None:
        fecha_inicio = fecha_fin - timedelta(days=30)
    
    sql = text("""
        SELECT 
            v.id::text as venta_id,
            v.fecha,
            v.total,
            COALESCE(v.metodo_pago, 'No especificado') as metodo_pago,
            v.status_pago as estado,
            json_agg(
                json_build_object(
                    'producto', p.nombre,
                    'sku', p.sku,
                    'cantidad', dv.cantidad,
                    'precio_unitario', dv.precio_unitario,
                    'subtotal', dv.cantidad * dv.precio_unitario
                )
            ) as items
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
        LEFT JOIN productos p ON dv.producto_id = p.id
        WHERE v.tienda_id = :tienda_id
          AND v.fecha >= :fecha_inicio
          AND v.fecha <= :fecha_fin
        GROUP BY v.id, v.fecha, v.total, v.metodo_pago, v.status_pago
        ORDER BY v.fecha DESC
        LIMIT :limit OFFSET :offset
    """)
    
    result = await session.execute(sql, {
        "tienda_id": str(current_tienda.id),
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "limit": limit,
        "offset": offset
    })
    rows = result.fetchall()
    
    ventas_list = []
    for row in rows:
        items = []
        if row[5]:  # items json
            for item_data in row[5]:
                items.append(VentaDetalleItem(
                    producto=item_data.get('producto', ''),
                    sku=item_data.get('sku', ''),
                    cantidad=float(item_data.get('cantidad', 0)),
                    precio_unitario=float(item_data.get('precio_unitario', 0)),
                    subtotal=float(item_data.get('subtotal', 0))
                ))
        
        ventas_list.append(VentaDetalle(
            venta_id=row[0],
            fecha=row[1],
            total=float(row[2]),
            metodo_pago=row[3],
            estado=row[4],
            items=items
        ))
    
    return ventas_list


@router.get("/export/csv")
async def exportar_csv(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)],
    tipo: str = Query(..., description="Tipo de reporte: 'ventas', 'productos', 'inventario'"),
    dias: int = Query(30, ge=1, le=365)
):
    """
    Exportar reportes a CSV
    """
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    fecha_desde = datetime.utcnow() - timedelta(days=dias)
    
    if tipo == 'ventas':
        # CSV de ventas
        from sqlalchemy import text
        sql = text("""
            SELECT 
                v.id::text as venta_id,
                v.fecha,
                v.total,
                v.metodo_pago,
                v.status_pago,
                p.nombre as producto,
                p.sku,
                dv.cantidad,
                dv.precio_unitario,
                (dv.cantidad * dv.precio_unitario) as subtotal
            FROM ventas v
            LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
            LEFT JOIN productos p ON dv.producto_id = p.id
            WHERE v.tienda_id = :tienda_id
              AND v.fecha >= :fecha_desde
            ORDER BY v.fecha DESC
        """)
        
        result = await session.execute(sql, {
            "tienda_id": str(current_tienda.id),
            "fecha_desde": fecha_desde
        })
        rows = result.fetchall()
        
        # Crear CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow(['Venta ID', 'Fecha', 'Total', 'Método Pago', 'Estado', 
                        'Producto', 'SKU', 'Cantidad', 'Precio Unitario', 'Subtotal'])
        
        # Datos
        for row in rows:
            writer.writerow(row)
        
        # Retornar como descarga
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=reporte_ventas_{datetime.now().strftime('%Y%m%d')}.csv"
            }
        )
    
    else:
        return {"error": "Tipo de reporte no soportado. Use: 'ventas'"}

