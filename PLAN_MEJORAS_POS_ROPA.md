# 📋 PLAN DE MEJORAS - POS ROPA (PyMES)
## Análisis y Roadmap de Transformación

---

## 📊 ANÁLISIS DEL ESTADO ACTUAL

### ✅ Fortalezas Identificadas

1. **Arquitectura Sólida**
   - Multi-tenant bien implementado con `tienda_id`
   - Sistema de Inventory Ledger append-only (moderno y escalable)
   - Separación de capas: API → Services → Models
   - Integración Redis + RabbitMQ para operaciones asíncronas

2. **Sistema de Inventario Avanzado**
   - Modelos `Product`, `ProductVariant`, `Size`, `Color` ya existen
   - Sistema de `InventoryLedger` transaccional (NUNCA se actualiza, solo inserta)
   - Soporte multi-ubicación (`Location`) para sucursales/depósitos
   - Stock calculado dinámicamente: `SUM(delta)` por variante y ubicación

3. **Seguridad Enterprise**
   - RBAC granular (`core/rbac.py`)
   - Middleware de auditoría (`AuditMiddleware`)
   - JWT + bcrypt para autenticación
   - Rate limiting y circuit breakers

4. **Integraciones E-commerce (Base Existente)**
   - Modelos `IntegracionEcommerce`, `ProductMapping`, `SyncLog`, `APIKey`
   - Conectores base: `ShopifyConnector`, `WooCommerceConnector`
   - Servicio `IntegrationService` con encriptación de credenciales

### ⚠️ Problemas Críticos Detectados

1. **Duplicación de Modelos de Inventario**
   - Conviven `Producto` (legacy con `stock_actual`) y `Product/ProductVariant` (nuevo)
   - Riesgo de divergencia y bugs si se usan ambos en paralelo
   - **DEBE RESOLVERSE**: migrar todo al sistema nuevo

2. **Web-Portal Innecesario**
   - Carpeta `web-portal` (Next.js) que debe eliminarse
   - El frontend principal está en `frontend/` (Vite + React + TypeScript)

3. **Tablas Innecesarias para POS de Ropa**
   - RFID: `RFIDTag`, `RFIDScanSession`, `RFIDReader`, `RFIDInventoryDiscrepancy`
   - OMS: `OrdenOmnicanal`, `ShippingZone`, `LocationCapability`
   - Loyalty: `CustomerWallet`, `WalletTransaction`, `GiftCard`, `LoyaltyProgram`
   - Promociones: `Promocion`, `PromocionUso`
   - AFIP/Facturación pesada (no necesaria para PyMES en fase inicial)

4. **Integración E-commerce Incompleta**
   - Conectores base existen pero no están completamente implementados
   - Falta sincronización bidireccional automática
   - No hay webhooks configurados
   - No hay autenticación OAuth (necesaria para Shopify)

5. **Lógica de Negocio en Controladores**
   - `ventas.procesar_venta()` es un God Method
   - `productos.crear_producto()` mezcla validaciones, DB y Redis
   - Falta capa de servicios de dominio consistente

---

## 🎯 OBJETIVOS DE LA TRANSFORMACIÓN

1. ✅ **Especializar el POS para Retail de Ropa (PyMES)**
2. ✅ **Eliminar complejidad innecesaria** (RFID, OMS, Loyalty complejo)
3. ✅ **Completar integración Shopify + E-commerce custom**
4. ✅ **Migración limpia de base de datos** (Supabase)
5. ✅ **Mejorar arquitectura de dominio** (extraer lógica de controladores)

---

## 📦 MÓDULOS DE MEJORA

### MÓDULO 1: LIMPIEZA Y PREPARACIÓN DEL PROYECTO

#### 1.1 Eliminar Web-Portal
**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 15 minutos

**Acciones:**
```bash
# Eliminar carpeta completa
Remove-Item -Recurse -Force web-portal

# Actualizar docker-compose.yml (comentar/eliminar servicio)
```

**Archivos afectados:**
- `web-portal/` (eliminar completamente)
- `docker-compose.yml` (eliminar servicio web-portal)

---

#### 1.2 Eliminar Modelos y Tablas Innecesarias
**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 2 horas

**Tablas a ELIMINAR:**

```python
# 1. RFID (no necesario para PyME de ropa)
- rfid_tags
- rfid_scan_sessions
- rfid_scan_items
- rfid_readers
- rfid_inventory_discrepancies

# 2. OMS Complejo (overkill para PyME)
- ordenes_omnicanal
- orden_items
- shipping_zones
- location_capabilities

# 3. Loyalty Avanzado (simplificar a CRM básico)
- customer_wallets
- wallet_transactions
- gift_cards
- gift_card_uso
- loyalty_programs

# 4. Promociones (fase 2, no crítico inicial)
- promociones
- promocion_uso

# 5. AFIP/Facturación (simplificar para PyME)
- facturas (mantener simplificada)
- caea_service.py (eliminar)
```

**Tablas a MANTENER y ADAPTAR:**

```python
# Core Multi-Tenant
✅ tiendas
✅ users

# CRM Básico
✅ clientes (simplificar: nombre, email, teléfono, documento, notas)

# Inventory Ledger (MODERNO)
✅ products
✅ product_variants
✅ sizes
✅ colors
✅ locations
✅ inventory_ledger

# Ventas
✅ ventas
✅ detalles_venta

# Proveedores
✅ proveedores
✅ ordenes_compra
✅ detalles_orden

# Caja
✅ sesiones_caja
✅ movimientos_caja

# E-commerce (EXPANDIR)
✅ integraciones_ecommerce
✅ product_mappings
✅ sync_logs
✅ api_keys

# Auditoría (Enterprise)
✅ audit_logs
✅ permission_audits

# Analytics
✅ insights
```

