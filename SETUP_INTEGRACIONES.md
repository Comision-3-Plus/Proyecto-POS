# 🚀 Guía de Configuración Rápida - Módulos 3 y 4

## 📋 Prerequisitos

1. Python 3.11+
2. PostgreSQL 17 (Supabase)
3. Redis (Docker o Cloud)
4. RabbitMQ (Docker o CloudAMQP)
5. Cuenta en Shopify Partners (para OAuth)

---

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias

```bash
cd core-api
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
nano .env  # o code .env
```

#### **Variables Obligatorias:**

```bash
# Base de Datos
DATABASE_URL="postgresql+asyncpg://user:pass@host:6543/db"
DATABASE_MIGRATION_URL="postgresql+asyncpg://user:pass@host:5432/db"

# JWT
SECRET_KEY="generar_con_openssl_rand_hex_64"

# URLs
BASE_URL="https://tu-dominio.com"
FRONTEND_URL="https://tu-frontend.com"
```

#### **Variables Shopify (Módulo 3):**

```bash
SHOPIFY_CLIENT_ID="abc123"
SHOPIFY_CLIENT_SECRET="xyz789"
SHOPIFY_REDIRECT_URI="https://tu-dominio.com/api/v1/integrations/shopify/callback"
```

#### **Variable API Keys (Módulo 4):**

```bash
INTEGRATION_ENCRYPTION_KEY="tu_fernet_key"
```

### 3. Aplicar Migración de Base de Datos

```bash
# Aplicar migración retail (Módulos 1, 2, 3, 4)
alembic upgrade head

# Verificar versión actual
alembic current
# Debe mostrar: 794d75ec6fed (head)
```

### 4. Verificar Tablas Creadas

Conectar a PostgreSQL y verificar:

```sql
-- Tablas nuevas creadas
SELECT * FROM product_categories LIMIT 1;
SELECT * FROM webhooks LIMIT 1;

-- Tablas legacy renombradas
SELECT * FROM productos_legacy LIMIT 1;

-- Columnas agregadas a products
SELECT season, brand, material, category_id FROM products LIMIT 1;
```

---

## 🏪 Configuración Shopify OAuth

### Paso 1: Crear App en Shopify Partners

1. Ir a https://partners.shopify.com
2. Apps → Create app → Custom app
3. Nombre: "Nexus POS Sync"
4. App URL: `https://tu-dominio.com`

### Paso 2: Configurar OAuth

1. En la app → Configuration → URLs
   - App URL: `https://tu-dominio.com`
   - Allowed redirection URL(s): `https://tu-dominio.com/api/v1/integrations/shopify/callback`

2. En Configuration → App Setup
   - Copiar **API key** → `SHOPIFY_CLIENT_ID`
   - Copiar **API secret key** → `SHOPIFY_CLIENT_SECRET`

### Paso 3: Configurar Scopes

En Configuration → API Access, seleccionar:

- ✅ `read_products`
- ✅ `write_products`
- ✅ `read_inventory`
- ✅ `write_inventory`
- ✅ `read_orders`
- ✅ `write_orders`
- ✅ `read_customers`
- ✅ `write_customers`
- ✅ `read_price_rules`
- ✅ `read_locations`

### Paso 4: Testear OAuth (Desarrollo Local con ngrok)

```bash
# 1. Instalar ngrok
brew install ngrok  # macOS
# o descargar de https://ngrok.com

# 2. Exponer puerto 8000
ngrok http 8000

# 3. Copiar URL HTTPS (ej: https://abc123.ngrok.io)

# 4. Actualizar Shopify Partners:
#    - Redirect URI: https://abc123.ngrok.io/api/v1/integrations/shopify/callback

# 5. Actualizar .env:
BASE_URL="https://abc123.ngrok.io"
SHOPIFY_REDIRECT_URI="https://abc123.ngrok.io/api/v1/integrations/shopify/callback"

# 6. Reiniciar FastAPI
uvicorn main:app --reload

# 7. Navegar a:
https://abc123.ngrok.io/api/v1/integrations/shopify/install?shop=tu-tienda-dev.myshopify.com&tienda_id=<uuid>
```

---

## 🔑 Generar API Keys (Módulo 4)

### Opción 1: Via API

