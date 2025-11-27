"""
Webhooks Routes - Sistema de webhooks bidireccional
"""
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from schemas_models.ecommerce_models import IntegracionEcommerce, PlataformaEcommerce
from services.integration_service import IntegrationService


router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/{platform}/{tienda_id}")
async def receive_webhook(
    platform: PlataformaEcommerce,
    tienda_id: UUID,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    📨 Endpoint universal para recibir webhooks de e-commerce
    
    URLs:
    - POST /webhooks/shopify/{tienda_id}
    - POST /webhooks/woocommerce/{tienda_id}
    - POST /webhooks/tiendanube/{tienda_id}
    
    El sistema:
    1. Valida signature según plataforma
    2. Parsea payload
    3. Encola en RabbitMQ para procesamiento async
    4. Responde 200 OK inmediatamente
    """
    import json
    
    # Leer body raw
    body = await request.body()
    headers = dict(request.headers)
    
    # Validar signature según plataforma
    valid = await validate_webhook_signature(
        platform=platform,
        body=body,
        headers=headers,
        tienda_id=tienda_id,
        session=session
    )
    
    if not valid:
        raise HTTPException(401, "Invalid webhook signature")
    
    # Parsear payload
    try:
        payload = json.loads(body.decode())
    except:
        raise HTTPException(400, "Invalid JSON payload")
    
    # Determinar topic/evento
    topic = get_webhook_topic(platform, headers, payload)
    
    # TODO: Encolar en RabbitMQ
    # await rabbitmq.publish({
    #     "type": f"webhook.{platform}",
    #     "tienda_id": str(tienda_id),
    #     "topic": topic,
    #     "data": payload
    # })
    
    print(f"✓ Webhook recibido: {platform} - {topic}")
    
    return {"status": "accepted"}


async def validate_webhook_signature(
    platform: PlataformaEcommerce,
    body: bytes,
    headers: dict,
    tienda_id: UUID,
    session: AsyncSession
) -> bool:
    """
    Valida firma del webhook según plataforma
    """
    # Obtener integración para obtener secret
    result = await session.exec(
        select(IntegracionEcommerce)
        .where(
            and_(
                IntegracionEcommerce.tienda_id == tienda_id,
                IntegracionEcommerce.plataforma == platform,
                IntegracionEcommerce.is_active == True
            )
        )
    )
    integracion = result.first()
    
    if not integracion:
        return False
    
    # Desencriptar config
    integration_service = IntegrationService(session)
    config = integration_service.decrypt_config(integracion.config_encrypted)
    
    # Validar según plataforma
    if platform == PlataformaEcommerce.SHOPIFY:
        from core.integrations.shopify_connector import ShopifyConnector
        
        hmac_header = headers.get("x-shopify-hmac-sha256")
        api_secret = config.get("api_secret")  # Nota: diferente a access_token
        
        if not hmac_header or not api_secret:
            return False
        
        return ShopifyConnector.validate_webhook_signature(
            body=body,
            hmac_header=hmac_header,
            secret=api_secret
        )
    
    elif platform == PlataformaEcommerce.WOOCOMMERCE:
        # WooCommerce usa hash del webhook secret
        # TODO: Implementar validación
        return True
    
    return False


def get_webhook_topic(
    platform: PlataformaEcommerce,
    headers: dict,
    payload: dict
) -> str:
    """
    Extrae el topic/evento del webhook
    """
    if platform == PlataformaEcommerce.SHOPIFY:
        return headers.get("x-shopify-topic", "unknown")
    
    elif platform == PlataformaEcommerce.WOOCOMMERCE:
        return headers.get("x-wc-webhook-topic", "unknown")
    
    return "unknown"


from sqlalchemy import and_
