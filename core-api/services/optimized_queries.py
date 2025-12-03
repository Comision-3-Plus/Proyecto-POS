"""
Optimizaciones de queries con eager loading
Evita el problema N+1 usando selectinload y joinedload
"""
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from models import (
    Product, ProductVariant, InventoryLedger,
    Venta, VentaItem, Cliente,
    Usuario, Tienda
)


class OptimizedQueries:
    """Queries optimizadas con eager loading"""
    
    @staticmethod
    async def get_productos_with_variants(
        db: AsyncSession,
        tienda_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[Product]:
        """
        Obtiene productos con variantes en una sola query
        Evita N+1 al cargar variantes
        """
        query = (
            select(Product)
            .where(Product.tienda_id == tienda_id)
            .options(
                selectinload(Product.variants).selectinload(ProductVariant.inventory_ledgers)
            )
            .limit(limit)
            .offset(offset)
        )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_producto_detail(
        db: AsyncSession,
        producto_id: UUID
    ) -> Optional[Product]:
        """
        Obtiene un producto con todas sus relaciones cargadas
        """
        query = (
            select(Product)
            .where(Product.id == producto_id)
            .options(
                selectinload(Product.variants).selectinload(ProductVariant.inventory_ledgers),
                joinedload(Product.tienda)
            )
        )
        
        result = await db.execute(query)
        return result.unique().scalar_one_or_none()
    
    @staticmethod
    async def get_ventas_with_items(
        db: AsyncSession,
        tienda_id: UUID,
        limit: int = 50
    ) -> List[Venta]:
        """
        Obtiene ventas con items y productos en una sola query
        """
        query = (
            select(Venta)
            .where(Venta.tienda_id == tienda_id)
            .options(
                selectinload(Venta.items).joinedload(VentaItem.producto),
                joinedload(Venta.cliente),
                joinedload(Venta.usuario)
            )
            .order_by(Venta.created_at.desc())
            .limit(limit)
        )
        
        result = await db.execute(query)
        return result.unique().scalars().all()
    
    @staticmethod
    async def get_venta_detail(
        db: AsyncSession,
        venta_id: UUID
    ) -> Optional[Venta]:
        """
        Obtiene detalle completo de una venta
        """
        query = (
            select(Venta)
            .where(Venta.id == venta_id)
            .options(
                selectinload(Venta.items).joinedload(VentaItem.producto),
                joinedload(Venta.cliente),
                joinedload(Venta.usuario),
                joinedload(Venta.tienda)
            )
        )
        
        result = await db.execute(query)
        return result.unique().scalar_one_or_none()
    
    @staticmethod
    async def get_clientes_with_stats(
        db: AsyncSession,
        tienda_id: UUID,
        limit: int = 50
    ) -> List[Cliente]:
        """
        Obtiene clientes con sus ventas cargadas
        Útil para mostrar historial de compras
        """
        query = (
            select(Cliente)
            .where(Cliente.tienda_id == tienda_id)
            .options(
                selectinload(Cliente.ventas)
            )
            .order_by(Cliente.created_at.desc())
            .limit(limit)
        )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_usuarios_with_tienda(
        db: AsyncSession,
        limit: int = 50
    ) -> List[Usuario]:
        """
        Obtiene usuarios con tienda y rol cargados
        """
        query = (
            select(Usuario)
            .options(
                joinedload(Usuario.tienda),
                joinedload(Usuario.role)
            )
            .limit(limit)
        )
        
        result = await db.execute(query)
        return result.unique().scalars().all()
    
    @staticmethod
    async def get_stock_by_tienda(
        db: AsyncSession,
        tienda_id: UUID
    ):
        """
        Obtiene inventario completo de una tienda
        Con productos y variantes en una query
        """
        query = (
            select(Product)
            .where(Product.tienda_id == tienda_id)
            .options(
                selectinload(Product.variants).selectinload(
                    ProductVariant.inventory_ledgers
                )
            )
        )
        
        result = await db.execute(query)
        products = result.scalars().all()
        
        # Calcular stock para cada variante
        stock_items = []
        for product in products:
            for variant in product.variants:
                # Calcular stock sumando deltas del ledger
                stock = sum(
                    ledger.delta 
                    for ledger in variant.inventory_ledgers
                )
                
                stock_items.append({
                    "producto_id": product.id,
                    "producto_nombre": product.name,
                    "variant_id": variant.id,
                    "variant_sku": variant.sku,
                    "variant_name": variant.name,
                    "stock_actual": stock,
                    "precio_venta": variant.price,
                    "costo": variant.cost_price or 0,
                })
        
        return stock_items


# Helper para agregar índices necesarios (ejecutar en migración)
RECOMMENDED_INDEXES = """
-- Índices para optimizar queries frecuentes

-- Productos por tienda
CREATE INDEX IF NOT EXISTS idx_products_tienda_id ON products(tienda_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Variantes por producto
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- Inventory Ledger por variante
CREATE INDEX IF NOT EXISTS idx_inventory_variant_id ON inventory_ledger(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_timestamp ON inventory_ledger(timestamp DESC);

-- Ventas por tienda y fecha
CREATE INDEX IF NOT EXISTS idx_ventas_tienda_id ON ventas(tienda_id);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON ventas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_status ON ventas(status_pago);

-- Items de venta
CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_producto_id ON venta_items(producto_id);

-- Clientes por tienda
CREATE INDEX IF NOT EXISTS idx_clientes_tienda_id ON clientes(tienda_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_dni ON clientes(dni);

-- Usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tienda_id ON usuarios(tienda_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_role_id ON usuarios(role_id);

-- Caja
CREATE INDEX IF NOT EXISTS idx_cash_shifts_tienda_id ON cash_register_shifts(tienda_id);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_estado ON cash_register_shifts(estado);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_fecha ON cash_register_shifts(fecha_apertura DESC);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tienda_id ON audit_logs(tienda_id);

-- Índices compuestos para queries comunes
CREATE INDEX IF NOT EXISTS idx_products_tienda_active ON products(tienda_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ventas_tienda_fecha ON ventas(tienda_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_variant_timestamp ON inventory_ledger(variant_id, timestamp DESC);
"""
