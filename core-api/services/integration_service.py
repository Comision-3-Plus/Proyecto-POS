"""
Integration Service - Gestión de integraciones e-commerce
"""
from typing import Optional, Dict, Any
from uuid import UUID
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from cryptography.fernet import Fernet
import json
import os

from schemas_models.ecommerce_models import (
    IntegracionEcommerce,
    PlataformaEcommerce,
    APIKey,
    ProductMapping,
    SyncLog
)
from core.integrations.base_connector import BaseEcommerceConnector
from core.integrations.shopify_connector import ShopifyConnector
from core.integrations.woocommerce_connector import WooCommerceConnector


class IntegrationService:
    """
    Servicio de gestión de integraciones
    """
    
    # Encryption key (debe estar en .env en producción)
    ENCRYPTION_KEY = os.getenv("INTEGRATION_ENCRYPTION_KEY", Fernet.generate_key())
    fernet = Fernet(ENCRYPTION_KEY)
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    @classmethod
    def encrypt_config(cls, config: Dict) -> str:
        """
        Encripta credenciales
        """
        config_json = json.dumps(config)
        encrypted = cls.fernet.encrypt(config_json.encode())
        return encrypted.decode()
    
    @classmethod
    def decrypt_config(cls, encrypted: str) -> Dict:
        """
        Desencripta credenciales
        """
        decrypted = cls.fernet.decrypt(encrypted.encode())
        return json.loads(decrypted.decode())
    
    def get_connector(
        self,
        integracion: IntegracionEcommerce
    ) -> BaseEcommerceConnector:
        """
        Obtiene connector apropiado para la integración
        """
        # Desencriptar config
        config = self.decrypt_config(integracion.config_encrypted)
        
        # Factory pattern
        connectors = {
            PlataformaEcommerce.SHOPIFY: ShopifyConnector,
            PlataformaEcommerce.WOOCOMMERCE: WooCommerceConnector,
            # PlataformaEcommerce.TIENDANUBE: TiendanubeConnector,
            # PlataformaEcommerce.CUSTOM: CustomConnector
        }
        
        connector_class = connectors.get(integracion.plataforma)
        if not connector_class:
            raise ValueError(f"Plataforma {integracion.plataforma} no soportada")
        
        return connector_class(config)
    
    async def test_integration(
        self,
        integracion_id: UUID
    ) -> bool:
        """
        Prueba conexión con e-commerce
        """
        integracion = await self.session.get(IntegracionEcommerce, integracion_id)
        if not integracion:
            raise ValueError("Integración no encontrada")
        
        connector = self.get_connector(integracion)
        
        try:
            result = await connector.test_connection()
            
            integracion.connection_status = "connected" if result else "error"
            integracion.last_test = datetime.utcnow()
            
            await self.session.commit()
            
            return result
        
        except Exception as e:
            integracion.connection_status = "error"
            integracion.last_error = str(e)
            await self.session.commit()
            return False
    
    async def import_products_from_ecommerce(
        self,
        integracion_id: UUID,
        limit: int = 100
    ) -> Dict:
        """
        Importa productos desde e-commerce a Nexus
        
        Returns:
            {
                "imported": 50,
                "errors": [],
                "sync_log_id": "xxx"
            }
        """
        from datetime import datetime
        from models import Product, ProductVariant, Size, Color
        
        integracion = await self.session.get(IntegracionEcommerce, integracion_id)
        connector = self.get_connector(integracion)
        
        # Crear log de sincronización
        sync_log = SyncLog(
            integracion_id=integracion_id,
            tipo="products",
            direccion="import",
            status="in_progress",
            inicio=datetime.utcnow()
        )
        self.session.add(sync_log)
        await self.session.flush()
        
        imported count = 0
        errors = []
        
        try:
            # Obtener productos del e-commerce
            products_data = await connector.import_products(limit=limit)
            
            for product_data in products_data:
                try:
                    # Crear o actualizar producto
                    await self._upsert_product(
                        integracion_id=integracion_id,
                        tienda_id=integracion.tienda_id,
                        product_data=product_data
                    )
                    imported_count += 1
                
                except Exception as e:
                    errors.append({
                        "external_id": product_data.get("external_id"),
                        "error": str(e)
                    })
            
            # Actualizar log
            sync_log.status = "success" if not errors else "partial"
            sync_log.items_procesados = len(products_data)
            sync_log.items_exitosos = imported_count
            sync_log.items_fallidos = len(errors)
            sync_log.errores = errors if errors else None
            sync_log.fin = datetime.utcnow()
            sync_log.duracion_segundos = (
                sync_log.fin - sync_log.inicio
            ).total_seconds()
            
            # Actualizar integración
            integracion.last_sync = datetime.utcnow()
            integracion.last_sync_status = sync_log.status
            
            await self.session.commit()
            
            return {
                "imported": imported_count,
                "errors": errors,
                "sync_log_id": str(sync_log.id)
            }
        
        except Exception as e:
            sync_log.status = "error"
            sync_log.errores = [{"error": str(e)}]
            sync_log.fin = datetime.utcnow()
            await self.session.commit()
            raise
    
    async def sync_stock_to_ecommerce(
        self,
        variant_id: UUID,
        new_stock: int
    ):
        """
        Sincroniza stock de Nexus → E-commerce
        
        Actualiza en TODAS las integraciones activas de la tienda
        """
        from models import ProductVariant
        
        # Obtener variante
        variant = await self.session.get(ProductVariant, variant_id)
        if not variant:
            return
        
        # Obtener integraciones activas de la tienda
        result = await self.session.exec(
            select(IntegracionEcommerce)
            .where(
                and_(
                    IntegracionEcommerce.tienda_id == variant.tienda_id,
                    IntegracionEcommerce.is_active == True,
                    IntegracionEcommerce.auto_sync_stock == True
                )
            )
        )
        integraciones = result.all()
        
        for integracion in integraciones:
            try:
                connector = self.get_connector(integracion)
                
                # Actualizar stock
                await connector.update_stock(
                    sku=variant.sku,
                    quantity=new_stock
                )
                
                print(f"✓ Stock actualizado en {integracion.nombre}: {variant.sku} = {new_stock}")
            
            except Exception as e:
                print(f"✗ Error sync stock a {integracion.nombre}: {e}")
    
    async def _upsert_product(
        self,
        integracion_id: UUID,
        tienda_id: UUID,
        product_data: Dict
    ):
        """
        Crea o actualiza producto desde datos de e-commerce
        """
        from models import Product, ProductVariant, Size, Color
        
        external_id = product_data["external_id"]
        
        # Buscar si ya existe mapping
        result = await self.session.exec(
            select(ProductMapping)
            .where(
                and_(
                    ProductMapping.integracion_id == integracion_id,
                    ProductMapping.external_product_id == external_id
                )
            )
        )
        mapping = result.first()
        
        if mapping:
            # Producto ya existe, actualizar
            product = await self.session.get(Product, mapping.product_id)
            product.name = product_data["name"]
            product.description = product_data.get("description")
            # ... actualizar otros campos
        
        else:
            # Crear nuevo producto
            product = Product(
                tienda_id=tienda_id,
                name=product_data["name"],
                base_sku=product_data.get("base_sku", ""),
                description=product_data.get("description"),
                category=product_data.get("category")
            )
            self.session.add(product)
            await self.session.flush()
            
            # Crear mapping
            mapping = ProductMapping(
                integracion_id=integracion_id,
                product_id=product.product_id,
                external_product_id=external_id
            )
            self.session.add(mapping)
        
        # Crear/actualizar variantes
        for variant_data in product_data.get("variants", []):
            # TODO: Implementar creación de variantes
            pass


from sqlalchemy import and_
from datetime import datetime
