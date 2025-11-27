"""
Shopify Connector - Integración completa con Shopify
"""
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
import hmac

from core.integrations.base_connector import BaseEcommerceConnector


class ShopifyConnector(BaseEcommerceConnector):
    """
    Conector para Shopify usando Admin REST API
    Docs: https://shopify.dev/api/admin-rest
    """
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        self.shop_url = config.get("shop_url")  # "mitienda.myshopify.com"
        self.access_token = config.get("access_token")  # "shpat_xxxxx"
        self.api_version = config.get("api_version", "2024-01")
        
        self.base_url = f"https://{self.shop_url}/admin/api/{self.api_version}"
        self.headers = {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json"
        }
    
    async def test_connection(self) -> bool:
        """
        Prueba conexión obteniendo info de la tienda
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/shop.json",
                    headers=self.headers,
                    timeout=10.0
                )
                return response.status_code == 200
        except Exception as e:
            print(f"Error testing Shopify connection: {e}")
            return False
    
    async def import_products(
        self,
        limit: int = 250,
        page: int = 1
    ) -> List[Dict]:
        """
        Importa productos desde Shopify
        
        Shopify limit máximo = 250 por página
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/products.json",
                headers=self.headers,
                params={"limit": min(limit, 250), "page": page},
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Shopify API error: {response.text}")
            
            data = response.json()
            products_raw = data.get("products", [])
            
            # Normalizar a formato Nexus
            return [self._normalize_product(p) for p in products_raw]
    
    async def import_product_by_id(self, external_id: str) -> Dict:
        """
        Importa producto específico
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/products/{external_id}.json",
                headers=self.headers,
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Product not found: {external_id}")
            
            data = response.json()
            return self._normalize_product(data["product"])
    
    async def update_stock(
        self,
        sku: str,
        quantity: int,
        location_id: Optional[str] = None
    ) -> bool:
        """
        Actualiza stock en Shopify
        
        Shopify usa inventory_item_id y location_id
        Primero buscar variant por SKU, luego actualizar inventory level
        """
        try:
            # 1. Buscar variant por SKU
            variant = await self._get_variant_by_sku(sku)
            if not variant:
                raise Exception(f"Variant with SKU {sku} not found in Shopify")
            
            inventory_item_id = variant.get("inventory_item_id")
            
            # 2. Si no hay location_id, usar la primera disponible
            if not location_id:
                locations = await self._get_locations()
                if not locations:
                    raise Exception("No locations found in Shopify")
                location_id = locations[0]["id"]
            
            # 3. Actualizar inventory level
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/inventory_levels/set.json",
                    headers=self.headers,
                    json={
                        "location_id": location_id,
                        "inventory_item_id": inventory_item_id,
                        "available": quantity
                    },
                    timeout=10.0
                )
                
                return response.status_code == 200
        
        except Exception as e:
            print(f"Error updating Shopify stock: {e}")
            return False
    
    async def get_stock(
        self,
        sku: str,
        location_id: Optional[str] = None
    ) -> int:
        """
        Obtiene stock actual de Shopify
        """
        variant = await self._get_variant_by_sku(sku)
        if not variant:
            return 0
        
        inventory_item_id = variant.get("inventory_item_id")
        
        async with httpx.AsyncClient() as client:
            params = {"inventory_item_ids": inventory_item_id}
            if location_id:
                params["location_ids"] = location_id
            
            response = await client.get(
                f"{self.base_url}/inventory_levels.json",
                headers=self.headers,
                params=params,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                levels = data.get("inventory_levels", [])
                if levels:
                    return levels[0].get("available", 0)
            
            return 0
    
    async def create_webhook(
        self,
        topic: str,
        callback_url: str
    ) -> Dict:
        """
        Crea webhook en Shopify
        
        Topics disponibles:
        - products/create, products/update, products/delete
        - inventory_levels/update
        - orders/create
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/webhooks.json",
                headers=self.headers,
                json={
                    "webhook": {
                        "topic": topic,
                        "address": callback_url,
                        "format": "json"
                    }
                },
                timeout=10.0
            )
            
            if response.status_code == 201:
                data = response.json()
                webhook = data["webhook"]
                return {
                    "id": str(webhook["id"]),
                    "topic": webhook["topic"],
                    "address": webhook["address"]
                }
            
            raise Exception(f"Failed to create webhook: {response.text}")
    
    async def delete_webhook(self, webhook_id: str) -> bool:
        """
        Elimina webhook
        """
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/webhooks/{webhook_id}.json",
                headers=self.headers,
                timeout=10.0
            )
            return response.status_code == 200
    
    async def list_webhooks(self) -> List[Dict]:
        """
        Lista webhooks configurados
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/webhooks.json",
                headers=self.headers,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                webhooks = data.get("webhooks", [])
                return [
                    {
                        "id": str(w["id"]),
                        "topic": w["topic"],
                        "address": w["address"],
                        "created_at": w["created_at"]
                    }
                    for w in webhooks
                ]
            
            return []
    
    def _normalize_product(self, shopify_product: Dict) -> Dict:
        """
        Normaliza producto de Shopify a formato Nexus
        """
        variants = []
        
        for variant in shopify_product.get("variants", []):
            # Extraer talle y color de options
            size = variant.get("option1")  # Asumimos option1 = talle
            color = variant.get("option2")  # option2 = color
            
            variants.append({
                "external_id": str(variant["id"]),
                "sku": variant.get("sku", ""),
                "size": size,
                "color": color,
                "price": float(variant.get("price", 0)),
                "barcode": variant.get("barcode"),
                "stock": variant.get("inventory_quantity", 0),
                "image_url": variant.get("image_url")
            })
        
        # Imagen principal
        image_url = None
        if shopify_product.get("images"):
            image_url = shopify_product["images"][0].get("src")
        
        return {
            "external_id": str(shopify_product["id"]),
            "name": shopify_product["title"],
            "base_sku": shopify_product.get("handle", ""),
            "description": shopify_product.get("body_html", ""),
            "category": shopify_product.get("product_type", ""),
            "vendor": shopify_product.get("vendor"),
            "tags": shopify_product.get("tags", "").split(","),
            "image_url": image_url,
            "variants": variants
        }
    
    async def _get_variant_by_sku(self, sku: str) -> Optional[Dict]:
        """
        Busca variant por SKU
        """
        async with httpx.AsyncClient() as client:
            # Shopify no permite buscar directamente por SKU
            # Hay que iterar productos o usar GraphQL
            # Por ahora implementación simple
            response = await client.get(
                f"{self.base_url}/products.json",
                headers=self.headers,
                params={"limit": 250},
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                for product in data.get("products", []):
                    for variant in product.get("variants", []):
                        if variant.get("sku") == sku:
                            return variant
            
            return None
    
    async def _get_locations(self) -> List[Dict]:
        """
        Obtiene locations de Shopify
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/locations.json",
                headers=self.headers,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("locations", [])
            
            return []
    
    @staticmethod
    def validate_webhook_signature(
        body: bytes,
        hmac_header: str,
        secret: str
    ) -> bool:
        """
        Valida firma HMAC de webhook Shopify
        
        Args:
            body: Request body raw
            hmac_header: Header X-Shopify-Hmac-SHA256
            secret: Shopify API secret key
        """
        computed_hmac = hmac.new(
            secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(computed_hmac, hmac_header)
