"""
Base Connector - Interfaz para todos los conectores e-commerce
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime


class BaseEcommerceConnector(ABC):
    """
    Interfaz base para conectores de e-commerce
    
    Cada plataforma (Shopify, WooCommerce, etc) implementa estos métodos
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Inicializa conector con credenciales
        
        Args:
            config: Credenciales desencriptadas de la plataforma
        """
        self.config = config
    
    @abstractmethod
    async def test_connection(self) -> bool:
        """
        Prueba que las credenciales funcionen
        
        Returns:
            True si conecta exitosamente
        """
        pass
    
    @abstractmethod
    async def import_products(
        self,
        limit: int = 100,
        page: int = 1
    ) -> List[Dict]:
        """
        Importa productos desde la plataforma
        
        Returns:
            Lista de productos en formato normalizado Nexus
        """
        pass
    
    @abstractmethod
    async def import_product_by_id(
        self,
        external_id: str
    ) -> Dict:
        """
        Importa un producto específico
        """
        pass
    
    @abstractmethod
    async def update_stock(
        self,
        sku: str,
        quantity: int,
        location_id: Optional[str] = None
    ) -> bool:
        """
        Actualiza stock en la plataforma
        
        Args:
            sku: SKU del producto
            quantity: Nueva cantidad
            location_id: ID de ubicación en plataforma (si aplica)
        
        Returns:
            True si actualiza exitosamente
        """
        pass
    
    @abstractmethod
    async def get_stock(
        self,
        sku: str,
        location_id: Optional[str] = None
    ) -> int:
        """
        Obtiene stock actual de la plataforma
        """
        pass
    
    @abstractmethod
    async def create_webhook(
        self,
        topic: str,
        callback_url: str
    ) -> Dict:
        """
        Crea un webhook en la plataforma
        
        Args:
            topic: Evento a escuchar (products/create, inventory/update)
            callback_url: URL de Nexus para recibir webhook
        
        Returns:
            {"id": "webhook_id", "topic": "...", "address": "..."}
        """
        pass
    
    @abstractmethod
    async def delete_webhook(
        self,
        webhook_id: str
    ) -> bool:
        """
        Elimina un webhook
        """
        pass
    
    @abstractmethod
    async def list_webhooks(self) -> List[Dict]:
        """
        Lista webhooks configurados
        """
        pass
    
    # Métodos opcionales (pueden no estar implementados en todas las plataformas)
    
    async def create_product(self, product_data: Dict) -> Dict:
        """
        Crea producto en plataforma (opcional)
        """
        raise NotImplementedError("Esta plataforma no soporta crear productos via API")
    
    async def update_product(self, external_id: str, product_data: Dict) -> Dict:
        """
        Actualiza producto en plataforma (opcional)
        """
        raise NotImplementedError("Esta plataforma no soporta actualizar productos via API")
    
    async def import_orders(
        self,
        since: Optional[datetime] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Importa órdenes desde plataforma (opcional)
        """
        raise NotImplementedError("Esta plataforma no soporta importar órdenes")
    
    def _normalize_product(self, raw_product: Dict) -> Dict:
        """
        Normaliza producto de formato plataforma → formato Nexus
        
        Formato Nexus:
        {
            "external_id": "123",
            "name": "Remera Básica",
            "base_sku": "REM-001",
            "description": "...",
            "category": "remeras",
            "variants": [
                {
                    "external_id": "456",
                    "sku": "REM-001-ROJO-M",
                    "size": "M",
                    "color": "Rojo",
                    "price": 12990,
                    "barcode": "7791234567890",
                    "stock": 50,
                    "image_url": "https://..."
                }
            ]
        }
        """
        raise NotImplementedError("Debe implementarse en cada conector")
