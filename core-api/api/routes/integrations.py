"""
Rutas de API para Integraciones de Ecommerce

Incluye:
- OAuth 2.0 con Shopify
- API Keys para custom ecommerce
- Webhooks entrantes de Shopify
- Endpoints públicos para integraciones custom
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Header, status
from fastapi.responses import RedirectResponse, JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone

from core.db import get_session
from api.deps import get_current_user_id
import logging

logger = logging.getLogger(__name__)
from services.shopify_oauth_service import ShopifyOAuthService
from services.api_key_service import APIKeyService
from models import Tienda, User
from schemas_models.ecommerce_models import IntegracionEcommerce, PlataformaEcommerce


router = APIRouter(prefix="/integrations", tags=["Integraciones Ecommerce"])


# ============================================================================
# SHOPIFY OAUTH 2.0
# ============================================================================

@router.get("/shopify/install")
async def shopify_install(
    shop: str = Query(..., description="Dominio de Shopify (ej: mi-tienda.myshopify.com)"),
    tienda_id: UUID = Query(..., description="ID de la tienda a conectar"),
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    PASO 1: Inicia flujo OAuth de Shopify
    
    Redirige al usuario a Shopify para autorizar la app.
    
    Query Params:
    - shop: Dominio de la tienda Shopify
    - tienda_id: ID de la tienda en nuestra BD
    
    Returns:
    - Redirect a Shopify OAuth
    """
    # Verificar que la tienda pertenece al usuario
    stmt = select(Tienda).where(Tienda.id == tienda_id)
    result = await db.execute(stmt)
    tienda = result.scalar_one_or_none()
    
    if not tienda:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    
    # TODO: Verificar que user_id tiene permisos sobre tienda_id
    
    # Generar nonce para prevenir CSRF
    import secrets
    nonce = secrets.token_urlsafe(32)
    
    # Guardar nonce en sesión/cache (Redis recomendado)
    # Por ahora lo omitimos, pero en producción usar:
    # await redis.setex(f"shopify_nonce:{tienda_id}", 300, nonce)
    
    install_url = ShopifyOAuthService.get_install_url(shop, tienda_id, nonce)
    
    return RedirectResponse(url=install_url, status_code=status.HTTP_302_FOUND)


@router.get("/shopify/callback")
async def shopify_callback(
    code: str = Query(..., description="Authorization code de Shopify"),
    shop: str = Query(..., description="Dominio de Shopify"),
    state: str = Query(..., description="State con tienda_id:nonce"),
    hmac: str = Query(..., description="HMAC signature de Shopify"),
    db: AsyncSession = Depends(get_session)
):
    """
    PASO 2: Callback de OAuth de Shopify
    
    Shopify redirige aquí después de que el usuario autoriza.
    Intercambiamos el code por un access_token.
    
    Query Params (enviados por Shopify):
    - code: Authorization code
    - shop: Dominio de Shopify
    - state: tienda_id:nonce
    - hmac: Firma HMAC
    
    Returns:
    - Redirect a dashboard con mensaje de éxito
    """
    # Verificar HMAC para prevenir ataques
    params = {"code": code, "shop": shop, "state": state}
    if not ShopifyOAuthService.verify_hmac(params):
        raise HTTPException(status_code=400, detail="HMAC signature inválida")
    
    # Extraer tienda_id del state
    try:
        tienda_id_str, nonce = state.split(":", 1)
        tienda_id = UUID(tienda_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="State inválido")
    
    # TODO: Verificar nonce contra Redis
    # nonce_stored = await redis.get(f"shopify_nonce:{tienda_id}")
    # if not nonce_stored or nonce_stored != nonce:
    #     raise HTTPException(status_code=400, detail="Nonce inválido o expirado")
    
    # Intercambiar code por token
    try:
        token_data = await ShopifyOAuthService.exchange_code_for_token(shop, code, db)
    except Exception as e:
        logger.error(f"[SHOPIFY_OAUTH] Error intercambiando code: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo token de Shopify")
    
    access_token = token_data.get("access_token")
    scopes = token_data.get("scope", "")
    
    # Guardar integración en BD
    integracion = IntegracionEcommerce(
        id=uuid4(),
        tienda_id=tienda_id,
        plataforma=PlataformaEcommerce.SHOPIFY,
        nombre_tienda=shop,
        api_key=access_token,
        activo=True,
        config={
            "shop_domain": shop,
            "scopes": scopes,
            "authorized_at": datetime.now(timezone.utc).isoformat()
        },
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    db.add(integracion)
    await db.commit()
    await db.refresh(integracion)
    
    # Registrar webhooks automáticamente
    webhook_base_url = f"{settings.BASE_URL}/integrations/shopify/webhooks"
    try:
        webhooks = await ShopifyOAuthService.register_webhooks(shop, access_token, webhook_base_url)
        logger.info(f"[SHOPIFY_OAUTH] Registrados {len(webhooks)} webhooks para {shop}")
    except Exception as e:
        logger.error(f"[SHOPIFY_OAUTH] Error registrando webhooks: {e}")
    
    # Redirigir a dashboard con mensaje de éxito
    redirect_url = f"{settings.FRONTEND_URL}/dashboard/integrations?success=shopify&shop={shop}"
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)


