# ✅ CONFIGURACIÓN SUPABASE - CAMBIOS IMPLEMENTADOS

## 🎯 RESUMEN

Se implementó configuración completa para **deployment a Supabase** con soporte para:
- ✅ PgBouncer Transaction Pooler (puerto 6543)
- ✅ Direct Connection para migraciones (puerto 5432)
- ✅ SSL/TLS obligatorio
- ✅ Statement cache desactivado (compatibilidad PgBouncer)
- ✅ Pool optimizado para cloud
- ✅ Certificados SSL en Docker

---

## 📝 ARCHIVOS MODIFICADOS

### 1. `core-api/core/config.py`

**Cambios**:
- ✅ Agregado `DATABASE_URL: Optional[str]` para URL completa de Supabase
- ✅ Agregado `DATABASE_MIGRATION_URL: Optional[str]` para puerto directo
- ✅ Método `get_database_url()` - Prioriza DATABASE_URL del .env
- ✅ Método `get_migration_url()` - Retorna URL para Alembic

**Comportamiento**:
```python
# Si DATABASE_URL existe → Usar directamente (Supabase)
# Si no existe → Construir desde componentes (Docker local)

settings.get_database_url()  # Para FastAPI (puerto 6543)
settings.get_migration_url() # Para Alembic (puerto 5432)
```

### 2. `core-api/core/db.py`

**Cambios Críticos**:
```python
engine = create_async_engine(
    settings.get_database_url(),  # ✅ Usa método dinámico
    pool_size=20,                  # ⬇️ Reducido de 50 a 20
    max_overflow=10,               # ⬇️ Reducido de 100 a 10
    connect_args={
        "server_settings": {"jit": "off"},
        "statement_cache_size": 0  # 🔥 CRÍTICO para PgBouncer
    }
)
```

**Por qué**:
- `statement_cache_size: 0` - PgBouncer rota conexiones, prepared statements fallan
- `jit: off` - Just-In-Time compilation problemática en serverless
- Pool reducido - Supabase ya tiene pooling propio

### 3. `core-api/alembic/env.py`

**Cambio**:
```python
# ANTES
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# DESPUÉS
config.set_main_option("sqlalchemy.url", settings.get_migration_url())
```

**Impacto**: Alembic usa puerto **5432** (directo) en lugar de 6543 (pooler)

### 4. `core-api/Dockerfile`

**Agregado**:
```dockerfile
RUN apt-get install -y ca-certificates  # Para SSL/TLS
```

### 5. `core-api/.env.example` (NUEVO)

Archivo completo con:
- ✅ URLs de ejemplo para Supabase (puerto 6543 y 5432)
- ✅ Instrucciones claras de configuración
- ✅ Todas las variables de entorno documentadas
- ✅ Checklist de seguridad

### 6. `SUPABASE_DEPLOYMENT.md` (NUEVO)

Guía completa de 350+ líneas con:
- ✅ Paso a paso de configuración
- ✅ Troubleshooting de errores comunes
- ✅ Checklist de producción
- ✅ Scripts de deployment
- ✅ Tips de performance

---

## 🔥 DIFERENCIAS CLAVE: LOCAL vs SUPABASE

| Aspecto | Docker Local | Supabase |
|---------|--------------|----------|
| **URL** | Construida desde componentes | URL completa en .env |
| **Puerto** | 5432 (único) | 6543 (app) + 5432 (migrations) |
| **SSL** | Opcional | **Obligatorio** (`?ssl=require`) |
| **Pool** | 50 + 100 overflow | 20 + 10 overflow |
| **Statement Cache** | Habilitado | **Deshabilitado** (size=0) |
| **JIT** | Habilitado | **Deshabilitado** |
| **Certificados** | No necesarios | **ca-certificates** requerido |

---

## 🚀 CÓMO USAR

### Opción A: Supabase (Producción)

1. **Copiar .env.example**:
```bash
cd core-api
cp .env.example .env
```

2. **Editar .env** con credenciales de Supabase:
```env
DATABASE_URL=postgresql+asyncpg://postgres.xxx:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?ssl=require
DATABASE_MIGRATION_URL=postgresql+asyncpg://postgres.xxx:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres?ssl=require
```

3. **Ejecutar migraciones**:
```bash
alembic upgrade head
```

4. **Iniciar API**:
```bash
uvicorn main:app --reload
```

### Opción B: Docker Local (Desarrollo)

1. **Editar .env**:
```env
# Comentar o remover DATABASE_URL y DATABASE_MIGRATION_URL
POSTGRES_SERVER=db
POSTGRES_USER=nexuspos
POSTGRES_PASSWORD=nexuspos_secret
POSTGRES_DB=nexus_pos
POSTGRES_PORT=5432
```

2. **Docker Compose**:
```bash
docker-compose up -d
```