**Archivos a modificar:**
- `core-api/models.py` (eliminar imports y relaciones)
- `core-api/schemas_models/rfid_models.py` (ELIMINAR)
- `core-api/schemas_models/oms_models.py` (ELIMINAR)
- `core-api/schemas_models/loyalty_models.py` (ELIMINAR)
- `core-api/schemas_models/promo_models.py` (ELIMINAR)
- `core-api/services/rfid_service.py` (ELIMINAR)
- `core-api/services/oms_service.py` (ELIMINAR)
- `core-api/services/loyalty_service.py` (ELIMINAR)
- `core-api/services/promo_service.py` (ELIMINAR)
- `core-api/services/caea_service.py` (ELIMINAR)
- `core-api/api/routes/oms.py` (ELIMINAR)
- `core-api/api/routes/webhooks.py` (ADAPTAR solo para e-commerce)

---

#### 1.3 Deprecar Modelo Legacy de Productos
**Prioridad:** 🟠 ALTA  
**Tiempo estimado:** 3 horas

**Problema:**
- Conviven `Producto` (con `stock_actual`) y `Product/ProductVariant` (nuevo)
- Riesgo de usar ambos en paralelo

**Solución:**
```python
# 1. Marcar Producto como deprecated
class ProductoLegacy(SQLModel, table=True):
    """
    ⚠️ DEPRECATED - Usar Product + ProductVariant
    Mantenido solo para migración histórica
    """
    __tablename__ = "productos_legacy"
    # ... campos existentes
    
    is_migrated: bool = False
    migrated_to_product_id: Optional[UUID] = None

# 2. Renombrar tabla actual
# Alembic migration:
# ALTER TABLE productos RENAME TO productos_legacy;

# 3. Crear endpoint de migración
POST /api/v1/admin/migrate-products
# Migra productos legacy → Product + ProductVariant
```

**Script de migración:**
```python
# scripts/migrate_legacy_products.py
async def migrate_producto_to_variant():
    """
    Migra Producto legacy → Product + ProductVariant
    """
    # 1. Por cada Producto:
    #    - Crear Product (padre)
    #    - Crear ProductVariant (con atributos JSONB → size/color)
    #    - Crear registro inicial en InventoryLedger
    # 2. Marcar is_migrated = True
```

---

### MÓDULO 2: ADAPTACIÓN PARA RETAIL DE ROPA

#### 2.1 Enriquecer Modelo de Productos para Ropa
**Prioridad:** 🟡 MEDIA  
**Tiempo estimado:** 4 horas

**Mejoras al modelo actual:**

```python
# 1. Agregar campos a Product
class Product(SQLModel, table=True):
    # ... campos existentes
    
    # Nuevos campos específicos de ropa
    season: Optional[str] = Field(default=None)  # "Verano 2025", "Invierno 2024"
    brand: Optional[str] = Field(default=None)  # "Nike", "Adidas"
    material: Optional[str] = Field(default=None)  # "Algodón 100%"
    care_instructions: Optional[str] = Field(default=None)  # "Lavar a mano"
    country_of_origin: Optional[str] = Field(default=None)
    
    # Imágenes (JSON array)
    images: Optional[List[str]] = Field(default=None, sa_column=Column(JSONB))
    
    # SEO para e-commerce
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = Field(default=None, sa_column=Column(JSONB))

# 2. Extender Size con categorías
class Size(SQLModel, table=True):
    # ... campos existentes
    
    category: Optional[str] = Field(default=None)  # "numeric", "alpha", "shoe"
    # Ejemplo: Talle 42 (numeric) vs L (alpha) vs 39 (shoe)

# 3. Mejorar Color con HEX
class Color(SQLModel, table=True):
    # Ya tiene hex_code ✅
    
    # Agregar imagen de muestra
    sample_image_url: Optional[str] = None

# 4. Categorías de Productos (nueva tabla)
class ProductCategory(SQLModel, table=True):
    """Categorías jerárquicas de productos"""
    __tablename__ = "product_categories"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tienda_id: UUID = Field(foreign_key="tiendas.id", index=True)
    
    name: str  # "Remeras", "Pantalones", "Calzado"
    slug: str  # "remeras", "pantalones"
    parent_id: Optional[UUID] = None  # Para jerarquía
    sort_order: int = 0
    
    # Metadata
    description: Optional[str] = None
    image_url: Optional[str] = None
```

**Endpoints nuevos:**
```
GET    /api/v1/productos/categories
POST   /api/v1/productos/categories
PATCH  /api/v1/productos/categories/{id}
DELETE /api/v1/productos/categories/{id}
```

---

#### 2.2 Sistema de Códigos de Barras y SKUs Automáticos
**Prioridad:** 🟡 MEDIA  
**Tiempo estimado:** 3 horas

**Funcionalidad:**

```python
# utils/sku_generator.py
class SKUGenerator:
    """
    Genera SKUs automáticos para variantes
    
    Formato: {BASE}-{COLOR}-{SIZE}
    Ejemplo: REM001-ROJO-M
    """
    
    @staticmethod
    def generate_variant_sku(
        base_sku: str,
        color: Optional[Color],
        size: Optional[Size]
    ) -> str:
        parts = [base_sku]
        
        if color:
            # Normalizar color: "Rojo Intenso" → "ROJO"
            color_code = color.name.upper().split()[0][:4]
            parts.append(color_code)
        
        if size:
            size_code = size.name.upper()
            parts.append(size_code)
        
        return "-".join(parts)
    
    @staticmethod
    def generate_ean13(variant_id: UUID) -> str:
        """
        Genera EAN-13 válido a partir de variant_id
        
        Formato: 779{tienda_code}{variant_seq}{check_digit}
        """
        # Implementar algoritmo EAN-13 checksum
        pass

# Integrar en creación de variantes
async def create_variant(...):
    # Auto-generar SKU si no se proporciona
    if not variant.sku:
        variant.sku = SKUGenerator.generate_variant_sku(
            product.base_sku,
            variant.color,
            variant.size
        )
    
    # Auto-generar barcode si no existe
    if not variant.barcode:
        variant.barcode = SKUGenerator.generate_ean13(variant.variant_id)
```