# ============================================================================
# SHOPIFY WEBHOOKS
# ============================================================================

@router.post("/shopify/webhooks/{topic}")
async def shopify_webhook_handler(
    topic: str,
    request: Request,
    x_shopify_hmac_sha256: str = Header(..., alias="X-Shopify-Hmac-SHA256"),
    x_shopify_shop_domain: str = Header(..., alias="X-Shopify-Shop-Domain"),
    db: AsyncSession = Depends(get_session)
):
    """
    Recibe webhooks de Shopify
    
    Headers:
    - X-Shopify-Hmac-SHA256: Firma HMAC
    - X-Shopify-Shop-Domain: Dominio de la tienda
    
    Body: JSON con datos del evento
    
    Returns:
    - 200 OK si se procesó exitosamente
    
    ⭐ NEW: Notifica via WebSocket a clientes conectados en tiempo real
    """
    body = await request.body()
    
    # Verificar firma HMAC
    if not ShopifyOAuthService.verify_webhook_signature(body, x_shopify_hmac_sha256):
        logger.warning(f"[SHOPIFY_WEBHOOK] Firma inválida para {topic} de {x_shopify_shop_domain}")
        raise HTTPException(status_code=401, detail="Firma HMAC inválida")
    
    # Parsear body
    import json
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="JSON inválido")
    
    # Buscar integración por shop_domain
    stmt = select(IntegracionEcommerce).where(
        IntegracionEcommerce.plataforma == PlataformaEcommerce.SHOPIFY,
        IntegracionEcommerce.nombre_tienda == x_shopify_shop_domain,
        IntegracionEcommerce.activo == True
    )
    result = await db.execute(stmt)
    integracion = result.scalar_one_or_none()
    
    if not integracion:
        logger.warning(f"[SHOPIFY_WEBHOOK] No se encontró integración activa para {x_shopify_shop_domain}")
        return JSONResponse(content={"status": "ignored"}, status_code=200)
    
    # Procesar webhook según topic
    logger.info(f"[SHOPIFY_WEBHOOK] Recibido {topic} de {x_shopify_shop_domain}")
    
    # ⭐ ENTERPRISE: Notificar via WebSocket en tiempo real
    from core.websockets import manager as ws_manager
    
    tienda_id = str(integracion.tienda_id)
    
    # Broadcast a todos los clientes conectados de esta tienda
    await ws_manager.send_to_tienda(
        tienda_id=tienda_id,
        message={
            "type": "new_order" if topic == "orders/create" else "webhook_received",
            "topic": topic,
            "shop_domain": x_shopify_shop_domain,
            "data": payload,
            "integration_id": str(integracion.id)
        }
    )
    
    logger.info(f"[WEBSOCKET] Notificación enviada a tienda_id={tienda_id} - topic={topic}")
    
    # TODO: Implementar lógica de procesamiento según topic
    # Ejemplo: products/create → crear producto en BD
    #         inventory_levels/update → actualizar stock
    #         orders/create → crear orden
    
    # Por ahora solo loguear
    logger.debug(f"[SHOPIFY_WEBHOOK] Payload: {payload}")
    
    return JSONResponse(content={"status": "processed"}, status_code=200)


