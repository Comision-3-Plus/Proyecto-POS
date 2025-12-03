"""
Servicio de Sincronización Bidireccional
Shopify ↔ Nexus POS

Sincroniza:
- Productos: Shopify → Nexus (import)
- Stock: Nexus → Shopify (export)
- Órdenes: Shopify → Nexus (import)

Usa RabbitMQ para procesamiento asíncrono
"""

import asyncio
from typing import Dict, Any, List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

import logging

logger = logging.getLogger(__name__)
from core.integrations.shopify_connector import ShopifyConnector
from models import (
    Product, ProductVariant, Size, Color, InventoryLedger,
    Tienda
)
from schemas_models.ecommerce_models import (
    IntegracionEcommerce, PlataformaEcommerce,
    SyncLog, SyncDirection, SyncStatus
)


class SyncService:
    """
    Servicio de sincronización bidireccional
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def sync_products_from_shopify(
        self,
        integracion_id: UUID,
        limit: int = 250
    ) -> Dict[str, Any]:
        """
        Importa productos desde Shopify → Nexus
        
        Returns:
            {
                "imported": 10,
                "updated": 5,
                "skipped": 2,
                "errors": []
            }
        """
        # Obtener integración
        integracion = await self.db.get(IntegracionEcommerce, integracion_id)
        if not integracion or integracion.plataforma != PlataformaEcommerce.SHOPIFY:
            raise ValueError("Integración Shopify no encontrada")
        
        # Crear connector
        connector = ShopifyConnector({
            "shop_url": integracion.nombre_tienda,
            "access_token": integracion.api_key
        })
        
        # Crear log de sincronización
        sync_log = SyncLog(
            id=uuid4(),
            tienda_id=integracion.tienda_id,
            integracion_id=integracion_id,
            direction=SyncDirection.IMPORT,
            status=SyncStatus.RUNNING,
            started_at=datetime.now(timezone.utc)
        )
        self.db.add(sync_log)
        await self.db.commit()
        
        stats = {
            "imported": 0,
            "updated": 0,
            "skipped": 0,
            "errors": []
        }
        
        try:
            # Importar productos
            shopify_products = await connector.import_products(limit=limit)
            
            for sp in shopify_products:
                try:
                    # Buscar si ya existe (por external_id)
                    stmt = select(Product).where(
                        Product.tienda_id == integracion.tienda_id,
                        Product.external_id == sp["external_id"]
                    )
                    result = await self.db.execute(stmt)
                    existing_product = result.scalar_one_or_none()
                    
                    if existing_product:
                        # Actualizar
                        existing_product.name = sp["name"]
                        existing_product.description = sp["description"]
                        existing_product.brand = sp.get("vendor")
                        existing_product.tags = sp.get("tags", [])
                        existing_product.images = [sp.get("image_url")] if sp.get("image_url") else []
                        existing_product.updated_at = datetime.now(timezone.utc)
                        stats["updated"] += 1
                    else:
                        # Crear nuevo
                        new_product = Product(
                            id=uuid4(),
                            tienda_id=integracion.tienda_id,
                            name=sp["name"],
                            base_sku=sp["base_sku"],
                            description=sp.get("description"),
                            brand=sp.get("vendor"),
                            tags=sp.get("tags", []),
                            images=[sp.get("image_url")] if sp.get("image_url") else [],
                            external_id=sp["external_id"],
                            created_at=datetime.now(timezone.utc),
                            updated_at=datetime.now(timezone.utc)
                        )
                        self.db.add(new_product)
                        stats["imported"] += 1
                    
                    await self.db.commit()
                
                except Exception as e:
                    logger.error(f"[SYNC] Error importando producto {sp.get('name')}: {e}")
                    stats["errors"].append(str(e))
                    await self.db.rollback()
            
            # Actualizar log
            sync_log.status = SyncStatus.SUCCESS
            sync_log.records_processed = stats["imported"] + stats["updated"]
            sync_log.completed_at = datetime.now(timezone.utc)
            sync_log.details = stats
            await self.db.commit()
            
            logger.info(f"[SYNC] Productos importados: {stats['imported']}, actualizados: {stats['updated']}")
            
        except Exception as e:
            sync_log.status = SyncStatus.ERROR
            sync_log.error_message = str(e)
            sync_log.completed_at = datetime.now(timezone.utc)
            await self.db.commit()
            logger.error(f"[SYNC] Error en sincronización: {e}")
            raise
        
        return stats
    
    async def sync_stock_to_shopify(
        self,
        integracion_id: UUID,
        product_variant_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Exporta stock desde Nexus → Shopify
        
        Args:
            integracion_id: ID de integración Shopify
            product_variant_id: Si se especifica, solo sincroniza esa variante
        
        Returns:
            {
                "synced": 45,
                "errors": []
            }
        """
        # Obtener integración
        integracion = await self.db.get(IntegracionEcommerce, integracion_id)
        if not integracion or integracion.plataforma != PlataformaEcommerce.SHOPIFY:
            raise ValueError("Integración Shopify no encontrada")
        
        # Crear connector
        connector = ShopifyConnector({
            "shop_url": integracion.nombre_tienda,
            "access_token": integracion.api_key
        })
        
        # Crear log
        sync_log = SyncLog(
            id=uuid4(),
            tienda_id=integracion.tienda_id,
            integracion_id=integracion_id,
            direction=SyncDirection.EXPORT,
            status=SyncStatus.RUNNING,
            started_at=datetime.now(timezone.utc)
        )
        self.db.add(sync_log)
        await self.db.commit()
        
        stats = {
            "synced": 0,
            "errors": []
        }
        
        try:
            # Obtener variantes a sincronizar
            if product_variant_id:
                variants = [await self.db.get(ProductVariant, product_variant_id)]
            else:
                # Todas las variantes de la tienda con SKU
                stmt = select(ProductVariant).where(
                    ProductVariant.tienda_id == integracion.tienda_id,
                    ProductVariant.sku.isnot(None)
                )
                result = await self.db.execute(stmt)
                variants = result.scalars().all()
            
            for variant in variants:
                if not variant or not variant.sku:
                    continue
                
                try:
                    # Obtener stock actual
                    stmt_stock = (
                        select(InventoryLedger)
                        .where(InventoryLedger.product_variant_id == variant.id)
                        .order_by(InventoryLedger.created_at.desc())
                        .limit(1)
                    )
                    result_stock = await self.db.execute(stmt_stock)
                    ledger = result_stock.scalar_one_or_none()
                    
                    stock_actual = ledger.stock_after if ledger else 0
                    
                    # Actualizar en Shopify
                    success = await connector.update_stock(
                        sku=variant.sku,
                        quantity=stock_actual
                    )
                    
                    if success:
                        stats["synced"] += 1
                    else:
                        stats["errors"].append(f"Error actualizando SKU {variant.sku}")
                
                except Exception as e:
                    logger.error(f"[SYNC] Error sincronizando stock {variant.sku}: {e}")
                    stats["errors"].append(str(e))
            
            # Actualizar log
            sync_log.status = SyncStatus.SUCCESS
            sync_log.records_processed = stats["synced"]
            sync_log.completed_at = datetime.now(timezone.utc)
            sync_log.details = stats
            await self.db.commit()
            
            logger.info(f"[SYNC] Stock sincronizado a Shopify: {stats['synced']} variantes")
            
        except Exception as e:
            sync_log.status = SyncStatus.ERROR
            sync_log.error_message = str(e)
            sync_log.completed_at = datetime.now(timezone.utc)
            await self.db.commit()
            logger.error(f"[SYNC] Error en sincronización de stock: {e}")
            raise
        
        return stats
    
    async def handle_shopify_webhook_product_update(
        self,
        tienda_id: UUID,
        shopify_product: Dict[str, Any]
    ) -> None:
        """
        Maneja webhook de Shopify products/update
        Actualiza producto en Nexus
        """
        external_id = str(shopify_product["id"])
        
        # Buscar producto existente
        stmt = select(Product).where(
            Product.tienda_id == tienda_id,
            Product.external_id == external_id
        )
        result = await self.db.execute(stmt)
        product = result.scalar_one_or_none()
        
        if product:
            # Actualizar
            product.name = shopify_product["title"]
            product.description = shopify_product.get("body_html")
            product.brand = shopify_product.get("vendor")
            product.tags = shopify_product.get("tags", "").split(",")
            product.updated_at = datetime.now(timezone.utc)
            
            await self.db.commit()
            logger.info(f"[WEBHOOK] Producto actualizado: {product.name}")
        else:
            logger.warning(f"[WEBHOOK] Producto no encontrado: {external_id}")
    
    async def handle_shopify_webhook_inventory_update(
        self,
        tienda_id: UUID,
        inventory_data: Dict[str, Any]
    ) -> None:
        """
        Maneja webhook de Shopify inventory_levels/update
        
        Estrategia: Last-write-wins (Shopify es source of truth)
        """
        inventory_item_id = str(inventory_data["inventory_item_id"])
        available = inventory_data.get("available", 0)
        
        # Buscar variante por inventory_item_id
        # (requiere guardar inventory_item_id en ProductVariant.external_id)
        stmt = select(ProductVariant).where(
            ProductVariant.tienda_id == tienda_id,
            ProductVariant.external_id == inventory_item_id
        )
        result = await self.db.execute(stmt)
        variant = result.scalar_one_or_none()
        
        if variant:
            # Crear movimiento de ajuste de inventario
            ledger = InventoryLedger(
                id=uuid4(),
                tienda_id=tienda_id,
                product_variant_id=variant.id,
                movement_type="AJUSTE",
                quantity=available,  # Cantidad absoluta
                stock_before=0,  # Se calcula en trigger
                stock_after=available,
                reason="Sincronización desde Shopify",
                created_at=datetime.now(timezone.utc)
            )
            self.db.add(ledger)
            await self.db.commit()
            
            logger.info(f"[WEBHOOK] Stock actualizado: {variant.sku} → {available}")
        else:
            logger.warning(f"[WEBHOOK] Variante no encontrada: {inventory_item_id}")


class SyncScheduler:
    """
    Programador de sincronizaciones automáticas
    
    Usa Celery/RQ o cron para ejecutar:
    - Sync de productos: Cada 6 horas
    - Sync de stock: Cada 30 minutos
    """
    
    @staticmethod
    async def schedule_product_sync(integracion_id: UUID, db: AsyncSession) -> None:
        """
        Ejecuta sincronización de productos programada
        """
        service = SyncService(db)
        try:
            stats = await service.sync_products_from_shopify(integracion_id)
            logger.info(f"[SCHEDULER] Productos sincronizados: {stats}")
        except Exception as e:
            logger.error(f"[SCHEDULER] Error en sync programado: {e}")
    
    @staticmethod
    async def schedule_stock_sync(integracion_id: UUID, db: AsyncSession) -> None:
        """
        Ejecuta sincronización de stock programada
        """
        service = SyncService(db)
        try:
            stats = await service.sync_stock_to_shopify(integracion_id)
            logger.info(f"[SCHEDULER] Stock sincronizado: {stats}")
        except Exception as e:
            logger.error(f"[SCHEDULER] Error en stock sync: {e}")