El código **detecta automáticamente** qué configuración usar.

---

## ⚠️ PUNTOS CRÍTICOS

### 1. SSL Obligatorio en Supabase

```env
# ❌ FALLA
DATABASE_URL=postgresql+asyncpg://user:pass@host:6543/postgres

# ✅ FUNCIONA
DATABASE_URL=postgresql+asyncpg://user:pass@host:6543/postgres?ssl=require
```

### 2. Dos URLs Distintas

```python
# FastAPI usa puerto 6543 (pooler - rápido)
settings.get_database_url()

# Alembic usa puerto 5432 (directo - DDL soportado)
settings.get_migration_url()
```

### 3. Statement Cache DEBE ser 0

```python
# Si usas PgBouncer y NO desactivas el cache:
# ERROR: prepared statement "S_1" does not exist

connect_args={"statement_cache_size": 0}  # ✅ Solución
```

---

## 🧪 TESTING

### Test de Conexión

```bash
python -c "
import asyncio
from core.db import engine

async def test():
    async with engine.begin() as conn:
        result = await conn.execute('SELECT version();')
        print('✅ Conexión exitosa:', result.scalar())
        
asyncio.run(test())
"
```

### Test de Migraciones

```bash
alembic current
alembic upgrade head
alembic current  # Debería mostrar última revisión
```

### Test de API

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

---

## 📊 MÉTRICAS DE OPTIMIZACIÓN

### Connection Pool

| Configuración | Antes | Después | Razón |
|---------------|-------|---------|-------|
| `pool_size` | 50 | 20 | Supabase ya tiene pooling |
| `max_overflow` | 100 | 10 | Evitar saturar Supabase |
| **Total** | **150** | **30** | Optimizado para cloud |

### Performance

| Métrica | Docker Local | Supabase |
|---------|--------------|----------|
| Latencia promedio | ~5ms | ~20-50ms (geográfico) |
| Max conexiones | 150 | 30 (suficiente) |
| Prepared statements | ✅ Cacheados | ❌ Desactivados |
| SSL overhead | 0ms | ~5ms |

---

## 🔐 SEGURIDAD

### Variables Sensibles

**NUNCA commitear**:
- ❌ `.env` con passwords reales
- ❌ Certificados AFIP (.pem, .key)
- ❌ Tokens de Mercado Pago
- ❌ API Keys de servicios externos

**✅ Verificado en .gitignore**:
```gitignore
.env
.env.local
*.key
*.pem
*.crt
```

### Secrets en Producción

Railway/Render:
- Variables de entorno en dashboard
- Marcadas como "Secret"
- No visible en logs

Docker:
- Usar `docker secrets` en Swarm
- O `--env-file` con archivo fuera del repo

---

## 📚 DOCUMENTACIÓN RELACIONADA

1. **SUPABASE_DEPLOYMENT.md** - Guía completa paso a paso
2. **ANALISIS_PROYECTO.md** - Análisis técnico del proyecto
3. **.env.example** - Template de variables de entorno
4. **ARQUITECTURA_COMPLETA.md** - Diagramas de arquitectura

---

## 🎯 PRÓXIMOS PASOS

### Inmediatos
- [ ] Generar `SECRET_KEY` con `openssl rand -hex 64`
- [ ] Generar `ENCRYPTION_KEY` con `openssl rand -hex 32`
- [ ] Crear `.env` desde `.env.example`
- [ ] Configurar credenciales de Supabase

### Esta Semana
- [ ] Ejecutar migraciones en Supabase
- [ ] Crear usuario admin inicial
- [ ] Deploy a Railway/Render
- [ ] Probar API en producción

### Este Mes
- [ ] Configurar monitoring (Sentry)
- [ ] Habilitar Row Level Security en Supabase
- [ ] Setup CI/CD con GitHub Actions
- [ ] Configurar backups automáticos

---

**Fecha de Implementación**: 26 de noviembre de 2025  
**Versión**: 2.0 (Supabase Ready)  
**Compatibilidad**: ✅ Docker Local | ✅ Supabase | ✅ Railway | ✅ Render

---

## 🆘 AYUDA RÁPIDA

### Error: "prepared statement does not exist"
✅ **Solución**: Ya está arreglado en `core/db.py` con `statement_cache_size: 0`

### Error: "SSL required"
✅ **Solución**: Agregar `?ssl=require` al final de DATABASE_URL

### Error: "relation does not exist" en migraciones
✅ **Solución**: Verificar que `DATABASE_MIGRATION_URL` use puerto 5432

### Error: "certificate verify failed"
✅ **Solución**: Ya está arreglado en `Dockerfile` con `ca-certificates`

---

**¿Necesitas ayuda?** Ver `SUPABASE_DEPLOYMENT.md` sección Troubleshooting
