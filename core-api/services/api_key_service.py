"""
Servicio de API Keys para Custom Ecommerce

Permite a tiendas generar API keys para integraciones personalizadas.
Ofrece endpoints públicos para:
- Consultar productos
- Verificar stock
- Recibir notificaciones via webhooks
"""

import secrets
import hmac
import hashlib
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from core.config import settings
import logging

logger = logging.getLogger(__name__)
from models import Tienda


class APIKeyService:
    """
    Gestión de API Keys para integraciones custom
    """
    
    API_KEY_PREFIX = "sk_live_"  # sk = secret key
    API_KEY_LENGTH = 48
    
    @classmethod
    def generate_api_key(cls) -> str:
        """
        Genera una API key segura
        
        Returns:
            String en formato: sk_live_<48 caracteres aleatorios>
        """
        random_part = secrets.token_urlsafe(cls.API_KEY_LENGTH)
        return f"{cls.API_KEY_PREFIX}{random_part}"
    
    @classmethod
    def generate_webhook_secret(cls) -> str:
        """
        Genera un secret para firmar webhooks
        
        Returns:
            String de 64 caracteres
        """
        return secrets.token_urlsafe(64)
    
    @classmethod
    async def create_api_key(
        cls,
        tienda_id: UUID,
        description: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Crea una nueva API key para una tienda
        
        Args:
            tienda_id: ID de la tienda
            description: Descripción del uso (ej: "Integración WooCommerce")
            db: Sesión de base de datos
            
        Returns:
            Dict con api_key, tienda_id, created_at
        """
        from schemas_models.ecommerce_models import IntegracionEcommerce, PlataformaEcommerce
        
        # Verificar que la tienda existe
        stmt = select(Tienda).where(Tienda.id == tienda_id)
        result = await db.execute(stmt)
        tienda = result.scalar_one_or_none()
        
        if not tienda:
            raise ValueError(f"Tienda {tienda_id} no encontrada")
        
        api_key = cls.generate_api_key()
        
        # Crear integración de tipo CUSTOM
        integracion = IntegracionEcommerce(
            id=uuid4(),
            tienda_id=tienda_id,
            plataforma=PlataformaEcommerce.CUSTOM,
            nombre_tienda=f"API Key - {description}",
            api_key=api_key,
            activo=True,
            config={"description": description},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add(integracion)
        await db.commit()
        await db.refresh(integracion)
        
        logger.info(f"[API_KEY] Creada API key para tienda {tienda_id}: {description}")
        
        return {
            "api_key": api_key,
            "tienda_id": str(tienda_id),
            "description": description,
            "created_at": integracion.created_at.isoformat()
        }
    
    @classmethod
    async def validate_api_key(
        cls,
        api_key: str,
        db: AsyncSession
    ) -> Optional[UUID]:
        """
        Valida una API key y retorna el tienda_id si es válida
        
        Args:
            api_key: API key a validar
            db: Sesión de base de datos
            
        Returns:
            tienda_id si es válida, None si no
        """
        from schemas_models.ecommerce_models import IntegracionEcommerce
        
        if not api_key.startswith(cls.API_KEY_PREFIX):
            return None
        
        stmt = select(IntegracionEcommerce).where(
            IntegracionEcommerce.api_key == api_key,
            IntegracionEcommerce.activo == True
        )
        result = await db.execute(stmt)
        integracion = result.scalar_one_or_none()
        
        if not integracion:
            logger.warning(f"[API_KEY] API key inválida o inactiva: {api_key[:20]}...")
            return None
        
        # Actualizar última utilización
        integracion.updated_at = datetime.now(timezone.utc)
        await db.commit()
        
        return integracion.tienda_id
    
    @classmethod
    def sign_webhook_payload(cls, payload: bytes, secret: str) -> str:
        """
        Firma un payload de webhook con HMAC-SHA256
        
        Args:
            payload: Body del webhook (bytes)
            secret: Secret compartido
            
        Returns:
            Signature en hexadecimal
        """
        signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    @classmethod
    def verify_webhook_signature(cls, payload: bytes, signature: str, secret: str) -> bool:
        """
        Verifica firma de webhook entrante
        
        Args:
            payload: Body del webhook (bytes)
            signature: Firma recibida
            secret: Secret compartido
            
        Returns:
            True si la firma es válida
        """
        expected_signature = cls.sign_webhook_payload(payload, secret)
        is_valid = hmac.compare_digest(expected_signature, signature)
        
        if not is_valid:
            logger.warning(f"[WEBHOOK] Firma inválida. Esperado={expected_signature[:16]}..., Recibido={signature[:16]}...")
        
        return is_valid
    
    @classmethod
    async def register_webhook(
        cls,
        tienda_id: UUID,
        url: str,
        events: list[str],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Registra un webhook para recibir notificaciones
        
        Args:
            tienda_id: ID de la tienda
            url: URL donde enviar webhooks
            events: Lista de eventos a suscribirse (ej: ["product.created", "stock.updated"])
            db: Sesión de base de datos
            
        Returns:
            Dict con webhook_id, secret, events
        """
        from schemas_models.retail_models import Webhook
        
        secret = cls.generate_webhook_secret()
        
        webhook = Webhook(
            id=uuid4(),
            tienda_id=tienda_id,
            url=url,
            events=events,
            secret=secret,
            is_active=True,
            trigger_count=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add(webhook)
        await db.commit()
        await db.refresh(webhook)
        
        logger.info(f"[WEBHOOK] Registrado webhook para tienda {tienda_id}: {url} → {events}")
        
        return {
            "webhook_id": str(webhook.id),
            "secret": secret,
            "url": url,
            "events": events
        }
    
    @classmethod
    async def trigger_webhook(
        cls,
        tienda_id: UUID,
        event: str,
        payload: Dict[str, Any],
        db: AsyncSession
    ) -> int:
        """
        Dispara webhooks registrados para un evento
        
        Args:
            tienda_id: ID de la tienda
            event: Nombre del evento (ej: "product.created")
            payload: Datos a enviar
            db: Sesión de base de datos
            
        Returns:
            Cantidad de webhooks disparados
        """
        from schemas_models.retail_models import Webhook
        import httpx
        import json
        
        # Buscar webhooks activos que escuchen este evento
        stmt = select(Webhook).where(
            Webhook.tienda_id == tienda_id,
            Webhook.is_active == True
        )
        result = await db.execute(stmt)
        webhooks = result.scalars().all()
        
        triggered_count = 0
        
        for webhook in webhooks:
            # Verificar si el webhook está suscrito a este evento
            if event not in webhook.events:
                continue
            
            # Preparar payload
            webhook_payload = {
                "event": event,
                "tienda_id": str(tienda_id),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": payload
            }
            
            body_bytes = json.dumps(webhook_payload).encode('utf-8')
            signature = cls.sign_webhook_payload(body_bytes, webhook.secret)
            
            headers = {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature,
                "X-Webhook-Event": event
            }
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        webhook.url,
                        content=body_bytes,
                        headers=headers,
                        timeout=10.0
                    )
                    
                    webhook.last_triggered = datetime.now(timezone.utc)
                    webhook.trigger_count += 1
                    
                    if response.status_code >= 400:
                        webhook.last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                        logger.error(f"[WEBHOOK] Error enviando a {webhook.url}: {webhook.last_error}")
                    else:
                        webhook.last_error = None
                        triggered_count += 1
                        logger.info(f"[WEBHOOK] Enviado a {webhook.url}: {event}")
            
            except Exception as e:
                webhook.last_error = str(e)[:500]
                logger.error(f"[WEBHOOK] Excepción enviando a {webhook.url}: {e}")
        
        await db.commit()
        
        return triggered_count
