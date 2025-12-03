"""
Servicio de Integración OAuth 2.0 con Shopify

Flujo OAuth:
1. Cliente navega a /integrations/shopify/install
2. Redirige a Shopify con client_id, redirect_uri, scopes
3. Usuario autoriza en Shopify
4. Shopify redirige a /integrations/shopify/callback?code=...
5. Intercambiamos code por access_token
6. Guardamos token en integraciones_ecommerce
7. Registramos webhooks automáticamente

Referencias:
- https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
"""

import hmac
import hashlib
import httpx
from typing import Optional, Dict, Any, List
from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from core.config import settings
from core.db import get_session
import logging

logger = logging.getLogger(__name__)


class ShopifyOAuthService:
    """
    Gestiona OAuth 2.0 con Shopify
    
    Variables de entorno requeridas:
    - SHOPIFY_CLIENT_ID
    - SHOPIFY_CLIENT_SECRET
    - SHOPIFY_REDIRECT_URI (ej: https://tu-dominio.com/integrations/shopify/callback)
    """
    
    # Scopes necesarios para POS de ropa
    REQUIRED_SCOPES = [
        "read_products",
        "write_products",
        "read_inventory",
        "write_inventory",
        "read_orders",
        "write_orders",
        "read_customers",
        "write_customers",
        "read_price_rules",   # Para sincronizar descuentos
        "read_locations"      # Para sincronizar locales
    ]
    
    # Webhooks a registrar automáticamente
    WEBHOOK_TOPICS = [
        "products/create",
        "products/update",
        "products/delete",
        "inventory_levels/update",
        "orders/create",
        "orders/updated",
        "orders/cancelled",
        "customers/create",
        "customers/update"
    ]
    
    @classmethod
    def get_install_url(cls, shop_domain: str, tienda_id: UUID, nonce: str) -> str:
        """
        Genera URL de instalación para OAuth de Shopify
        
        Args:
            shop_domain: Dominio de la tienda Shopify (ej: mi-tienda.myshopify.com)
            tienda_id: ID de la tienda en nuestra BD
            nonce: Token aleatorio para prevenir CSRF
            
        Returns:
            URL para redirigir al usuario
        """
        scopes = ",".join(cls.REQUIRED_SCOPES)
        state = f"{tienda_id}:{nonce}"  # Embebemos tienda_id en state
        
        # Normalizar dominio
        if not shop_domain.endswith('.myshopify.com'):
            shop_domain = f"{shop_domain}.myshopify.com"
        
        params = {
            "client_id": settings.SHOPIFY_CLIENT_ID,
            "scope": scopes,
            "redirect_uri": settings.SHOPIFY_REDIRECT_URI,
            "state": state,
            "grant_options[]": "per-user"  # Token por usuario, no por app
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        install_url = f"https://{shop_domain}/admin/oauth/authorize?{query_string}"
        
        logger.info(f"[SHOPIFY_OAUTH] Install URL generada para {shop_domain} (tienda_id={tienda_id})")
        return install_url
    
    @classmethod
    async def exchange_code_for_token(
        cls, 
        shop_domain: str, 
        code: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Intercambia authorization code por access token
        
        Args:
            shop_domain: Dominio de la tienda Shopify
            code: Authorization code de callback
            db: Sesión de base de datos
            
        Returns:
            Dict con access_token, scope, associated_user, etc.
            
        Raises:
            httpx.HTTPStatusError: Si Shopify rechaza el request
        """
        token_url = f"https://{shop_domain}/admin/oauth/access_token"
        
        payload = {
            "client_id": settings.SHOPIFY_CLIENT_ID,
            "client_secret": settings.SHOPIFY_CLIENT_SECRET,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, json=payload)
            response.raise_for_status()
            token_data = response.json()
        
        logger.info(f"[SHOPIFY_OAUTH] Token obtenido para {shop_domain}: scopes={token_data.get('scope')}")
        return token_data
    
    @classmethod
    def verify_hmac(cls, params: Dict[str, str]) -> bool:
        """
        Verifica HMAC signature de Shopify para prevenir ataques
        
        Shopify incluye &hmac=... en el callback. Debemos verificar que sea válido.
        
        Args:
            params: Query params del callback
            
        Returns:
            True si HMAC es válido
        """
        received_hmac = params.get("hmac", "")
        params_copy = {k: v for k, v in params.items() if k != "hmac"}
        
        # Ordenar alfabéticamente y construir query string
        sorted_params = sorted(params_copy.items())
        param_string = "&".join([f"{k}={v}" for k, v in sorted_params])
        
        # Calcular HMAC
        calculated_hmac = hmac.new(
            settings.SHOPIFY_CLIENT_SECRET.encode('utf-8'),
            param_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        is_valid = hmac.compare_digest(calculated_hmac, received_hmac)
        
        if not is_valid:
            logger.warning(f"[SHOPIFY_OAUTH] HMAC inválido. Calculado={calculated_hmac}, Recibido={received_hmac}")
        
        return is_valid
    
    @classmethod
    async def register_webhooks(
        cls,
        shop_domain: str,
        access_token: str,
        webhook_base_url: str
    ) -> List[Dict[str, Any]]:
        """
        Registra webhooks en Shopify automáticamente
        
        Args:
            shop_domain: Dominio de Shopify
            access_token: Token de acceso OAuth
            webhook_base_url: URL base donde Shopify enviará webhooks (ej: https://tu-dominio.com/webhooks/shopify)
            
        Returns:
            Lista de webhooks creados
        """
        headers = {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json"
        }
        
        created_webhooks = []
        
        async with httpx.AsyncClient() as client:
            for topic in cls.WEBHOOK_TOPICS:
                webhook_payload = {
                    "webhook": {
                        "topic": topic,
                        "address": f"{webhook_base_url}/{topic.replace('/', '_')}",
                        "format": "json"
                    }
                }
                
                try:
                    response = await client.post(
                        f"https://{shop_domain}/admin/api/2024-10/webhooks.json",
                        headers=headers,
                        json=webhook_payload,
                        timeout=10.0
                    )
                    response.raise_for_status()
                    webhook_data = response.json()
                    created_webhooks.append(webhook_data["webhook"])
                    logger.info(f"[SHOPIFY_OAUTH] Webhook registrado: {topic} → {webhook_data['webhook']['id']}")
                
                except httpx.HTTPStatusError as e:
                    logger.error(f"[SHOPIFY_OAUTH] Error registrando webhook {topic}: {e.response.text}")
        
        return created_webhooks
    
    @classmethod
    async def verify_webhook_signature(cls, body: bytes, hmac_header: str) -> bool:
        """
        Verifica firma HMAC de webhooks entrantes de Shopify
        
        Args:
            body: Body crudo del request (bytes)
            hmac_header: Valor del header X-Shopify-Hmac-SHA256
            
        Returns:
            True si la firma es válida
        """
        calculated_hmac = hmac.new(
            settings.SHOPIFY_CLIENT_SECRET.encode('utf-8'),
            body,
            hashlib.sha256
        ).digest()
        
        import base64
        calculated_hmac_b64 = base64.b64encode(calculated_hmac).decode('utf-8')
        
        is_valid = hmac.compare_digest(calculated_hmac_b64, hmac_header)
        
        if not is_valid:
            logger.warning(f"[SHOPIFY_WEBHOOK] Firma inválida. Calculado={calculated_hmac_b64}, Recibido={hmac_header}")
        
        return is_valid