```bash
# 1. Obtener token JWT
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tienda.com", "password": "tu_password"}'

# Response: { "access_token": "eyJ...", ... }

# 2. Generar API key
curl -X POST http://localhost:8000/api/v1/integrations/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{
    "tienda_id": "uuid-de-tu-tienda",
    "description": "WooCommerce Principal"
  }'

# Response:
{
  "api_key": "sk_live_abc123xyz...",
  "tienda_id": "uuid",
  "description": "WooCommerce Principal",
  "created_at": "2025-12-02T14:00:00Z"
}

# ⚠️ IMPORTANTE: Guardar api_key en lugar seguro, no se puede recuperar
```

### Opción 2: Via Script Python

```python
import asyncio
from uuid import UUID
from sqlmodel.ext.asyncio.session import AsyncSession
from core.db import get_db_session
from services.api_key_service import APIKeyService

async def create_api_key():
    async for db in get_db_session():
        result = await APIKeyService.create_api_key(
            tienda_id=UUID("tu-tienda-id"),
            description="WooCommerce Principal",
            db=db
        )
        print(f"API Key: {result['api_key']}")
        print(f"Created: {result['created_at']}")

asyncio.run(create_api_key())
```

---

## 🪝 Configurar Webhooks (Módulo 4)

### 1. Registrar Webhook

```bash
curl -X POST http://localhost:8000/api/v1/integrations/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{
    "tienda_id": "uuid",
    "url": "https://mi-ecommerce.com/webhooks/nexus-pos",
    "events": ["product.created", "product.updated", "stock.updated"]
  }'

# Response:
{
  "webhook_id": "uuid",
  "secret": "whsec_abc123...",
  "url": "https://mi-ecommerce.com/webhooks/nexus-pos",
  "events": ["product.created", "product.updated", "stock.updated"]
}

# ⚠️ IMPORTANTE: Guardar secret para verificar firmas
```

### 2. Implementar Receptor de Webhooks (en tu servidor)

#### **Python (Flask)**

```python
from flask import Flask, request
import hmac
import hashlib

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_abc123..."  # Del paso anterior

@app.route('/webhooks/nexus-pos', methods=['POST'])
def handle_webhook():
    # 1. Obtener datos
    body = request.get_data()
    signature = request.headers.get('X-Webhook-Signature')
    event = request.headers.get('X-Webhook-Event')
    
    # 2. Verificar firma
    expected = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected):
        return 'Invalid signature', 401
    
    # 3. Procesar evento
    payload = request.get_json()
    if event == 'product.created':
        print(f"Nuevo producto: {payload['data']['name']}")
        # Crear en WooCommerce, etc.
    
    return 'OK', 200
```

#### **Node.js (Express)**

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
const WEBHOOK_SECRET = 'whsec_abc123...';

app.post('/webhooks/nexus-pos', express.raw({type: 'application/json'}), (req, res) => {
  // 1. Obtener datos
  const signature = req.headers['x-webhook-signature'];
  const event = req.headers['x-webhook-event'];
  const body = req.body;
  
  // 2. Verificar firma
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  
  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }
  
  // 3. Procesar evento
  const payload = JSON.parse(body);
  if (event === 'product.created') {
    console.log(`Nuevo producto: ${payload.data.name}`);
    // Crear en WooCommerce, etc.
  }
  
  res.send('OK');
});

app.listen(3000);
```

---

## 🧪 Testing

### Test 1: Endpoints Públicos

```bash
# Consultar productos
curl http://localhost:8000/api/v1/integrations/public/products?limit=10 \
  -H "X-API-Key: sk_live_abc123..."

# Consultar stock de variante
curl http://localhost:8000/api/v1/integrations/public/stock/<variant_id> \
  -H "X-API-Key: sk_live_abc123..."
```

### Test 2: Disparar Webhook Manualmente

```python
# En consola Python interactiva
from services.api_key_service import APIKeyService
from core.db import get_db_session
from uuid import UUID
import asyncio

async def test_webhook():
    async for db in get_db_session():
        triggered = await APIKeyService.trigger_webhook(
            tienda_id=UUID("tu-tienda-id"),
            event="product.created",
            payload={
                "product_id": "test-123",
                "name": "Remera Test",
                "sku": "TEST-001"
            },
            db=db
        )
        print(f"Webhooks enviados: {triggered}")

