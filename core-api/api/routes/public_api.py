"""
API Pública para E-commerce Custom
Endpoints públicos con autenticación por API Key
"""
from typing import Annotated, List
from uuid import UUID
from fastapi import APIRouter, Header, HTTPException, Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import hashlib
import secrets

from core.db import get_session
from api.deps import CurrentTienda
from schemas_models.ecommerce_models import APIKey


router = APIRouter(prefix="/public", tags=["Public API"])


# =====================================================
# AUTH
# =====================================================

async def validate_api_key(
    x_api_key: Annotated[str, Header()],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> APIKey:
    """
    Valida API key y retorna la key entity
    """
    # Hash de la key
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    
    # Buscar en BD
    result = await session.exec(
        select(APIKey)
        .where(
            and_(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True
            )
        )
    )
    api_key = result.first()
    
    if not api_key:
        raise HTTPException(401, "API key inválida")
    
    # Verificar expiración
    if api_key.expires_at and api_key.expires_at < datetime.utcnow():
        raise HTTPException(401, "API key expirada")
    
    # Actualizar uso
    api_key.last_used = datetime.utcnow()
    api_key.uso_count += 1
    await session.commit()
    
    return api_key


# =====================================================
# SCHEMAS
# =====================================================

class ProductSyncRequest(BaseModel):
    """Request para sincronizar producto desde e-commerce"""
    external_id: str
    name: str
    base_sku: str
    description: Optional[str] = None
    category: Optional[str] = None
    variants: List[dict]


class StockUpdateRequest(BaseModel):
    """Request para actualizar stock"""
    sku: str
    stock: int


# =====================================================
# ENDPOINTS PÚBLICOS
# =====================================================

@router.post("/products/sync")
async def sync_product_from_ecommerce(
    product: ProductSyncRequest,
    api_key: Annotated[APIKey, Depends(validate_api_key)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    📥 Sincroniza producto desde e-commerce custom a Nexus POS
    
    **Requiere API Key con scope: products:write**
    
    Headers:
        X-API-Key: tu_api_key_generada
    
    Body:
    ```json
    {
      "external_id": "prod_12345",
      "name": "Remera Básica",
      "base_sku": "REM-001",
      "variants": [
        {
          "external_id": "var_678",
          "sku": "REM-001-ROJO-M",
          "size": "M",
          "color": "Rojo",
          "price": 12990,
          "stock": 50
        }
      ]
    }
    ```
    """
    # Verificar scope
    if "products:write" not in api_key.scopes:
        raise HTTPException(403, "API key no tiene permiso products:write")
    
    # TODO: Implementar creación/actualización de producto
    # Similar a integration_service._upsert_product
    
    return {
        "status": "synced",
        "product_id": "xxx",
        "variants_created": len(product.variants)
    }


@router.post("/stock/update")
async def update_stock_from_ecommerce(
    updates: List[StockUpdateRequest],
    api_key: Annotated[APIKey, Depends(validate_api_key)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    📊 Actualiza stock masivo desde e-commerce a Nexus POS
    
    **Requiere API Key con scope: stock:write**
    
    Body:
    ```json
    [
      {"sku": "REM-001-ROJO-M", "stock": 45},
      {"sku": "REM-001-AZUL-M", "stock": 30}
    ]
    ```
    """
    # Verificar scope
    if "stock:write" not in api_key.scopes:
        raise HTTPException(403, "API key no tiene permiso stock:write")
    
    # TODO: Implementar actualización de stock
    
    return {
        "updated": len(updates),
        "status": "success"
    }


@router.get("/products")
async def get_products_for_ecommerce(
    api_key: Annotated[APIKey, Depends(validate_api_key)],
    session: Annotated[AsyncSession, Depends(get_session)],
    updated_after: Optional[str] = None,
    limit: int = 100
):
    """
    📤 Obtiene productos actualizados desde Nexus POS
    
    **Requiere API Key con scope: products:read**
    
    Permite que e-commerce obtenga cambios desde POS
    
    Query params:
        updated_after: ISO datetime (2024-01-01T00:00:00)
        limit: Cantidad máxima (default 100)
    """
    # Verificar scope
    if "products:read" not in api_key.scopes:
        raise HTTPException(403, "API key no tiene permiso products:read")
    
    # TODO: Implementar listado de productos
    
    return {
        "products": [],
        "count": 0
    }


# =====================================================
# GESTIÓN DE API KEYS (Endpoints privados)
# =====================================================

@router.post("/api-keys", tags=["Admin - API Keys"])
async def create_api_key(
    nombre: str,
    scopes: List[str],
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    🔑 Genera nueva API key para integración custom
    
    **Solo admin puede crear keys**
    
    Scopes disponibles:
    - products:read - Leer productos
    - products:write - Crear/actualizar productos
    - stock:read - Leer stock
    - stock:write - Actualizar stock
    - orders:read - Leer ventas
    
    Returns:
        API Key (solo se muestra una vez)
    """
    # Generar key aleatoria
    key_raw = f"pos_live_{secrets.token_urlsafe(32)}"
    
    # Hashear para almacenar
    key_hash = hashlib.sha256(key_raw.encode()).hexdigest()
    key_prefix = key_raw[:12]  # Primeros 8 chars para identificar
    
    # Crear en BD
    api_key = APIKey(
        tienda_id=current_tienda.id,
        key_hash=key_hash,
        key_prefix=key_prefix,
        nombre=nombre,
        scopes=scopes
    )
    session.add(api_key)
    await session.commit()
    
    return {
        "api_key": key_raw,
        "prefix": key_prefix,
        "scopes": scopes,
        "message": "⚠️ Guarda esta key, no podrás verla nuevamente"
    }


@router.get("/api-keys", tags=["Admin - API Keys"])
async def list_api_keys(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    📋 Lista API keys de la tienda
    """
    result = await session.exec(
        select(APIKey)
        .where(APIKey.tienda_id == current_tienda.id)
        .order_by(APIKey.created_at.desc())
    )
    keys = result.all()
    
    return {
        "api_keys": [
            {
                "id": str(k.id),
                "nombre": k.nombre,
                "prefix": k.key_prefix,
                "scopes": k.scopes,
                "is_active": k.is_active,
                "last_used": k.last_used,
                "uso_count": k.uso_count,
                "created_at": k.created_at
            }
            for k in keys
        ]
    }


from datetime import datetime
from sqlalchemy import and_
from typing import Optional