---

#### 2.3 Reportes Específicos de Retail de Ropa
**Prioridad:** 🟢 BAJA  
**Tiempo estimado:** 4 horas

**Nuevos endpoints:**

```python
# Análisis de ventas por categoría/talle/color
GET /api/v1/reportes/ventas-por-talle
GET /api/v1/reportes/ventas-por-color
GET /api/v1/reportes/ventas-por-temporada

# Rotación de inventario
GET /api/v1/reportes/rotacion-stock
# Productos con más de 90 días sin vender

# Talles/colores más vendidos por producto
GET /api/v1/reportes/productos/{product_id}/performance-variantes

# Alertas inteligentes
GET /api/v1/insights/stock-critico-por-talle
# "Talle M de Remera Básica con solo 2 unidades"
```

---

### MÓDULO 3: INTEGRACIÓN SHOPIFY COMPLETA

#### 3.1 Implementar OAuth 2.0 para Shopify
**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 6 horas

**Problema actual:**
- `ShopifyConnector` existe pero asume credenciales manuales
- Shopify requiere OAuth para apps públicas

**Solución:**

```python
# api/routes/integrations.py
from shopify import Session, Shop
import shopify

@router.get("/integrations/shopify/install")
async def shopify_install(
    shop: str,  # mitienda.myshopify.com
    current_user: User = Depends(get_current_user)
):
    """
    Inicia OAuth flow de Shopify
    
    1. Genera authorization URL
    2. Redirige al usuario a Shopify
    3. Shopify redirige a /callback con code
    """
    # Scopes necesarios
    scopes = [
        "read_products",
        "write_products",
        "read_inventory",
        "write_inventory",
        "read_orders"
    ]
    
    redirect_uri = f"{settings.BASE_URL}/api/v1/integrations/shopify/callback"
    
    # Generar URL de autorización
    auth_url = shopify.Session(shop).create_permission_url(
        scope=scopes,
        redirect_uri=redirect_uri,
        state=str(current_user.id)  # Anti-CSRF
    )
    
    return {"auth_url": auth_url}


@router.get("/integrations/shopify/callback")
async def shopify_callback(
    code: str,
    shop: str,
    state: str,  # user_id
    session: AsyncSession = Depends(get_session)
):
    """
    Callback de Shopify OAuth
    
    1. Intercambia code por access_token
    2. Guarda token encriptado en IntegracionEcommerce
    3. Configura webhooks
    """
    # Validar state (user_id)
    user = await session.get(User, UUID(state))
    if not user:
        raise HTTPException(403)
    
    # Obtener access token permanente
    shopify_session = shopify.Session(shop)
    access_token = shopify_session.request_token(code)
    
    # Guardar integración
    config = {
        "shop_url": shop,
        "access_token": access_token,
        "api_version": "2024-01"
    }
    
    integracion = IntegracionEcommerce(
        tienda_id=user.tienda_id,
        plataforma=PlataformaEcommerce.SHOPIFY,
        nombre=f"Shopify - {shop}",
        config_encrypted=IntegrationService.encrypt_config(config),
        is_active=True
    )
    
    session.add(integracion)
    await session.commit()
    
    # Configurar webhooks
    await setup_shopify_webhooks(integracion)
    
    return {"success": True, "shop": shop}


async def setup_shopify_webhooks(integracion: IntegracionEcommerce):
    """
    Crea webhooks en Shopify para sincronización automática
    """
    connector = ShopifyConnector(
        IntegrationService.decrypt_config(integracion.config_encrypted)
    )
    
    webhooks_to_create = [
        {
            "topic": "products/create",
            "address": f"{settings.BASE_URL}/api/v1/webhooks/shopify/products-create"
        },
        {
            "topic": "products/update",
            "address": f"{settings.BASE_URL}/api/v1/webhooks/shopify/products-update"
        },
        {
            "topic": "inventory_levels/update",
            "address": f"{settings.BASE_URL}/api/v1/webhooks/shopify/inventory-update"
        },
        {
            "topic": "orders/create",
            "address": f"{settings.BASE_URL}/api/v1/webhooks/shopify/orders-create"
        }
    ]
    
    webhook_ids = []
    for webhook_config in webhooks_to_create:
        result = await connector.create_webhook(
            topic=webhook_config["topic"],
            callback_url=webhook_config["address"]
        )
        webhook_ids.append(result["id"])
    
    integracion.webhook_ids = webhook_ids
    integracion.webhooks_configured = True
```

**Completar ShopifyConnector:**

