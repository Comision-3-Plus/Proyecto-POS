# ✅ Checklist de Validación - Módulos 3 y 4

## 🎯 Objetivo
Validar que los Módulos 3 (Shopify OAuth) y 4 (Custom API) estén funcionando correctamente antes de pasar a producción.

---

## 📋 Pre-requisitos

### Base de Datos
```bash
# 1. Verificar versión de migración
cd core-api
alembic current

# Debe mostrar:
# 794d75ec6fed (head)

# 2. Verificar tablas creadas
# Conectar a PostgreSQL y ejecutar:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('product_categories', 'webhooks', 'productos_legacy');

# Debe retornar 3 filas
```

### Variables de Entorno
```bash
# Verificar que .env tenga todas las variables
cat .env | grep -E "SHOPIFY|BASE_URL|FRONTEND_URL|INTEGRATION_ENCRYPTION_KEY"

# Debe mostrar:
# SHOPIFY_CLIENT_ID=...
# SHOPIFY_CLIENT_SECRET=...
# SHOPIFY_REDIRECT_URI=...
# BASE_URL=...
# FRONTEND_URL=...
# INTEGRATION_ENCRYPTION_KEY=...
```

### Servidor Funcionando
```bash
# Iniciar servidor
uvicorn main:app --reload

# Verificar en navegador:
# http://localhost:8000/api/v1/docs
```

---

## ✅ Test 1: Verificar Endpoints de Integración

### 1.1 Swagger UI
```
1. Abrir: http://localhost:8000/api/v1/docs
2. Buscar sección: "Integraciones Ecommerce"
3. Verificar endpoints:
   ✅ GET  /integrations/shopify/install
   ✅ GET  /integrations/shopify/callback
   ✅ POST /integrations/shopify/webhooks/{topic}
   ✅ POST /integrations/api-keys
   ✅ POST /integrations/webhooks
   ✅ GET  /integrations/public/products
   ✅ GET  /integrations/public/stock/{product_variant_id}
```

### 1.2 Health Check
```bash
curl http://localhost:8000/health
# Debe retornar: {"status":"healthy"}
```

---

## ✅ Test 2: Shopify OAuth (Desarrollo con ngrok)

### 2.1 Setup ngrok
```bash
# Instalar ngrok
brew install ngrok  # macOS
# o descargar de https://ngrok.com

# Exponer puerto 8000
ngrok http 8000

# Copiar URL HTTPS (ej: https://abc123.ngrok.io)
```

### 2.2 Configurar Shopify Partners
```
1. Ir a: https://partners.shopify.com
2. Apps → Create app → Custom app
3. App URL: https://abc123.ngrok.io
4. Allowed redirection URL(s): 
   https://abc123.ngrok.io/api/v1/integrations/shopify/callback
5. Copiar API key → SHOPIFY_CLIENT_ID
6. Copiar API secret → SHOPIFY_CLIENT_SECRET
```

### 2.3 Actualizar .env
```bash
SHOPIFY_CLIENT_ID="tu_api_key"
SHOPIFY_CLIENT_SECRET="tu_api_secret"
SHOPIFY_REDIRECT_URI="https://abc123.ngrok.io/api/v1/integrations/shopify/callback"
BASE_URL="https://abc123.ngrok.io"
```

### 2.4 Reiniciar Servidor
```bash
# Ctrl+C para detener
uvicorn main:app --reload
```

### 2.5 Testear Instalación
```bash
# Obtener tienda_id de la BD
psql $DATABASE_URL -c "SELECT id FROM tiendas LIMIT 1;"

# Navegar en navegador:
https://abc123.ngrok.io/api/v1/integrations/shopify/install?shop=tu-tienda-dev.myshopify.com&tienda_id=<uuid>

# Debe:
# 1. Redirigir a Shopify
# 2. Pedir autorización
# 3. Redirigir de vuelta con success=shopify
```

