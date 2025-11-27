"""
WooCommerce Connector - Integración con WooCommerce
"""
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
from requests_oauthlib import OAuth1

from core.integrations.base_connector import BaseEcommerceConnector


class WooCommerceConnector(BaseEcommerceConnector):
    """
    Conector para WooCommerce usando REST API
    Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/
    """
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        self.store_url = config.get("store_url")  # "https://mitienda.com"
        self.consumer_key = config.get("consumer_key")  # "ck_xxxxx"
        self.consumer_secret = config.get("consumer_secret")  # "cs_xxxxx"
        
        self.base_url = f"{self.store_url}/wp-json/wc/v3"
        
        # WooCommerce usa OAuth1 o Basic Auth
        self.auth = (self.consumer_key, self.consumer_secret)
    
    async def test_connection(self) -> bool:
        """
        Prueba conexión obteniendo info de sistema
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/system_status",
                    auth=self.auth,
                    timeout=10.0
                )
                return response.status_code == 200
        except:
            return False
    
    async def import_products(
        self,
        limit: int = 100,
        page: int = 1
    ) -> List[Dict]:
        """
        Importa productos desde WooCommerce
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/products",
                auth=self.auth,
                params={"per_page": min(limit, 100), "page": page},
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise Exception(f"WooCommerce API error: {response.text}")
            
            products_raw = response.json()
            
            return [self._normalize_product(p) for p in products_raw]
    
    async def import_product_by_id(self, external_id: str) -> Dict:
        """
        Importa producto específico
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/products/{external_id}",
                auth=self.auth,
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Product not found: {external_id}")
            
            product_raw = response.json()
            return self._normalize_product(product_raw)
    
    async def update_stock(
        self,
        sku: str,
        quantity: int,
        location_id: Optional[str] = None
    ) -> bool:
        """
        Actualiza stock en WooCommerce
        """
        try:
            # 1. Buscar producto por SKU
            product = await self._get_product_by_sku(sku)
            if not product:
                return False
            
            product_id = product["id"]
            
            # 2. Actualizar stock
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/products/{product_id}",
                    auth=self.auth,
                    json={
                        "stock_quantity": quantity,
                        "manage_stock": True
                    },
                    timeout=10.0
                )
                
                return response.status_code == 200
        
        except:
            return False
    
    async def get_stock(
        self,
        sku: str,
        location_id: Optional[str] = None
    ) -> int:
        """
        Obtiene stock actual
        """
        product = await self._get_product_by_sku(sku)
        if product:
            return product.get("stock_quantity", 0)
        return 0
    
    async def create_webhook(
        self,
        topic: str,
        callback_url: str
    ) -> Dict:
        """
        Crea webhook en WooCommerce
        
        Topics: product.created, product.updated, product.deleted
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/webhooks",
                auth=self.auth,
                json={
                    "topic": topic,
                    "delivery_url": callback_url
                },
                timeout=10.0
            )
            
            if response.status_code == 201:
                webhook = response.json()
                return {
                    "id": str(webhook["id"]),
                    "topic": webhook["topic"],
                    "address": webhook["delivery_url"]
                }
            
            raise Exception(f"Failed to create webhook: {response.text}")
    
    async def delete_webhook(self, webhook_id: str) -> bool:
        """
        Elimina webhook
        """
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/webhooks/{webhook_id}?force=true",
                auth=self.auth,
                timeout=10.0
            )
            return response.status_code == 200
    
    async def list_webhooks(self) -> List[Dict]:
        """
        Lista webhooks configurados
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/webhooks",
                auth=self.auth,
                timeout=10.0
            )
            
            if response.status_code == 200:
                webhooks = response.json()
                return [
                    {
                        "id": str(w["id"]),
                        "topic": w["topic"],
                        "address": w["delivery_url"],
                        "created_at": w["date_created"]
                    }
                    for w in webhooks
                ]
            
            return []
    
    def _normalize_product(self, woo_product: Dict) -> Dict:
        """
        Normaliza producto de WooCommerce a formato Nexus
        
        WooCommerce diferencia:
        - Simple product (sin variantes)
        - Variable product (con variantes)
        """
        variants = []
        
        # Si es producto variable, obtener variantes
        if woo_product.get("type") == "variable":
            # NOTE: En WooCommerce, las variantes requieren otra llamada API
            # GET /products/{id}/variations
            # Por simplicidad, dejamos vacío y manejamos en el sync service
            pass
        else:
            # Producto simple, crear una sola variante
            variants.append({
                "external_id": str(woo_product["id"]),
                "sku": woo_product.get("sku", ""),
                "size": None,
                "color": None,
                "price": float(woo_product.get("price", 0)),
                "barcode": None,
                "stock": woo_product.get("stock_quantity", 0),
                "image_url": woo_product.get("images", [{}])[0].get("src") if woo_product.get("images") else None
            })
        
        return {
            "external_id": str(woo_product["id"]),
            "name": woo_product["name"],
            "base_sku": woo_product.get("sku", ""),
            "description": woo_product.get("description", ""),
            "category": woo_product.get("categories", [{}])[0].get("name") if woo_product.get("categories") else "",
            "image_url": woo_product.get("images", [{}])[0].get("src") if woo_product.get("images") else None,
            "variants": variants
        }
    
    async def _get_product_by_sku(self, sku: str) -> Optional[Dict]:
        """
        Busca producto por SKU
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/products",
                auth=self.auth,
                params={"sku": sku},
                timeout=10.0
            )
            
            if response.status_code == 200:
                products = response.json()
                if products:
                    return products[0]
            
            return None