```python
# core/integrations/shopify_connector.py
import shopify
from .base_connector import BaseEcommerceConnector

class ShopifyConnector(BaseEcommerceConnector):
    
    def __init__(self, config: Dict):
        super().__init__(config)
        
        # Activar sesión Shopify
        shopify.Session.setup(
            api_key=settings.SHOPIFY_API_KEY,
            secret=settings.SHOPIFY_API_SECRET
        )
        
        self.session = shopify.Session(
            config["shop_url"],
            config["api_version"],
            config["access_token"]
        )
        shopify.ShopifyResource.activate_session(self.session)
    
    async def test_connection(self) -> bool:
        try:
            shop = shopify.Shop.current()
            return shop is not None
        except:
            return False
    
    async def import_products(self, limit: int = 100, page: int = 1) -> List[Dict]:
        """
        Importa productos de Shopify → formato Nexus
        """
        products = shopify.Product.find(limit=limit, page=page)
        
        normalized = []
        for product in products:
            normalized.append(self._normalize_product(product.to_dict()))
        
        return normalized
    
    async def update_stock(
        self,
        sku: str,
        quantity: int,
        location_id: Optional[str] = None
    ) -> bool:
        """
        Actualiza inventario en Shopify
        """
        # 1. Buscar variant por SKU
        variants = shopify.Variant.find(sku=sku)
        if not variants:
            return False
        
        variant = variants[0]
        
        # 2. Obtener inventory_item_id
        inventory_item_id = variant.inventory_item_id
        
        # 3. Actualizar nivel de inventario
        if not location_id:
            # Usar ubicación por defecto
            locations = shopify.Location.find()
            location_id = locations[0].id
        
        # Set absolute inventory level
        shopify.InventoryLevel.set(
            location_id=location_id,
            inventory_item_id=inventory_item_id,
            available=quantity
        )
        
        return True
    
    def _normalize_product(self, raw_product: Dict) -> Dict:
        """
        Shopify Product → Nexus Product
        
        Shopify structure:
        {
            "id": 123,
            "title": "Remera Básica",
            "variants": [
                {
                    "id": 456,
                    "sku": "REM-001-M",
                    "price": "129.90",
                    "option1": "M",      # Talle
                    "option2": "Rojo",   # Color
                    "barcode": "7791234567890",
                    "inventory_quantity": 50
                }
            ]
        }
        """
        return {
            "external_id": str(raw_product["id"]),
            "name": raw_product["title"],
            "base_sku": raw_product.get("vendor", ""),  # o usar primer SKU
            "description": raw_product.get("body_html", ""),
            "category": raw_product.get("product_type"),
            "variants": [
                {
                    "external_id": str(v["id"]),
                    "sku": v.get("sku", f"VAR-{v['id']}"),
                    "size": v.get("option1"),  # Configurar en Shopify
                    "color": v.get("option2"),
                    "price": float(v["price"]),
                    "barcode": v.get("barcode"),
                    "stock": v.get("inventory_quantity", 0),
                    "image_url": v.get("image_id")
                }
                for v in raw_product.get("variants", [])
            ]
        }
```

**Configuración necesaria:**

```python
# core/config.py
class Settings(BaseSettings):
    # ... existentes
    
    # Shopify OAuth
    SHOPIFY_API_KEY: str = ""
    SHOPIFY_API_SECRET: str = ""
    SHOPIFY_SCOPES: str = "read_products,write_products,read_inventory,write_inventory"
```

---

#### 3.2 Webhooks de Shopify
**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 4 horas

**Implementar receivers:**

```python
# api/routes/webhooks.py
from fastapi import Request, Header
import hmac
import hashlib

async def verify_shopify_webhook(
    request: Request,
    x_shopify_hmac_sha256: str = Header(...)
) -> bool:
    """
    Verifica autenticidad de webhook de Shopify
    """
    body = await request.body()
    
    expected_hmac = hmac.new(
        settings.SHOPIFY_API_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_hmac, x_shopify_hmac_sha256)


@router.post("/webhooks/shopify/products-create")
async def shopify_product_created(
    request: Request,
    x_shopify_shop_domain: str = Header(...),
    session: AsyncSession = Depends(get_session)
):
    """
    Webhook: Producto creado en Shopify → importar a Nexus
    """
    # Verificar firma
    if not await verify_shopify_webhook(request):
        raise HTTPException(403, "Invalid signature")
    
    data = await request.json()
    
    # Buscar integración por shop domain
    result = await session.exec(
        select(IntegracionEcommerce)
        .where(IntegracionEcommerce.config_encrypted.contains(x_shopify_shop_domain))
    )
    integracion = result.first()
    
    if not integracion:
        return {"status": "ignored"}
    
    # Importar producto
    integration_service = IntegrationService(session)
    await integration_service._upsert_product(
        integracion_id=integracion.id,
        tienda_id=integracion.tienda_id,
        product_data=ShopifyConnector(None)._normalize_product(data)
    )
    
    return {"status": "imported"}


@router.post("/webhooks/shopify/inventory-update")
async def shopify_inventory_updated(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Webhook: Stock actualizado en Shopify → actualizar Nexus
    
    NO sincronizar de vuelta (evitar loop infinito)
    """
    if not await verify_shopify_webhook(request):
        raise HTTPException(403)
    
    data = await request.json()
    
    # data = {
    #     "inventory_item_id": 123,
    #     "location_id": 456,
    #     "available": 50
    # }
    
    # Buscar variante por mapping
    # ... implementar lógica
    
    return {"status": "updated"}
```

---

### MÓDULO 4: INTEGRACIÓN E-COMMERCE CUSTOM (API KEYS)

#### 4.1 Sistema de API Keys
**Prioridad:** 🟠 ALTA  
**Tiempo estimado:** 5 horas

**Ya existe modelo `APIKey`**, completar implementación:

