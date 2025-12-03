"""
Rutas de API para Reportes y Análisis Retail
"""

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional

from core.db import get_session
from api.deps import get_current_user_id
from services.retail_analytics_service import RetailAnalyticsService


router = APIRouter(prefix="/retail/analytics", tags=["Análisis Retail"])


@router.get("/top-products-by-category")
async def get_top_products_by_category(
    tienda_id: UUID,
    days: int = Query(30, ge=1, le=365, description="Días hacia atrás"),
    limit: int = Query(10, ge=1, le=100),
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    Top productos más vendidos por categoría
    """
    service = RetailAnalyticsService(db)
    
    fecha_hasta = datetime.now()
    fecha_desde = fecha_hasta - timedelta(days=days)
    
    results = await service.get_top_products_by_category(
        tienda_id=tienda_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        limit=limit
    )
    
    return {
        "period": f"Últimos {days} días",
        "fecha_desde": fecha_desde.isoformat(),
        "fecha_hasta": fecha_hasta.isoformat(),
        "results": results
    }


@router.get("/seasonality")
async def get_seasonality_analysis(
    tienda_id: UUID,
    year: int = Query(2025, ge=2020, le=2030),
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    Análisis de estacionalidad por temporada
    """
    service = RetailAnalyticsService(db)
    
    analysis = await service.get_seasonality_analysis(
        tienda_id=tienda_id,
        year=year
    )
    
    return {
        "year": year,
        "seasons": analysis
    }


@router.get("/brand-performance")
async def get_brand_performance(
    tienda_id: UUID,
    days: int = Query(30, ge=1, le=365),
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    Análisis de performance por marca
    """
    service = RetailAnalyticsService(db)
    
    fecha_hasta = datetime.now()
    fecha_desde = fecha_hasta - timedelta(days=days)
    
    results = await service.get_brand_performance(
        tienda_id=tienda_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta
    )
    
    return {
        "period": f"Últimos {days} días",
        "brands": results
    }


@router.get("/size-distribution")
async def get_size_distribution(
    tienda_id: UUID,
    product_id: Optional[UUID] = None,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    Distribución de ventas por talle
    """
    service = RetailAnalyticsService(db)
    
    distribution = await service.get_size_distribution(
        tienda_id=tienda_id,
        product_id=product_id
    )
    
    return {
        "product_id": str(product_id) if product_id else "all",
        "distribution": distribution
    }


@router.get("/color-preferences")
async def get_color_preferences(
    tienda_id: UUID,
    product_id: Optional[UUID] = None,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    Análisis de preferencias por color
    """
    service = RetailAnalyticsService(db)
    
    preferences = await service.get_color_preferences(
        tienda_id=tienda_id,
        product_id=product_id
    )
    
    return {
        "product_id": str(product_id) if product_id else "all",
        "colors": preferences
    }


@router.get("/restock-suggestions")
async def get_restock_suggestions(
    tienda_id: UUID,
    days_lookback: int = Query(30, ge=7, le=90),
    min_sales_velocity: int = Query(5, ge=1, le=100),
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    Sugerencias de restock basadas en velocidad de ventas
    """
    service = RetailAnalyticsService(db)
    
    suggestions = await service.get_restock_suggestions(
        tienda_id=tienda_id,
        days_lookback=days_lookback,
        min_sales_velocity=min_sales_velocity
    )
    
    return {
        "analysis_period_days": days_lookback,
        "min_daily_sales": min_sales_velocity,
        "suggestions": suggestions,
        "urgent_count": len([s for s in suggestions if s["days_until_stockout"] < 3])
    }


@router.get("/inventory-health")
async def get_inventory_health(
    tienda_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    Salud general del inventario
    """
    service = RetailAnalyticsService(db)
    
    health = await service.get_inventory_health(tienda_id=tienda_id)
    
    return health