### 2.6 Verificar en BD
```sql
-- Verificar integración creada
SELECT 
  id, 
  plataforma, 
  nombre_tienda, 
  activo,
  config->>'scopes' as scopes,
  created_at
FROM integraciones_ecommerce
WHERE plataforma = 'SHOPIFY'
ORDER BY created_at DESC
LIMIT 1;

-- Debe mostrar:
-- plataforma: SHOPIFY
-- activo: true
-- scopes: read_products,write_products,...
```

### 2.7 Verificar Webhooks Registrados
```bash
# Listar webhooks en Shopify
# (requiere access_token de la integración creada)

# O verificar logs del servidor:
grep "SHOPIFY_OAUTH.*webhook" logs/app.log

# Debe mostrar:
# [SHOPIFY_OAUTH] Webhook registrado: products/create → 123456
# [SHOPIFY_OAUTH] Webhook registrado: inventory_levels/update → 123457
# ...
```

---

## ✅ Test 3: API Keys (Custom Ecommerce)

### 3.1 Obtener Token JWT
```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tienda.com",
    "password": "tu_password"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}

# Guardar token
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3.2 Generar API Key
```bash
# Obtener tienda_id
export TIENDA_ID="uuid-de-tu-tienda"

# Generar API key
curl -X POST http://localhost:8000/api/v1/integrations/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"tienda_id\": \"$TIENDA_ID\",
    \"description\": \"Testing API\"
  }"

# Response:
{
  "api_key": "sk_live_abc123xyz...",
  "tienda_id": "uuid",
  "description": "Testing API",
  "created_at": "2025-12-02T14:00:00Z"
}

# ⚠️ IMPORTANTE: Guardar api_key
export API_KEY="sk_live_abc123xyz..."
```

### 3.3 Verificar en BD
```sql
SELECT 
  id,
  plataforma,
  activo,
  config->>'description' as description,
  created_at
FROM integraciones_ecommerce
WHERE plataforma = 'CUSTOM'
  AND tienda_id = '<tu_tienda_id>'
ORDER BY created_at DESC
LIMIT 1;

-- Debe mostrar:
-- plataforma: CUSTOM
-- activo: true
-- description: Testing API
```

### 3.4 Testear Endpoint Público de Productos
```bash
curl http://localhost:8000/api/v1/integrations/public/products?limit=10 \
  -H "X-API-Key: $API_KEY"

# Response:
{
  "tienda_id": "uuid",
  "count": 10,
  "products": [
    {
      "id": "uuid",
      "name": "Remera Nike",
      "description": "...",
      "category_id": "uuid",
      "brand": "Nike",
      "season": "Verano 2025",
      "images": ["url1", "url2"],
      "tags": ["verano", "deportiva"]
    },
    ...
  ]
}
```

### 3.5 Testear Endpoint Público de Stock
```bash
# Obtener variant_id de productos
export VARIANT_ID="uuid-de-variante"

curl http://localhost:8000/api/v1/integrations/public/stock/$VARIANT_ID \
  -H "X-API-Key: $API_KEY"

# Response:
{
  "product_variant_id": "uuid",
  "stock_actual": 45,
  "updated_at": "2025-12-02T14:30:00Z"
}
```

### 3.6 Testear API Key Inválida
```bash
curl http://localhost:8000/api/v1/integrations/public/products \
  -H "X-API-Key: sk_live_invalid"

# Response (401):
{
  "detail": "API key inválida o inactiva"
}
```

---

## ✅ Test 4: Webhooks Salientes

### 4.1 Registrar Webhook de Prueba
```bash
# Obtener URL de prueba de webhook.site
# Ir a: https://webhook.site
# Copiar URL única (ej: https://webhook.site/abc123)

export WEBHOOK_URL="https://webhook.site/abc123"

# Registrar webhook
curl -X POST http://localhost:8000/api/v1/integrations/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"tienda_id\": \"$TIENDA_ID\",
    \"url\": \"$WEBHOOK_URL\",
    \"events\": [\"product.created\", \"stock.updated\"]
  }"