```python
# api/routes/api_keys.py
import secrets
from passlib.hash import bcrypt

@router.post("/api-keys")
async def create_api_key(
    data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Crea API key para integración custom
    
    Request:
    {
        "nombre": "Mi E-commerce Custom",
        "scopes": ["products:read", "products:write", "stock:write"],
        "expires_days": 365  # null = nunca expira
    }
    
    Response:
    {
        "api_key": "nxs_1234567890abcdef...",  # Solo se muestra UNA VEZ
        "key_id": "uuid",
        "nombre": "...",
        "scopes": [...],
        "expires_at": "2026-01-01"
    }
    """
    # Generar key aleatoria segura
    raw_key = f"nxs_{secrets.token_urlsafe(32)}"
    
    # Hashear con bcrypt
    key_hash = bcrypt.hash(raw_key)
    
    # Crear registro
    api_key = APIKey(
        tienda_id=current_user.tienda_id,
        key_hash=key_hash,
        key_prefix=raw_key[:8],  # "nxs_1234"
        nombre=data.nombre,
        scopes=data.scopes,
        expires_at=datetime.utcnow() + timedelta(days=data.expires_days) if data.expires_days else None
    )
    
    session.add(api_key)
    await session.commit()
    
    return {
        "api_key": raw_key,  # ⚠️ Solo esta vez
        "key_id": str(api_key.id),
        "nombre": api_key.nombre,
        "scopes": api_key.scopes,
        "expires_at": api_key.expires_at
    }


# Dependency para validar API key
async def validate_api_key(
    x_api_key: str = Header(..., alias="X-API-Key"),
    session: AsyncSession = Depends(get_session)
) -> Tuple[APIKey, UUID]:
    """
    Valida API key y retorna (api_key_obj, tienda_id)
    """
    # Buscar por prefix (optimización)
    prefix = x_api_key[:8]
    
    result = await session.exec(
        select(APIKey)
        .where(
            and_(
                APIKey.key_prefix == prefix,
                APIKey.is_active == True
            )
        )
    )
    
    candidates = result.all()
    
    # Verificar hash
    for api_key in candidates:
        if bcrypt.verify(x_api_key, api_key.key_hash):
            # Verificar expiración
            if api_key.expires_at and api_key.expires_at < datetime.utcnow():
                raise HTTPException(401, "API key expired")
            
            # Actualizar uso
            api_key.last_used = datetime.utcnow()
            api_key.uso_count += 1
            await session.commit()
            
            return api_key, api_key.tienda_id
    
    raise HTTPException(401, "Invalid API key")


# Dependency para validar scopes
def require_scope(required_scope: str):
    async def _validator(
        api_key_data: Tuple[APIKey, UUID] = Depends(validate_api_key)
    ):
        api_key, tienda_id = api_key_data
        
        if required_scope not in api_key.scopes:
            raise HTTPException(
                403,
                f"API key missing required scope: {required_scope}"
            )
        
        return tienda_id
    
    return _validator
```

---

#### 4.2 Endpoints Públicos para E-commerce Custom
**Prioridad:** 🟠 ALTA  
**Tiempo estimado:** 6 horas

**Crear API pública para e-commerce externo:**

```python
# api/routes/public_api.py
"""
API Pública para E-commerce Custom
Todos los endpoints requieren X-API-Key
"""

@router.get("/public/products")
async def list_products_public(
    tienda_id: UUID = Depends(require_scope("products:read")),
    session: AsyncSession = Depends(get_session),
    limit: int = 50,
    offset: int = 0,
    category: Optional[str] = None
):
    """
    Lista productos con variantes y stock
    
    Response:
    {
        "products": [
            {
                "id": "uuid",
                "name": "Remera Básica",
                "sku": "REM-001",
                "category": "remeras",
                "variants": [
                    {
                        "id": "uuid",
                        "sku": "REM-001-ROJO-M",
                        "size": "M",
                        "color": "Rojo",
                        "price": 12990,
                        "stock": 50,
                        "barcode": "7791234567890"
                    }
                ]
            }
        ],
        "total": 150,
        "limit": 50,
        "offset": 0
    }
    """
    # Implementar query con filtros
    pass


@router.get("/public/products/{product_id}")
async def get_product_public(
    product_id: UUID,
    tienda_id: UUID = Depends(require_scope("products:read")),
    session: AsyncSession = Depends(get_session)
):
    """Detalle de producto con todas las variantes"""
    pass


@router.post("/public/products")
async def create_product_public(
    data: ProductCreatePublic,
    tienda_id: UUID = Depends(require_scope("products:write")),
    session: AsyncSession = Depends(get_session)
):
    """
    Crea producto desde e-commerce externo
    
    Request:
    {
        "name": "Remera Básica",
        "base_sku": "REM-001",
        "description": "...",
        "category": "remeras",
        "variants": [
            {
                "sku": "REM-001-ROJO-M",
                "size": "M",
                "color": "Rojo",
                "price": 12990,
                "stock": 50,
                "barcode": "7791234567890"
            }
        ]
    }
    """
    # Crear Product + ProductVariants + InventoryLedger
    pass


@router.patch("/public/products/variants/{variant_id}/stock")
async def update_stock_public(
    variant_id: UUID,
    data: StockUpdate,
    tienda_id: UUID = Depends(require_scope("stock:write")),
    session: AsyncSession = Depends(get_session)
):
    """
    Actualiza stock de variante
    
    Request:
    {
        "quantity": 100,
        "location_id": "uuid",  # opcional
        "reason": "sync_from_ecommerce"
    }
    """
    # Crear transacción en InventoryLedger
    pass


@router.post("/public/webhooks/register")
async def register_webhook_public(
    data: WebhookRegister,
    tienda_id: UUID = Depends(require_scope("webhooks:write")),
    session: AsyncSession = Depends(get_session)
):
    """
    Registra webhook para eventos
    
    Request:
    {
        "url": "https://miecommerce.com/webhooks/nexus",
        "events": ["product.created", "product.updated", "stock.changed"],
        "secret": "webhook_secret_12345"
    }
    
    Nexus enviará POST a esa URL cuando ocurran eventos:
    {
        "event": "stock.changed",
        "data": {
            "variant_id": "uuid",
            "sku": "REM-001-M",
            "new_stock": 45,
            "location_id": "uuid"
        },
        "timestamp": "2025-12-02T10:30:00Z"
    }
    """
    pass
```

**Sistema de webhooks salientes:**

