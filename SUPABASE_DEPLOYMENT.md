# 🚀 GUÍA DE DEPLOYMENT A SUPABASE

## 📋 ÍNDICE

1. [Configuración Inicial](#configuración-inicial)
2. [Migraciones de Base de Datos](#migraciones-de-base-de-datos)
3. [Variables de Entorno](#variables-de-entorno)
4. [Deployment a Railway/Render](#deployment-a-railwayrender)
5. [Troubleshooting](#troubleshooting)
6. [Checklist de Producción](#checklist-de-producción)

---

## 🔐 CONFIGURACIÓN INICIAL

### 1. Obtener Credenciales de Supabase

1. Ir a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ir a **Settings** → **Database**
3. Copiar la información de **Connection String**

Verás algo como:

```
Host: aws-1-us-east-2.pooler.supabase.com
Database: postgres
Port: 6543 (Pooler) / 5432 (Direct)
User: postgres.kdqfohbtxlmykjubxqok
Password: [TU_PASSWORD]
```

### 2. Entender los Dos Puertos

| Puerto | Tipo | Uso | Características |
|--------|------|-----|-----------------|
| **6543** | Transaction Pooler | FastAPI (runtime) | ✅ Rápido, maneja miles de conexiones<br>❌ NO soporta migraciones (DDL) |
| **5432** | Direct Connection | Alembic (migraciones) | ✅ Soporta todos los comandos SQL<br>❌ Más lento, limitado en concurrencia |

### 3. Crear Archivo `.env` Local

```bash
# En core-api/
cp .env.example .env
```

Editar `.env` y completar:

```env
# 🔹 Para FastAPI (puerto 6543 - Pooler)
DATABASE_URL=postgresql+asyncpg://postgres.kdqfohbtxlmykjubxqok:TU_PASSWORD_REAL@aws-1-us-east-2.pooler.supabase.com:6543/postgres?ssl=require

# 🔹 Para Alembic (puerto 5432 - Directo)
DATABASE_MIGRATION_URL=postgresql+asyncpg://postgres.kdqfohbtxlmykjubxqok:TU_PASSWORD_REAL@aws-1-us-east-2.pooler.supabase.com:5432/postgres?ssl=require

# 🔐 Generar con: openssl rand -hex 64
SECRET_KEY=tu_secret_key_generada

# Resto de variables...
RABBITMQ_URL=amqp://user:pass@localhost:5672/
REDIS_URL=redis://localhost:6379/0
```

---

## 🗄️ MIGRACIONES DE BASE DE DATOS

### 1. Verificar Conexión a Supabase

```bash
# Desde core-api/
cd core-api

# Test de conexión
python -c "
import asyncio
from core.db import engine

async def test():
    async with engine.begin() as conn:
        result = await conn.execute('SELECT version();')
        print(result.scalar())
        
asyncio.run(test())
"
```

Deberías ver algo como: `PostgreSQL 15.x on x86_64-pc-linux-gnu`

### 2. Ejecutar Migraciones

```bash
# Verificar estado actual
alembic current

# Ver migraciones pendientes
alembic history

# ⚠️ SI HAY DOS HEADS (conflicto de migraciones)
alembic heads
# Output: 8f3d4c2a1b9e (head)
#         add_gin_indexes (head)

# Solución: Merge de heads
alembic merge heads -m "merge_multiple_heads"
```

**Arreglar Migración `add_gin_indexes.py`**:

```python
# core-api/alembic/versions/add_gin_indexes.py
# CAMBIAR:
down_revision = None

# POR:
down_revision = '8f3d4c2a1b9e'  # Última migración válida
```

Luego:

```bash
# Aplicar todas las migraciones
alembic upgrade head

# Verificar
alembic current
# Debería mostrar: 8f3d4c2a1b9e (head)
```

### 3. Verificar Tablas Creadas

Desde Supabase Dashboard → **Table Editor**, deberías ver:

- ✅ `tiendas`
- ✅ `users`
- ✅ `productos`
- ✅ `ventas`
- ✅ `detalles_venta`
- ✅ `insights`
- ✅ `sesiones_caja`
- ✅ `movimientos_caja`
- ✅ `proveedores`
- ✅ `ordenes_compra`
- ✅ `detalles_orden`
- ✅ `facturas`

---

## 🌐 VARIABLES DE ENTORNO

### Railway

1. Ir a tu proyecto en Railway
2. Click en **Variables** tab
3. Agregar cada variable del `.env.example`:

```env
DATABASE_URL=postgresql+asyncpg://postgres.kdqfohbtxlmykjubxqok:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?ssl=require
DATABASE_MIGRATION_URL=postgresql+asyncpg://postgres.kdqfohbtxlmykjubxqok:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres?ssl=require
SECRET_KEY=<generar-con-openssl>
ENCRYPTION_KEY=<generar-con-openssl>
BACKEND_CORS_ORIGINS=https://tu-frontend.vercel.app
# ... resto
```

### Render

1. Dashboard → Environment
2. Add Environment Variable (una por una)
3. ⚠️ Importante: Marcar **Secret** para passwords

### Docker Local (Hybrid Setup)

Si quieres usar Supabase desde Docker local:

**docker-compose.override.yml**:

```yaml
version: '3.8'

services:
  core_api:
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres.xxx:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?ssl=require
      - DATABASE_MIGRATION_URL=postgresql+asyncpg://postgres.xxx:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres?ssl=require
      # Mantener RabbitMQ y Redis local
      - RABBITMQ_URL=amqp://user:pass@rabbitmq:5672/
      - REDIS_URL=redis://redis:6379/0
```

---

## 🐛 TROUBLESHOOTING

### Error: "prepared statement does not exist"

**Causa**: Statement cache activado con PgBouncer

**Solución**: Ya está arreglado en `core/db.py`:

```python
connect_args={
    "statement_cache_size": 0  # ✅ Desactiva cache
}
```

### Error: "SSL connection required"

**Causa**: Falta `?ssl=require` en la URL

**Solución**:

```env
# ❌ MAL
DATABASE_URL=postgresql+asyncpg://user:pass@host:6543/postgres

# ✅ BIEN
DATABASE_URL=postgresql+asyncpg://user:pass@host:6543/postgres?ssl=require
```

### Error: "relation does not exist" en migraciones

**Causa**: Usando puerto 6543 (pooler) para migraciones

**Solución**: Verificar que `DATABASE_MIGRATION_URL` use puerto **5432**

```bash
# Ver qué URL está usando Alembic
alembic current -v
```

### Error: "certificate verify failed"

**Causa**: Falta `ca-certificates` en Docker

**Solución**: Ya está arreglado en `Dockerfile`:

```dockerfile
RUN apt-get install -y ca-certificates
```

### Error: "too many connections"

**Causa**: Pool size muy alto para Supabase

**Solución**: Ya está ajustado en `core/db.py`:

```python
pool_size=20,      # ✅ Optimizado para Supabase
max_overflow=10
```

---

## ✅ CHECKLIST DE PRODUCCIÓN

### Antes de Deploy

- [ ] Generar `SECRET_KEY` único con `openssl rand -hex 64`
- [ ] Generar `ENCRYPTION_KEY` único con `openssl rand -hex 32`
- [ ] Verificar que `.env` esté en `.gitignore`
- [ ] Ejecutar migraciones con `alembic upgrade head`
- [ ] Crear usuario admin manualmente en Supabase:

```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO tiendas (id, nombre, rubro, is_active) 
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'Tienda Principal', 
  'ropa', 
  true
);

-- Password: admin123 (cambiar en producción)
INSERT INTO users (id, email, hashed_password, full_name, rol, is_active, tienda_id) 
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'admin@tuempresa.com',
  '$2b$12$af9eVS/IHwi6mYQae.vlT.86yc1gGtG39hX7.dM0Ewn8JB.ivVhwW',
  'Administrador',
  'super_admin',
  true,
  '11111111-1111-1111-1111-111111111111'
);
```

### Después de Deploy

- [ ] Probar health check: `https://tu-api.com/api/v1/health`
- [ ] Probar login con usuario admin
- [ ] Verificar que CORS permita tu frontend
- [ ] Configurar monitoring (Sentry, LogDNA, etc.)
- [ ] Configurar backups automáticos en Supabase
- [ ] Habilitar Row Level Security (RLS) en Supabase

### Seguridad

- [ ] Rotar secrets cada 90 días
- [ ] Habilitar 2FA en Supabase
- [ ] Configurar rate limiting en Railway/Render
- [ ] Usar HTTPS only (Railway/Render lo hacen automático)
- [ ] Configurar alertas de errores
- [ ] Revisar logs periódicamente

---

## 🔄 FLUJO COMPLETO DE DEPLOYMENT

```bash
# 1. Preparar ambiente local
cd core-api
cp .env.example .env
# Editar .env con credenciales de Supabase

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Ejecutar migraciones
alembic upgrade head

# 4. Crear usuario admin (SQL en Supabase)
# Ver checklist arriba

# 5. Test local
uvicorn main:app --reload

# 6. Verificar
curl http://localhost:8000/api/v1/health

# 7. Login test
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tuempresa.com","password":"admin123"}'

# 8. Deploy a Railway
railway login
railway link  # Seleccionar proyecto
railway up    # Deploy automático

# 9. Configurar variables en Railway Dashboard
# Ver sección "Variables de Entorno" arriba

# 10. Verificar deployment
curl https://tu-proyecto.railway.app/api/v1/health
```

---

## 📊 MONITOREO

### Supabase Dashboard

- **Database** → **Logs**: Ver queries lentas
- **Database** → **Connections**: Monitorear pool usage
- **Logs** → **Postgres Logs**: Errores de BD

### Railway/Render

- Ver logs en tiempo real: `railway logs`
- Metrics: CPU, RAM, Network

### Recomendaciones

1. **Sentry** para tracking de errores:

```python
# main.py
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment="production"
)
```

2. **Prometheus** para métricas:

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

---

## 🎯 PERFORMANCE TIPS

### 1. Índices en Supabase

Ejecutar en SQL Editor:

```sql
-- Índices para búsquedas frecuentes
CREATE INDEX CONCURRENTLY idx_productos_nombre_trgm 
ON productos USING gin (nombre gin_trgm_ops);

CREATE INDEX CONCURRENTLY idx_ventas_fecha 
ON ventas (fecha DESC, tienda_id);

CREATE INDEX CONCURRENTLY idx_detalles_venta_producto 
ON detalles_venta (producto_id, venta_id);
```

### 2. Connection Pooling

Ya está optimizado en `core/db.py`:

```python
pool_size=20,        # Supabase free tier: max 60 connections
max_overflow=10      # Total: 30 conexiones máximo
```

### 3. Caching con Redis

Para producción, usar **Upstash Redis** (gratis hasta 10k requests/día):

```env
REDIS_URL=rediss://default:xxx@wonderful-quail-12345.upstash.io:6379
```

---

## 📞 SOPORTE

- **Supabase**: [Discord](https://discord.supabase.com)
- **Railway**: [Discord](https://discord.gg/railway)
- **Documentación**: Ver `ANALISIS_PROYECTO.md`

---

**Última Actualización**: 26 de noviembre de 2025
**Versión**: 2.0 (Supabase Ready)