# Response:
{
  "webhook_id": "uuid",
  "secret": "whsec_abc123...",
  "url": "https://webhook.site/abc123",
  "events": ["product.created", "stock.updated"]
}

# Guardar secret
export WEBHOOK_SECRET="whsec_abc123..."
```

### 4.2 Verificar en BD
```sql
SELECT 
  id,
  url,
  events,
  is_active,
  trigger_count,
  created_at
FROM webhooks
WHERE tienda_id = '<tu_tienda_id>'
ORDER BY created_at DESC
LIMIT 1;

-- Debe mostrar:
-- url: https://webhook.site/abc123
-- events: ["product.created", "stock.updated"]
-- is_active: true
-- trigger_count: 0
```

### 4.3 Disparar Webhook Manualmente
```python
# Crear archivo test_webhook.py
from services.api_key_service import APIKeyService
from core.db import get_db_session
from uuid import UUID
import asyncio

async def test():
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

asyncio.run(test())
```

```bash
# Ejecutar
python test_webhook.py

# Output:
# Webhooks enviados: 1
```

### 4.4 Verificar en webhook.site
```
1. Abrir: https://webhook.site/abc123
2. Verificar que llegó request POST
3. Verificar headers:
   ✅ Content-Type: application/json
   ✅ X-Webhook-Signature: <hex>
   ✅ X-Webhook-Event: product.created

4. Verificar body:
{
  "event": "product.created",
  "tienda_id": "uuid",
  "timestamp": "2025-12-02T14:30:00Z",
  "data": {
    "product_id": "test-123",
    "name": "Remera Test",
    "sku": "TEST-001"
  }
}
```

### 4.5 Verificar Firma HMAC
```python
# Crear archivo verify_signature.py
import hmac
import hashlib
import json

# Datos de webhook.site
body = json.dumps({
  "event": "product.created",
  "tienda_id": "uuid",
  "timestamp": "2025-12-02T14:30:00Z",
  "data": {
    "product_id": "test-123",
    "name": "Remera Test",
    "sku": "TEST-001"
  }
}).encode('utf-8')

signature_received = "<copiar_de_webhook.site>"
secret = "whsec_abc123..."

# Calcular
signature_expected = hmac.new(
    secret.encode('utf-8'),
    body,
    hashlib.sha256
).hexdigest()

print(f"Recibida: {signature_received}")
print(f"Esperada: {signature_expected}")
print(f"Válida: {hmac.compare_digest(signature_received, signature_expected)}")
```

```bash
python verify_signature.py

# Output:
# Recibida: abc123...
# Esperada: abc123...
# Válida: True
```

### 4.6 Verificar Contador en BD
```sql
SELECT trigger_count, last_triggered
FROM webhooks
WHERE id = '<webhook_id>';

-- Debe mostrar:
-- trigger_count: 1
-- last_triggered: 2025-12-02 14:30:00
```

---

## ✅ Test 5: Seguridad

### 5.1 Testear HMAC Inválido (Shopify)
```bash
# Simular callback con HMAC inválido
curl "http://localhost:8000/api/v1/integrations/shopify/callback?code=test&shop=test.myshopify.com&state=uuid:nonce&hmac=invalid"

# Response (400):
{
  "detail": "HMAC signature inválida"
}
```

### 5.2 Testear Webhook sin Firma (Custom)
```bash
curl -X POST http://localhost:8000/api/v1/integrations/webhooks/products_create \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Debe fallar por falta de autenticación
```

### 5.3 Testear API Key sin Prefijo
```bash
curl http://localhost:8000/api/v1/integrations/public/products \
  -H "X-API-Key: invalid_key"

# Response (401):
{
  "detail": "API key inválida o inactiva"
}
```

---

## ✅ Test 6: Modelos Retail

### 6.1 Verificar Campos en Product
```sql
SELECT 
  name,
  season,
  brand,
  material,
  images,
  tags,
  meta_title,
  category_id
FROM products
WHERE tienda_id = '<tu_tienda_id>'
LIMIT 1;