```python
# services/webhook_dispatcher.py
class WebhookDispatcher:
    """
    Envía eventos a e-commerce custom registrados
    """
    
    @staticmethod
    async def dispatch_event(
        tienda_id: UUID,
        event_type: str,
        data: Dict,
        session: AsyncSession
    ):
        """
        Envía evento a todos los webhooks suscritos
        """
        # 1. Buscar webhooks activos para este evento
        webhooks = await session.exec(
            select(Webhook)
            .where(
                and_(
                    Webhook.tienda_id == tienda_id,
                    Webhook.is_active == True,
                    Webhook.events.contains([event_type])
                )
            )
        )
        
        # 2. Enviar POST a cada URL (con retry)
        for webhook in webhooks.all():
            await send_webhook_request(
                url=webhook.url,
                payload={
                    "event": event_type,
                    "data": data,
                    "timestamp": datetime.utcnow().isoformat()
                },
                secret=webhook.secret
            )

# Llamar desde inventory_ledger al crear transacción
async def create_inventory_transaction(...):
    # ... crear ledger entry
    
    # Disparar webhook
    await WebhookDispatcher.dispatch_event(
        tienda_id=tienda_id,
        event_type="stock.changed",
        data={
            "variant_id": str(variant_id),
            "sku": variant.sku,
            "new_stock": new_stock,
            "location_id": str(location_id)
        },
        session=session
    )
```

---

### MÓDULO 5: MIGRACIÓN DE BASE DE DATOS LIMPIA

#### 5.1 Crear Migración Alembic de Limpieza
**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 3 horas

```bash
# Crear nueva migración
cd core-api
alembic revision -m "cleanup_unnecessary_tables_for_retail"
```

**Migración generada:**

```python
# alembic/versions/xxxx_cleanup_unnecessary_tables.py
"""cleanup unnecessary tables for retail

Revision ID: xxxx
Revises: 8ffa21c359ed
Create Date: 2025-12-02
"""

def upgrade():
    # 1. Eliminar tablas RFID
    op.drop_table('rfid_inventory_discrepancies')
    op.drop_table('rfid_scan_items')
    op.drop_table('rfid_scan_sessions')
    op.drop_table('rfid_readers')
    op.drop_table('rfid_tags')
    
    # 2. Eliminar tablas OMS
    op.drop_table('orden_items')
    op.drop_table('ordenes_omnicanal')
    op.drop_table('location_capabilities')
    op.drop_table('shipping_zones')
    
    # 3. Eliminar tablas Loyalty avanzadas
    op.drop_table('wallet_transactions')
    op.drop_table('customer_wallets')
    op.drop_table('gift_card_uso')
    op.drop_table('gift_cards')
    op.drop_table('loyalty_programs')
    
    # 4. Eliminar tablas Promociones
    op.drop_table('promocion_uso')
    op.drop_table('promociones')
    
    # 5. Renombrar Producto legacy
    op.rename_table('productos', 'productos_legacy')
    op.add_column('productos_legacy', sa.Column('is_migrated', sa.Boolean, default=False))
    op.add_column('productos_legacy', sa.Column('migrated_to_product_id', postgresql.UUID, nullable=True))
    
    # 6. Simplificar clientes (eliminar campos innecesarios)
    # Mantener solo: nombre, email, telefono, documento_tipo, documento_numero, notas
    
    # 7. Agregar campos nuevos a products
    op.add_column('products', sa.Column('season', sa.String(50), nullable=True))
    op.add_column('products', sa.Column('brand', sa.String(100), nullable=True))
    op.add_column('products', sa.Column('material', sa.String(200), nullable=True))
    op.add_column('products', sa.Column('images', postgresql.JSONB, nullable=True))
    
    # 8. Crear tabla product_categories
    op.create_table(
        'product_categories',
        sa.Column('id', postgresql.UUID, primary_key=True),
        sa.Column('tienda_id', postgresql.UUID, nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('parent_id', postgresql.UUID, nullable=True),
        sa.Column('sort_order', sa.Integer, default=0),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['tienda_id'], ['tiendas.id']),
        sa.ForeignKeyConstraint(['parent_id'], ['product_categories.id'])
    )
    
    # 9. Crear tabla webhooks
    op.create_table(
        'webhooks',
        sa.Column('id', postgresql.UUID, primary_key=True),
        sa.Column('tienda_id', postgresql.UUID, nullable=False, index=True),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('events', postgresql.JSONB, nullable=False),
        sa.Column('secret', sa.String(100), nullable=False),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('last_triggered', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trigger_count', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['tienda_id'], ['tiendas.id'])
    )


def downgrade():
    # Revertir cambios (por si acaso)
    op.drop_table('webhooks')
    op.drop_table('product_categories')
    # ... revertir resto
```

**Aplicar migración:**

```bash
# Backup de la DB primero
pg_dump $DATABASE_URL > backup_before_cleanup.sql

# Aplicar migración
alembic upgrade head

# Verificar
alembic current
```

---

### MÓDULO 6: ARQUITECTURA DE DOMINIO

#### 6.1 Extraer Lógica de Negocio a Servicios
**Prioridad:** 🟡 MEDIA  
**Tiempo estimado:** 8 horas

**Problema:** Lógica en controladores (God Methods)

**Solución:** Domain Services + Command Pattern