# ============================================================================
# CUSTOM ECOMMERCE API KEYS
# ============================================================================

@router.post("/api-keys", status_code=status.HTTP_201_CREATED)
async def create_api_key(
    tienda_id: UUID,
    description: str,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    Genera una API key para integraciones custom
    
    Body:
    - tienda_id: ID de la tienda
    - description: Descripción del uso (ej: "WooCommerce Principal")
    
    Returns:
    - api_key: API key generada (¡guardarla, no se puede recuperar!)
    - created_at: Fecha de creación
    """
    # TODO: Verificar permisos del usuario sobre la tienda
    
    try:
        result = await APIKeyService.create_api_key(tienda_id, description, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/webhooks", status_code=status.HTTP_201_CREATED)
async def register_webhook(
    tienda_id: UUID,
    url: str,
    events: list[str],
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session)
):
    """
    Registra un webhook para recibir notificaciones
    
    Body:
    - tienda_id: ID de la tienda
    - url: URL donde enviar webhooks
    - events: Lista de eventos (ej: ["product.created", "stock.updated"])
    
    Returns:
    - webhook_id: ID del webhook
    - secret: Secret para verificar firmas (¡guardar!)
    """
    # TODO: Verificar permisos del usuario sobre la tienda
    
    result = await APIKeyService.register_webhook(tienda_id, url, events, db)
    return result


# ============================================================================
# ENDPOINTS PÚBLICOS (autenticados con API key)
# ============================================================================

async def verify_api_key_dependency(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = Depends(get_session)
) -> UUID:
    """
    Dependency que valida API key y retorna tienda_id
    """
    tienda_id = await APIKeyService.validate_api_key(x_api_key, db)
    if not tienda_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key inválida o inactiva"
        )
    return tienda_id


@router.get("/public/products")
async def public_get_products(
    tienda_id: UUID = Depends(verify_api_key_dependency),
    db: AsyncSession = Depends(get_session),
    limit: int = Query(100, le=500, description="Cantidad de productos a retornar"),
    offset: int = Query(0, ge=0, description="Offset para paginación")
):
    """
    Endpoint público para consultar productos
    
    Headers:
    - X-API-Key: API key de la tienda
    
    Query Params:
    - limit: Cantidad de productos (max 500)
    - offset: Offset para paginación
    
    Returns:
    - Lista de productos con variantes y stock
    """
    from models import Product, ProductVariant
    
    stmt = select(Product).where(Product.tienda_id == tienda_id).offset(offset).limit(limit)
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    # TODO: Incluir variantes y stock
    
    return {
        "tienda_id": str(tienda_id),
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "category_id": str(p.category_id) if p.category_id else None,
                "brand": p.brand,
                "season": p.season,
                "images": p.images,
                "tags": p.tags,
                "meta_title": p.meta_title,
                "meta_description": p.meta_description
            }
            for p in products
        ]
    }


@router.get("/public/stock/{product_variant_id}")
async def public_get_stock(
    product_variant_id: UUID,
    tienda_id: UUID = Depends(verify_api_key_dependency),
    db: AsyncSession = Depends(get_session)
):
    """
    Endpoint público para consultar stock de una variante
    
    Headers:
    - X-API-Key: API key de la tienda
    
    Path Params:
    - product_variant_id: ID de la variante
    
    Returns:
    - stock_actual: Stock disponible
    - updated_at: Última actualización
    """
    from models import InventoryLedger
    
    # Obtener último movimiento de stock
    stmt = (
        select(InventoryLedger)
        .where(
            InventoryLedger.tienda_id == tienda_id,
            InventoryLedger.product_variant_id == product_variant_id
        )
        .order_by(InventoryLedger.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    ledger = result.scalar_one_or_none()
    
    if not ledger:
        return {
            "product_variant_id": str(product_variant_id),
            "stock_actual": 0,
            "updated_at": None
        }
    
    return {
        "product_variant_id": str(product_variant_id),
        "stock_actual": ledger.stock_after,
        "updated_at": ledger.created_at.isoformat()
    }


# Importar settings al final para evitar circular import
from core.config import settings
