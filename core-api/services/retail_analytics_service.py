"""
Servicio de Análisis y Reportes Retail
Reportes específicos para retail de ropa
"""

from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, desc, and_
from sqlalchemy.orm import aliased
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from models import (
    Product, ProductVariant, Venta, DetalleVenta,
    Size, Color, InventoryLedger
)
from schemas_models.retail_models import ProductCategory


class RetailAnalyticsService:
    """
    Servicio de análisis y reportes para retail de ropa
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_top_products_by_category(
        self,
        tienda_id: UUID,
        fecha_desde: datetime,
        fecha_hasta: datetime,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Top productos más vendidos por categoría
        
        Returns:
            [
                {
                    "category": "Remeras",
                    "product_name": "Remera Nike Sportswear",
                    "units_sold": 145,
                    "revenue": 72500.00
                },
                ...
            ]
        """
        stmt = (
            select(
                ProductCategory.name.label("category"),
                Product.name.label("product_name"),
                func.sum(VentaItem.cantidad).label("units_sold"),
                func.sum(VentaItem.subtotal).label("revenue")
            )
            .join(Product, Product.category_id == ProductCategory.id)
            .join(ProductVariant, ProductVariant.product_id == Product.id)
            .join(VentaItem, VentaItem.product_variant_id == ProductVariant.id)
            .join(Venta, Venta.id == VentaItem.venta_id)
            .where(
                and_(
                    Product.tienda_id == tienda_id,
                    Venta.fecha >= fecha_desde,
                    Venta.fecha <= fecha_hasta
                )
            )
            .group_by(ProductCategory.name, Product.name)
            .order_by(desc("units_sold"))
            .limit(limit)
        )
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        return [
            {
                "category": row.category,
                "product_name": row.product_name,
                "units_sold": int(row.units_sold),
                "revenue": float(row.revenue)
            }
            for row in rows
        ]
    
    async def get_seasonality_analysis(
        self,
        tienda_id: UUID,
        year: int
    ) -> Dict[str, Any]:
        """
        Análisis de estacionalidad por temporada
        
        Returns:
            {
                "Verano 2025": {
                    "units_sold": 450,
                    "revenue": 225000.00,
                    "top_product": "Remera Nike"
                },
                "Invierno 2025": {
                    "units_sold": 320,
                    "revenue": 384000.00,
                    "top_product": "Buzo Adidas"
                }
            }
        """
        stmt = (
            select(
                Product.season,
                func.sum(VentaItem.cantidad).label("units_sold"),
                func.sum(VentaItem.subtotal).label("revenue")
            )
            .join(ProductVariant, ProductVariant.product_id == Product.id)
            .join(VentaItem, VentaItem.product_variant_id == ProductVariant.id)
            .join(Venta, Venta.id == VentaItem.venta_id)
            .where(
                and_(
                    Product.tienda_id == tienda_id,
                    Product.season.isnot(None),
                    func.extract('year', Venta.fecha) == year
                )
            )
            .group_by(Product.season)
        )
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        analysis = {}
        for row in rows:
            # Obtener top product por temporada
            top_stmt = (
                select(Product.name)
                .join(ProductVariant, ProductVariant.product_id == Product.id)
                .join(VentaItem, VentaItem.product_variant_id == ProductVariant.id)
                .join(Venta, Venta.id == VentaItem.venta_id)
                .where(
                    and_(
                        Product.tienda_id == tienda_id,
                        Product.season == row.season,
                        func.extract('year', Venta.fecha) == year
                    )
                )
                .group_by(Product.name)
                .order_by(desc(func.sum(VentaItem.cantidad)))
                .limit(1)
            )
            top_result = await self.db.execute(top_stmt)
            top_product = top_result.scalar_one_or_none()
            
            analysis[row.season] = {
                "units_sold": int(row.units_sold),
                "revenue": float(row.revenue),
                "top_product": top_product
            }
        
        return analysis
    
    async def get_brand_performance(
        self,
        tienda_id: UUID,
        fecha_desde: datetime,
        fecha_hasta: datetime
    ) -> List[Dict[str, Any]]:
        """
        Análisis de performance por marca
        
        Returns:
            [
                {
                    "brand": "Nike",
                    "units_sold": 320,
                    "revenue": 192000.00,
                    "avg_price": 600.00,
                    "products_count": 45
                },
                ...
            ]
        """
        stmt = (
            select(
                Product.brand,
                func.sum(VentaItem.cantidad).label("units_sold"),
                func.sum(VentaItem.subtotal).label("revenue"),
                func.avg(VentaItem.precio_unitario).label("avg_price"),
                func.count(func.distinct(Product.id)).label("products_count")
            )
            .join(ProductVariant, ProductVariant.product_id == Product.id)
            .join(VentaItem, VentaItem.product_variant_id == ProductVariant.id)
            .join(Venta, Venta.id == VentaItem.venta_id)
            .where(
                and_(
                    Product.tienda_id == tienda_id,
                    Product.brand.isnot(None),
                    Venta.fecha >= fecha_desde,
                    Venta.fecha <= fecha_hasta
                )
            )
            .group_by(Product.brand)
            .order_by(desc("revenue"))
        )
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        return [
            {
                "brand": row.brand,
                "units_sold": int(row.units_sold),
                "revenue": float(row.revenue),
                "avg_price": float(row.avg_price),
                "products_count": int(row.products_count)
            }
            for row in rows
        ]
    
    async def get_size_distribution(
        self,
        tienda_id: UUID,
        product_id: Optional[UUID] = None
    ) -> Dict[str, int]:
        """
        Distribución de ventas por talle
        
        Returns:
            {
                "S": 45,
                "M": 120,
                "L": 89,
                "XL": 34
            }
        """
        stmt = (
            select(
                Size.name,
                func.sum(VentaItem.cantidad).label("units_sold")
            )
            .join(ProductVariant, ProductVariant.size_id == Size.id)
            .join(VentaItem, VentaItem.product_variant_id == ProductVariant.id)
            .where(Size.tienda_id == tienda_id)
        )
        
        if product_id:
            stmt = stmt.where(ProductVariant.product_id == product_id)
        
        stmt = stmt.group_by(Size.name).order_by(desc("units_sold"))
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        return {row.name: int(row.units_sold) for row in rows}
    
    async def get_restock_suggestions(
        self,
        tienda_id: UUID,
        days_lookback: int = 30,
        min_sales_velocity: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Sugerencias de restock basadas en velocidad de ventas
        
        Args:
            days_lookback: Días hacia atrás para calcular velocidad
            min_sales_velocity: Ventas mínimas por día para considerar
        
        Returns:
            [
                {
                    "product_name": "Remera Nike",
                    "sku": "REM-001-ROJO-M",
                    "current_stock": 5,
                    "daily_velocity": 8.5,
                    "days_until_stockout": 0.6,
                    "suggested_restock": 255
                },
                ...
            ]
        """
        fecha_desde = datetime.now(timezone.utc) - timedelta(days=days_lookback)
        
        # Subconsulta: ventas por variante
        sales_subq = (
            select(
                VentaItem.product_variant_id,
                func.sum(VentaItem.cantidad).label("total_sold")
            )
            .join(Venta, Venta.id == VentaItem.venta_id)
            .where(Venta.fecha >= fecha_desde)
            .group_by(VentaItem.product_variant_id)
            .subquery()
        )
        
        # Subconsulta: stock actual
        stock_subq = (
            select(
                InventoryLedger.product_variant_id,
                func.max(InventoryLedger.created_at).label("latest_date")
            )
            .group_by(InventoryLedger.product_variant_id)
            .subquery()
        )
        
        LatestStock = aliased(InventoryLedger)
        
        stmt = (
            select(
                Product.name.label("product_name"),
                ProductVariant.sku,
                LatestStock.stock_after.label("current_stock"),
                sales_subq.c.total_sold
            )
            .join(ProductVariant, ProductVariant.product_id == Product.id)
            .join(sales_subq, sales_subq.c.product_variant_id == ProductVariant.id)
            .join(stock_subq, stock_subq.c.product_variant_id == ProductVariant.id)
            .join(
                LatestStock,
                and_(
                    LatestStock.product_variant_id == ProductVariant.id,
                    LatestStock.created_at == stock_subq.c.latest_date
                )
            )
            .where(Product.tienda_id == tienda_id)
        )
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        suggestions = []
        for row in rows:
            daily_velocity = row.total_sold / days_lookback
            
            if daily_velocity < min_sales_velocity:
                continue
            
            days_until_stockout = row.current_stock / daily_velocity if daily_velocity > 0 else 999
            
            # Sugerir restock si quedan menos de 7 días
            if days_until_stockout < 7:
                suggested_restock = int(daily_velocity * 30)  # 1 mes de stock
                
                suggestions.append({
                    "product_name": row.product_name,
                    "sku": row.sku,
                    "current_stock": row.current_stock,
                    "daily_velocity": round(daily_velocity, 1),
                    "days_until_stockout": round(days_until_stockout, 1),
                    "suggested_restock": suggested_restock
                })
        
        # Ordenar por urgencia (menor días hasta stockout)
        suggestions.sort(key=lambda x: x["days_until_stockout"])
        
        return suggestions
    
    async def get_color_preferences(
        self,
        tienda_id: UUID,
        product_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Análisis de preferencias por color
        
        Returns:
            [
                {
                    "color": "Negro",
                    "hex_code": "#000000",
                    "units_sold": 234,
                    "percentage": 35.5
                },
                ...
            ]
        """
        stmt = (
            select(
                Color.name,
                Color.hex_code,
                func.sum(VentaItem.cantidad).label("units_sold")
            )
            .join(ProductVariant, ProductVariant.color_id == Color.id)
            .join(VentaItem, VentaItem.product_variant_id == ProductVariant.id)
            .where(Color.tienda_id == tienda_id)
        )
        
        if product_id:
            stmt = stmt.where(ProductVariant.product_id == product_id)
        
        stmt = stmt.group_by(Color.name, Color.hex_code).order_by(desc("units_sold"))
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        total_sold = sum(row.units_sold for row in rows)
        
        return [
            {
                "color": row.name,
                "hex_code": row.hex_code,
                "units_sold": int(row.units_sold),
                "percentage": round((row.units_sold / total_sold * 100), 1) if total_sold > 0 else 0
            }
            for row in rows
        ]
    
    async def get_inventory_health(
        self,
        tienda_id: UUID
    ) -> Dict[str, Any]:
        """
        Salud general del inventario
        
        Returns:
            {
                "total_products": 450,
                "total_variants": 2340,
                "out_of_stock": 34,
                "low_stock": 89,
                "overstock": 12,
                "total_value": 1250000.00
            }
        """
        # Total productos
        stmt_products = select(func.count(Product.id)).where(Product.tienda_id == tienda_id)
        total_products = (await self.db.execute(stmt_products)).scalar()
        
        # Total variantes
        stmt_variants = select(func.count(ProductVariant.id)).where(ProductVariant.tienda_id == tienda_id)
        total_variants = (await self.db.execute(stmt_variants)).scalar()
        
        # TODO: Implementar lógica de out_of_stock, low_stock, overstock
        # Requiere calcular stock actual desde InventoryLedger
        
        return {
            "total_products": total_products,
            "total_variants": total_variants,
            "out_of_stock": 0,  # TODO
            "low_stock": 0,  # TODO
            "overstock": 0,  # TODO
            "total_value": 0.0  # TODO
        }