```python
# services/sales_service.py
class SalesService:
    """
    Servicio de dominio de ventas
    Encapsula toda la lógica de negocio de checkout
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def process_checkout(
        self,
        tienda_id: UUID,
        items: List[CheckoutItem],
        metodo_pago: str,
        cliente_id: Optional[UUID] = None
    ) -> Venta:
        """
        Procesa checkout completo
        
        Steps:
        1. Validar productos y stock
        2. Reservar stock en Redis (atomic)
        3. Crear venta en DB
        4. Decrementar stock en InventoryLedger
        5. Publicar evento en RabbitMQ
        6. Retornar venta
        """
        # 1. Validar productos
        await self._validate_products(items)
        
        # 2. Reservar stock (Redis atomic)
        reservation_id = await self._reserve_stock(items)
        
        try:
            # 3. Crear venta
            venta = await self._create_sale(
                tienda_id,
                items,
                metodo_pago,
                cliente_id
            )
            
            # 4. Decrementar en ledger
            await self._decrement_inventory(venta, items)
            
            # 5. Publicar evento
            await self._publish_sale_event(venta)
            
            return venta
        
        except Exception as e:
            # Rollback de reserva
            await self._rollback_stock_reservation(reservation_id)
            raise
    
    async def _validate_products(self, items: List[CheckoutItem]):
        """Valida que productos existan y estén activos"""
        for item in items:
            variant = await self.session.get(ProductVariant, item.variant_id)
            
            if not variant or not variant.is_active:
                raise ProductoNoEncontradoException(f"Variante {item.variant_id}")
            
            # Validar cantidad decimal solo para pesables
            if item.cantidad != int(item.cantidad):
                # Solo permitir decimales si es pesable
                product = await self.session.get(Product, variant.product_id)
                if product.tipo != "pesable":
                    raise VentaInvalidaException("Cantidad decimal solo para pesables")
    
    async def _reserve_stock(self, items: List[CheckoutItem]) -> str:
        """Reserva stock en Redis (atomic)"""
        from core.cache import redis_client
        from core.redis_scripts import RESERVE_STOCK_SCRIPT
        
        reservation_id = str(uuid4())
        
        keys = [f"stock:{item.variant_id}" for item in items]
        args = [reservation_id] + [item.cantidad for item in items]
        
        result = await redis_client.eval(RESERVE_STOCK_SCRIPT, keys=keys, args=args)
        
        if result == 0:
            raise StockInsuficienteException()
        
        return reservation_id
    
    async def _create_sale(self, tienda_id, items, metodo_pago, cliente_id) -> Venta:
        """Crea venta en DB"""
        total = sum(item.precio_unitario * item.cantidad for item in items)
        
        venta = Venta(
            tienda_id=tienda_id,
            total=total,
            metodo_pago=metodo_pago,
            status_pago="pagado"
        )
        
        self.session.add(venta)
        await self.session.flush()
        
        # Crear detalles
        for item in items:
            detalle = DetalleVenta(
                venta_id=venta.id,
                producto_id=item.variant_id,  # variant es el producto real
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                subtotal=item.cantidad * item.precio_unitario
            )
            self.session.add(detalle)
        
        await self.session.commit()
        return venta
    
    async def _decrement_inventory(self, venta: Venta, items: List[CheckoutItem]):
        """Crea transacciones en InventoryLedger"""
        for item in items:
            ledger_entry = InventoryLedger(
                tienda_id=venta.tienda_id,
                variant_id=item.variant_id,
                location_id=item.location_id,  # ubicación por defecto
                delta=-item.cantidad,  # NEGATIVO = salida
                transaction_type="SALE",
                reference_doc=str(venta.id),
                notes=f"Venta #{venta.id}",
                created_by=item.user_id
            )
            self.session.add(ledger_entry)
        
        await self.session.commit()
    
    async def _publish_sale_event(self, venta: Venta):
        """Publica evento de venta a RabbitMQ"""
        from core.event_bus import event_bus
        
        await event_bus.publish(
            event_type="sale.created",
            data={
                "venta_id": str(venta.id),
                "tienda_id": str(venta.tienda_id),
                "total": venta.total,
                "metodo_pago": venta.metodo_pago,
                "fecha": venta.fecha.isoformat()
            }
        )

# Usar en el router
@router.post("/ventas/checkout")
async def checkout(
    data: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Procesa venta - SIMPLIFICADO
    Toda la lógica está en SalesService
    """
    sales_service = SalesService(session)
    
    try:
        venta = await sales_service.process_checkout(
            tienda_id=current_user.tienda_id,
            items=data.items,
            metodo_pago=data.metodo_pago,
            cliente_id=data.cliente_id
        )
        
        return {
            "success": True,
            "venta_id": str(venta.id),
            "total": venta.total
        }
    
    except StockInsuficienteException:
        raise HTTPException(400, "Stock insuficiente")
    except ProductoNoEncontradoException as e:
        raise HTTPException(404, str(e))
    except VentaInvalidaException as e:
        raise HTTPException(400, str(e))
```

**Aplicar mismo patrón a:**
- `ProductService` (creación de productos + variantes + ledger)
- `InventoryService` (ajustes, transferencias, auditorías)
- `IntegrationService` (ya existe, mejorar)

---

### MÓDULO 7: FRONTEND ADAPTADO

#### 7.1 Ajustar Frontend para Retail de Ropa
**Prioridad:** 🟢 BAJA (Backend primero)  
**Tiempo estimado:** 12 horas

**Tareas:**

1. **Selector de Variantes**
   ```tsx
   // components/ProductVariantSelector.tsx
   interface VariantSelectorProps {
     product: Product;
     onSelect: (variant: ProductVariant) => void;
   }
   
   export function VariantSelector({ product, onSelect }: VariantSelectorProps) {
     const [selectedSize, setSelectedSize] = useState<Size>();
     const [selectedColor, setSelectedColor] = useState<Color>();
     
     // Filtrar variantes disponibles según selección
     const availableVariant = product.variants.find(
       v => v.size_id === selectedSize?.id && v.color_id === selectedColor?.id
     );
     
     return (
       <div>
         {/* Grid de colores con círculos de color real */}
         <ColorGrid colors={product.colors} onSelect={setSelectedColor} />
         
         {/* Botones de talles */}
         <SizeButtons sizes={product.sizes} onSelect={setSelectedSize} />
         
         {/* Stock disponible */}
         {availableVariant && (
           <StockBadge stock={availableVariant.stock} />
         )}
       </div>
     );
   }
   ```