asyncio.run(test_webhook())
```

### Test 3: Verificar en webhook.site

1. Ir a https://webhook.site
2. Copiar URL única (ej: `https://webhook.site/abc123`)
3. Registrar webhook:
   ```bash
   curl -X POST http://localhost:8000/api/v1/integrations/webhooks \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJ..." \
     -d '{
       "tienda_id": "uuid",
       "url": "https://webhook.site/abc123",
       "events": ["product.created"]
     }'
   ```
4. Disparar webhook manualmente (ver Test 2)
5. Verificar en webhook.site que llegó con firma HMAC

---

## 📊 Monitoreo

### Ver Logs de Webhooks

```sql
-- Webhooks activos
SELECT id, url, events, is_active, trigger_count, last_triggered, last_error
FROM webhooks
WHERE tienda_id = 'uuid'
ORDER BY created_at DESC;

-- Webhooks con errores
SELECT id, url, last_error, last_triggered
FROM webhooks
WHERE last_error IS NOT NULL
ORDER BY last_triggered DESC;
```

### Ver Integraciones Shopify

```sql
SELECT 
  id, 
  nombre_tienda, 
  activo, 
  config->>'scopes' as scopes,
  config->>'authorized_at' as authorized_at,
  created_at
FROM integraciones_ecommerce
WHERE plataforma = 'SHOPIFY'
  AND tienda_id = 'uuid';
```

### Ver API Keys Activas

```sql
SELECT 
  id,
  plataforma,
  config->>'description' as description,
  activo,
  created_at,
  updated_at
FROM integraciones_ecommerce
WHERE plataforma = 'CUSTOM'
  AND activo = true
  AND tienda_id = 'uuid';
```

---

## 🔒 Seguridad

### Checklist de Producción

- [ ] HTTPS habilitado en BASE_URL
- [ ] SECRET_KEY único generado con `openssl rand -hex 64`
- [ ] INTEGRATION_ENCRYPTION_KEY único generado con Fernet
- [ ] Rate limiting habilitado en Nginx/CloudFlare
- [ ] API keys rotadas cada 90 días
- [ ] Webhooks con HTTPS únicamente
- [ ] Logs de audit habilitados
- [ ] Monitoreo de webhooks fallidos
- [ ] Backups automáticos de BD
- [ ] Secrets en AWS Secrets Manager / Railway / Render

---

## 🐛 Troubleshooting

### Error: "Invalid HMAC signature" en Shopify callback

```bash
# Verificar que SHOPIFY_CLIENT_SECRET sea correcto
echo $SHOPIFY_CLIENT_SECRET

# Verificar que params sean exactos (sin modificar)
# Shopify envía: code, shop, state, hmac
# Si hay params extra, la firma falla
```

### Error: "API key inválida" en endpoints públicos

```bash
# Verificar formato de API key
# Debe ser: sk_live_<48 caracteres>

# Verificar que esté activa en BD
SELECT activo FROM integraciones_ecommerce WHERE api_key = 'sk_live_...';

# Verificar header
curl -v http://localhost:8000/api/v1/integrations/public/products \
  -H "X-API-Key: sk_live_..."
# Debe aparecer en headers: X-Api-Key: sk_live_...
```

### Error: Webhook no llega

```bash
# 1. Verificar que webhook esté activo
SELECT * FROM webhooks WHERE id = 'webhook_id';

# 2. Verificar logs de last_error
SELECT last_error FROM webhooks WHERE id = 'webhook_id';

# 3. Testear URL manualmente
curl -X POST https://tu-webhook-url.com/path \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 4. Verificar firewall no bloquee Nexus POS IPs
```

---

## 📚 Referencias

- [Shopify OAuth Docs](https://shopify.dev/docs/apps/build/authentication-authorization)
- [Shopify Webhooks Docs](https://shopify.dev/docs/apps/build/webhooks)
- [Shopify Admin REST API](https://shopify.dev/docs/api/admin-rest)
- [HMAC Verification](https://en.wikipedia.org/wiki/HMAC)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

---

## ✅ Resumen

Después de seguir esta guía deberías tener:

1. ✅ Base de datos migrada con tablas retail
2. ✅ Shopify OAuth configurado y funcionando
3. ✅ API keys generadas para custom ecommerce
4. ✅ Webhooks registrados y verificando firmas
5. ✅ Endpoints públicos consultando productos y stock
6. ✅ Sistema de notificaciones funcionando

**¡Todo listo para integraciones de ecommerce! 🚀**