-- Verificar que todos los campos existan
```

### 6.2 Crear Categoría
```bash
curl -X POST http://localhost:8000/api/v1/productos/categorias \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"tienda_id\": \"$TIENDA_ID\",
    \"name\": \"Remeras\",
    \"slug\": \"remeras\",
    \"description\": \"Remeras de todas las marcas\"
  }"

# Verificar response con id de categoría
```

### 6.3 Asignar Categoría a Producto
```sql
UPDATE products
SET category_id = '<category_id>'
WHERE id = '<product_id>';

-- Verificar FK funciona
```

---

## ✅ Test 7: Generadores Automáticos

### 7.1 Testear Generador de SKU
```bash
cd core-api
python utils/sku_generator.py

# Output esperado:
# === SKU GENERATOR ===
# REM-001-ROJOIN-M
# PANT-045-AZULMA-42
# 
# === BARCODE GENERATOR ===
# EAN-13: 7790001198082
# Valid: True
```

### 7.2 Verificar Checksum EAN-13
```python
# En Python
from utils.sku_generator import BarcodeGenerator

barcode = "7790001198082"
is_valid = BarcodeGenerator.validate_ean13(barcode)
print(f"Valid: {is_valid}")  # Debe ser True
```

---

## 📊 Checklist Final

### Base de Datos
- [ ] Migración 794d75ec6fed aplicada
- [ ] Tabla product_categories existe
- [ ] Tabla webhooks existe
- [ ] Tabla productos_legacy existe
- [ ] Campos retail agregados a products
- [ ] 15 tablas innecesarias eliminadas

### Endpoints
- [ ] GET /integrations/shopify/install responde
- [ ] GET /integrations/shopify/callback responde
- [ ] POST /integrations/api-keys crea API key
- [ ] POST /integrations/webhooks registra webhook
- [ ] GET /integrations/public/products retorna productos
- [ ] GET /integrations/public/stock/{id} retorna stock

### Seguridad
- [ ] HMAC Shopify verifica correctamente
- [ ] API keys validan formato sk_live_*
- [ ] Webhooks verifican firmas HMAC
- [ ] Tokens OAuth se encriptan con Fernet
- [ ] Secrets nunca aparecen en logs

### Funcionalidad
- [ ] OAuth Shopify redirige correctamente
- [ ] Webhooks Shopify se registran automáticamente
- [ ] API keys permiten consultar productos
- [ ] Webhooks salientes disparan correctamente
- [ ] Firmas HMAC se calculan correctamente

### Documentación
- [ ] .env.example tiene todas las variables
- [ ] RESUMEN_MODULOS_3_4.md completo
- [ ] SETUP_INTEGRACIONES.md completo
- [ ] IMPLEMENTACION_COMPLETA.md completo

---

## 🎉 Resultado Esperado

Si todos los tests pasan:

```
✅ Módulo 3 (Shopify OAuth): FUNCIONANDO
✅ Módulo 4 (Custom API): FUNCIONANDO
✅ Base de Datos: MIGRADA CORRECTAMENTE
✅ Seguridad: VERIFICADA
✅ Documentación: COMPLETA

Estado: READY FOR PRODUCTION 🚀
```

---

## 🐛 Troubleshooting

### Error: "Table already exists"
```bash
# Verificar estado de migración
alembic current

# Si está en versión incorrecta:
alembic downgrade base
alembic upgrade head
```

### Error: "Invalid API key"
```sql
-- Verificar que API key esté activa
SELECT activo FROM integraciones_ecommerce WHERE api_key = 'sk_live_...';

-- Si está inactiva:
UPDATE integraciones_ecommerce SET activo = true WHERE api_key = 'sk_live_...';
```

### Error: "Webhook not triggered"
```sql
-- Ver último error
SELECT last_error, last_triggered FROM webhooks WHERE id = '<webhook_id>';

-- Verificar URL accesible
curl -X POST <webhook_url> -d '{"test": true}'
```

---

**Fecha**: 2 de Diciembre de 2025  
**Versión**: 2.0.0  
**Estado**: READY FOR VALIDATION ✅