2. **POS mejorado con variantes**
   - Al escanear barcode, mostrar producto + selector de variante
   - Agregar variante específica al carrito
   - Mostrar talle y color en cada item

3. **Dashboard de retail**
   - Gráfico de ventas por talle
   - Gráfico de ventas por color
   - Alertas de stock crítico por variante

---

## 📅 ROADMAP DE IMPLEMENTACIÓN

### FASE 1: LIMPIEZA (Semana 1)
- ✅ Eliminar web-portal
- ✅ Crear migración de limpieza de DB
- ✅ Aplicar migración en Supabase
- ✅ Eliminar modelos y servicios innecesarios del código
- ✅ Deprecar modelo Producto legacy

### FASE 2: ADAPTACIÓN RETAIL (Semana 2)
- ✅ Enriquecer modelos de productos (season, brand, images)
- ✅ Crear sistema de categorías jerárquicas
- ✅ Implementar generador automático de SKUs y barcodes
- ✅ Migrar productos legacy → nuevo sistema

### FASE 3: E-COMMERCE SHOPIFY (Semana 3)
- ✅ Implementar OAuth 2.0 de Shopify
- ✅ Completar ShopifyConnector (import/export)
- ✅ Configurar webhooks bidireccionales
- ✅ Testing de sincronización real

### FASE 4: E-COMMERCE CUSTOM (Semana 4)
- ✅ Sistema de API Keys
- ✅ Endpoints públicos (/public/products, /public/stock)
- ✅ Sistema de webhooks salientes
- ✅ Documentación de API pública

### FASE 5: ARQUITECTURA (Semana 5)
- ✅ Extraer SalesService
- ✅ Extraer ProductService
- ✅ Extraer InventoryService
- ✅ Refactorizar controladores (thin controllers)

### FASE 6: TESTING Y DOCUMENTACIÓN (Semana 6)
- ✅ Tests de integración E-commerce
- ✅ Tests de servicios de dominio
- ✅ Documentación de APIs
- ✅ Guía de integración para developers

---

## 🎯 MÉTRICAS DE ÉXITO

### Técnicas
- ✅ 0 tablas innecesarias en DB
- ✅ 100% de productos en sistema nuevo (Product/Variant)
- ✅ Sincronización Shopify < 5 segundos
- ✅ API pública con documentación OpenAPI
- ✅ Cobertura de tests > 70%

### Funcionales
- ✅ Conexión con Shopify en 3 clicks (OAuth)
- ✅ Sincronización bidireccional automática de stock
- ✅ E-commerce custom integrado con API key en < 1 hora
- ✅ POS optimizado para variantes de ropa

### Negocio
- ✅ Tiempo de checkout reducido 30%
- ✅ Errores de stock reducidos 90% (gracias a sincronización)
- ✅ Facilidad de onboarding para PyMES

---

## 🔧 CONFIGURACIÓN NECESARIA

### Variables de Entorno Nuevas

```env
# Shopify OAuth
SHOPIFY_API_KEY=xxxxx
SHOPIFY_API_SECRET=yyyyy
SHOPIFY_SCOPES=read_products,write_products,read_inventory,write_inventory

# WooCommerce (opcional)
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_yyyyy

# Webhooks
WEBHOOK_BASE_URL=https://api.mipos.com
WEBHOOK_SECRET=random_secret_key

# API Keys
API_KEY_ENCRYPTION_SECRET=fernet_key_here
```

---

## 📚 DOCUMENTACIÓN A CREAR

1. **Guía de Integración Shopify** (`docs/integracion-shopify.md`)
   - Paso a paso para conectar tienda
   - Configuración de productos (opciones de variantes)
   - Troubleshooting

2. **Guía de API Pública** (`docs/api-publica.md`)
   - Cómo generar API key
   - Endpoints disponibles
   - Ejemplos de integración (curl, Python, Node.js)

3. **Guía de Migración** (`docs/migracion-productos.md`)
   - Cómo migrar de Producto legacy → Product/Variant
   - Script de migración automático
   - Validación post-migración

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Pérdida de datos en migración
**Mitigación:**
- Backup completo antes de cada migración
- Migración en etapas (no destructiva al inicio)
- Flag `is_migrated` para rastrear progreso

### Riesgo 2: Loop infinito en sincronización
**Problema:** Shopify actualiza stock → Nexus recibe webhook → actualiza DB → sincroniza a Shopify → loop

**Mitigación:**
```python
# Agregar flag "source" en cada transacción de ledger
class InventoryLedger:
    # ...
    source: str = Field(...)  # "manual", "sale", "sync_shopify", "sync_custom"

# No sincronizar de vuelta si source ya es "sync_shopify"
if ledger_entry.source != "sync_shopify":
    await sync_to_shopify(variant, new_stock)
```

### Riesgo 3: Rate limits de Shopify
**Mitigación:**
- Implementar bucket token limiter
- Queue para sincronizaciones masivas
- Webhook preference over polling

---

## 🎓 CONCLUSIÓN

Este plan convierte el POS en una solución especializada para **retail de ropa PyME** con:

1. ✅ **Simplicidad**: elimina features enterprise innecesarias
2. ✅ **Conectividad**: integración real con Shopify + e-commerce custom
3. ✅ **Escalabilidad**: arquitectura de dominio limpia
4. ✅ **Mantenibilidad**: código organizado, tests sólidos

**Resultado:** Un POS moderno, rápido y fácil de integrar que compite con soluciones comerciales como Tiendanube POS, Shopify POS, pero con flexibilidad total para PyMES argentinas.

---

**Próximos pasos inmediatos:**
1. Eliminar `web-portal/`
2. Ejecutar migración de limpieza de DB
3. Implementar OAuth de Shopify
4. Testear sincronización real

¿Comenzamos con la implementación?
