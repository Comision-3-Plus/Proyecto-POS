# 🐳 GUÍA COMPLETA - LEVANTAR NEXUS POS CON DOCKER

Esta guía te llevará paso a paso para levantar todo el ecosistema de Nexus POS usando Docker Compose.

---

## 📋 REQUISITOS PREVIOS

### Software Necesario
- ✅ **Docker Desktop** (Windows/Mac) o **Docker Engine** (Linux)
  - Descargar: https://www.docker.com/products/docker-desktop
  - Versión mínima: 24.0+
- ✅ **Docker Compose** (incluido en Docker Desktop)
  - Versión mínima: 2.20+
- ✅ **Git** (para clonar el repositorio)

### Verificar Instalación
```powershell
# Verificar Docker
docker --version
# Debería mostrar: Docker version 24.x.x o superior

# Verificar Docker Compose
docker-compose --version
# Debería mostrar: Docker Compose version 2.x.x o superior

# Verificar que Docker está corriendo
docker ps
# Debería mostrar una tabla vacía (sin errores)
```

### Recursos Mínimos Recomendados
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Disco:** 10 GB libres
- **Puertos libres:** 5432, 6379, 5672, 15672, 1433, 8001, 8080, 3000

---

## 🚀 INSTALACIÓN RÁPIDA (5 PASOS)

### Paso 1: Configurar Variables de Entorno

```powershell
# Copiar archivo de configuración
Copy-Item .env.docker .env

# IMPORTANTE: Editar .env y cambiar SECRET_KEY
# Generar una clave segura:
python -c "import secrets; print(secrets.token_urlsafe(64))"
# Copiar el resultado y reemplazar SECRET_KEY en .env
```

**Archivo `.env` mínimo:**
```bash
# Base de Datos
POSTGRES_USER=nexuspos
POSTGRES_PASSWORD=nexuspos_secret_2025
POSTGRES_DB=nexus_pos
DATABASE_URL=postgresql+asyncpg://nexuspos:nexuspos_secret_2025@db:5432/nexus_pos

# Seguridad
SECRET_KEY=<PEGAR_CLAVE_GENERADA_AQUI>

# RabbitMQ
RABBITMQ_USER=nexususer
RABBITMQ_PASS=nexuspass2025
RABBITMQ_URL=amqp://nexususer:nexuspass2025@rabbitmq:5672/

# Redis
REDIS_URL=redis://redis:6379/0

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# URLs
BASE_URL=http://localhost:8001
FRONTEND_URL=http://localhost:5173
```

### Paso 2: Construir Imágenes

```powershell
# Construir todas las imágenes (puede tardar 5-10 minutos la primera vez)
docker-compose build

# Ver progreso:
# [+] Building 245.2s (34/34) FINISHED
```

### Paso 3: Levantar Servicios Base (DB, Redis, RabbitMQ)

```powershell
# Levantar solo servicios de infraestructura primero
docker-compose up -d db redis rabbitmq

# Esperar a que estén saludables (30-60 segundos)
docker-compose ps

# Deberías ver:
# NAME                STATUS
# super_pos_db        Up (healthy)
# blend_redis         Up (healthy)
# super_pos_rabbitmq  Up (healthy)
```

### Paso 4: Aplicar Migraciones de Base de Datos

```powershell
# Entrar al contenedor de la API temporalmente
docker-compose run --rm core_api bash

# Dentro del contenedor:
alembic upgrade head

# Salir del contenedor
exit

# Verificar que las tablas se crearon:
docker exec -it super_pos_db psql -U nexuspos -d nexus_pos -c "\dt"
# Deberías ver 40+ tablas (tiendas, users, products, ventas, etc.)
```

### Paso 5: Levantar Todos los Servicios

```powershell
# Levantar todo el ecosistema
docker-compose up -d

# Verificar que todos estén corriendo
docker-compose ps

# Deberías ver 8+ servicios:
# - super_pos_db (PostgreSQL)
# - blend_redis (Redis)
# - super_pos_rabbitmq (RabbitMQ)
# - super_pos_api (FastAPI)
# - super_pos_worker (Go Worker)
# - super_pos_scheduler (Go Scheduler)
# - blend_shopify_worker (Shopify Worker)
# - super_pos_adminer (DB Admin UI)
# - lince_simulator (SQL Server - opcional)
```

### Paso 6 (Opcional): Crear Usuario Admin

```powershell
# Crear usuario administrador inicial
docker exec -it super_pos_api python -c "
from core.db import AsyncSessionLocal
from models import User, Tienda
from core.security import hash_password
import asyncio
import uuid

async def create_admin():
    async with AsyncSessionLocal() as db:
        # Crear tienda
        tienda = Tienda(
            id=uuid.uuid4(),
            nombre='Tienda Demo',
            email='tienda@demo.com',
            telefono='1234567890',
            activo=True
        )
        db.add(tienda)
        await db.flush()
        
        # Crear admin
        admin = User(
            id=uuid.uuid4(),
            email='admin@demo.com',
            nombre='Admin',
            apellido='Sistema',
            password_hash=hash_password('admin123'),
            rol='admin',
            tienda_id=tienda.id,
            activo=True
        )
        db.add(admin)
        await db.commit()
        print(f'✅ Admin creado: admin@demo.com / admin123')
        print(f'✅ Tienda: {tienda.nombre} (ID: {tienda.id})')

asyncio.run(create_admin())
"
```

---

## 🌐 ACCEDER A LOS SERVICIOS

Una vez todo levantado, podrás acceder a:

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **API REST** | http://localhost:8001 | - |
| **Documentación API (Swagger)** | http://localhost:8001/api/v1/docs | - |
| **RabbitMQ Management** | http://localhost:15672 | user: `nexususer` / pass: `nexuspass2025` |
| **Adminer (DB UI)** | http://localhost:8080 | Server: `db`<br>User: `nexususer`<br>Pass: `nexuspass2025`<br>DB: `nexus_pos` |
| **Frontend (si está habilitado)** | http://localhost:3000 | - |

### Probar la API

```powershell
# Health check
curl http://localhost:8001/health
# → {"status":"healthy"}

# Versión de la API
curl http://localhost:8001
# → {"message":"Nexus POS API","version":"1.0.0","status":"running"}

# Login (después de crear admin)
curl -X POST http://localhost:8001/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@demo.com\",\"password\":\"admin123\"}'
# → {"access_token":"eyJ...", "token_type":"bearer"}
```

---

## 📊 MONITOREO Y LOGS

### Ver Logs en Tiempo Real

```powershell
# Todos los servicios
docker-compose logs -f

# Solo la API
docker-compose logs -f core_api

# Solo workers
docker-compose logs -f worker_go scheduler_go shopify_worker

# Solo base de datos
docker-compose logs -f db
```

### Verificar Estado de Servicios

```powershell
# Estado de todos los contenedores
docker-compose ps

# Estado detallado
docker-compose ps --format json | ConvertFrom-Json | Format-Table

# Uso de recursos
docker stats

# Healthcheck de la API
curl http://localhost:8001/api/v1/health
# Incluye métricas de DB
```

### Inspeccionar Base de Datos

```powershell
# Conectarse a PostgreSQL
docker exec -it super_pos_db psql -U nexuspos -d nexus_pos

# Comandos útiles en psql:
# \dt           - Listar tablas
# \d+ users     - Describir tabla users
# \q            - Salir

# Query rápido de conteos:
docker exec -it super_pos_db psql -U nexuspos -d nexus_pos -c "
SELECT 
    (SELECT COUNT(*) FROM tiendas) as tiendas,
    (SELECT COUNT(*) FROM users) as usuarios,
    (SELECT COUNT(*) FROM products) as productos,
    (SELECT COUNT(*) FROM ventas) as ventas;
"
```

### Ver Colas de RabbitMQ

1. Abrir http://localhost:15672
2. Login: `nexususer` / `nexuspass2025`
3. Ir a "Queues"
4. Deberías ver colas como:
   - `queue.sales.created`
   - `queue.sync.products`
   - `queue.reports.generate`

---

## 🔧 COMANDOS ÚTILES

### Reiniciar Servicios

```powershell
# Reiniciar un servicio específico
docker-compose restart core_api

# Reiniciar todos
docker-compose restart

# Reconstruir y reiniciar (después de cambios en código)
docker-compose up -d --build core_api
```

### Detener y Limpiar

```powershell
# Detener todos los servicios (mantiene volúmenes)
docker-compose down

# Detener y eliminar volúmenes (⚠️ BORRA LA BASE DE DATOS)
docker-compose down -v

# Detener, eliminar volúmenes e imágenes
docker-compose down -v --rmi all

# Limpiar sistema completo de Docker (⚠️ CUIDADO)
docker system prune -a --volumes
```

### Ejecutar Comandos en Contenedores

```powershell
# Bash en la API
docker exec -it super_pos_api bash

# Python shell en la API
docker exec -it super_pos_api python

# Ejecutar script Python
docker exec -it super_pos_api python scripts/migrate_legacy_products.py --dry-run

# Alembic (migraciones)
docker exec -it super_pos_api alembic revision --autogenerate -m "Add new table"
docker exec -it super_pos_api alembic upgrade head
docker exec -it super_pos_api alembic downgrade -1
```

### Backup y Restore de Base de Datos

```powershell
# Backup
docker exec super_pos_db pg_dump -U nexuspos nexus_pos > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# Restore
Get-Content backup_20251202_143000.sql | docker exec -i super_pos_db psql -U nexuspos -d nexus_pos
```

---

## 🐛 TROUBLESHOOTING

### Problema: Puertos en Uso

**Error:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solución:**
```powershell
# Verificar qué está usando el puerto
netstat -ano | Select-String ":5432"

# Cambiar puerto en docker-compose.yml:
# ports:
#   - "5433:5432"  # Usar 5433 en host en vez de 5432
```

### Problema: Contenedor No Arranca (Unhealthy)

```powershell
# Ver logs del contenedor problemático
docker-compose logs db

# Reiniciar específicamente ese servicio
docker-compose restart db

# Si persiste, recrear el contenedor
docker-compose up -d --force-recreate db
```

### Problema: Migraciones Fallan

```powershell
# Verificar conexión a DB
docker exec -it super_pos_api python -c "
from core.db import engine
import asyncio

async def test():
    async with engine.begin() as conn:
        result = await conn.execute('SELECT 1')
        print('✅ DB conectada:', result.scalar())

asyncio.run(test())
"

# Ver estado de migraciones
docker exec -it super_pos_api alembic current

# Aplicar manualmente
docker exec -it super_pos_api alembic upgrade head

# Ver historial de migraciones
docker exec -it super_pos_api alembic history
```

### Problema: Workers No Procesan Mensajes

```powershell
# Verificar que RabbitMQ esté corriendo
docker-compose ps rabbitmq

# Ver logs del worker
docker-compose logs -f worker_go

# Verificar colas en RabbitMQ Management
# http://localhost:15672 → Queues

# Reiniciar workers
docker-compose restart worker_go scheduler_go shopify_worker
```

### Problema: API Responde 500

```powershell
# Ver logs detallados
docker-compose logs -f core_api

# Verificar variables de entorno
docker exec super_pos_api env | Select-String "DATABASE_URL|SECRET_KEY|RABBITMQ"

# Reiniciar con rebuild
docker-compose up -d --build core_api
```

### Problema: Memoria Insuficiente

```powershell
# Ver uso de recursos
docker stats

# Aumentar memoria asignada a Docker Desktop:
# Settings → Resources → Memory → Aumentar a 8GB+

# Reducir servicios si es necesario (comentar en docker-compose.yml):
# - legacy_db (si no migras datos)
# - shopify_worker (si no usas Shopify)
# - scheduler_go (si no necesitas tareas programadas)
```

---

## 🧪 TESTING CON DOCKER

### Ejecutar Tests Unitarios

```powershell
# Tests de Python
docker exec -it super_pos_api pytest tests/unit -v

# Con cobertura
docker exec -it super_pos_api pytest tests/unit --cov=. --cov-report=html

# Ver reporte de cobertura
Start-Process core-api/htmlcov/index.html
```

### Ejecutar Tests de Integración

```powershell
# Tests E2E (requiere DB de test)
docker exec -it super_pos_api pytest tests/integration -v

# Test específico
docker exec -it super_pos_api pytest tests/integration/test_auth_flow.py::test_login_success -v
```

---

## 📈 SIGUIENTES PASOS

### 1. Crear Datos de Prueba

```powershell
# Ejecutar script de demo data
docker exec -it super_pos_api python init_demo_data.py
```

### 2. Configurar Integraciones

**Shopify:**
1. Crear app en https://partners.shopify.com
2. Obtener Client ID y Client Secret
3. Actualizar `.env`:
   ```bash
   SHOPIFY_CLIENT_ID=tu_client_id
   SHOPIFY_CLIENT_SECRET=tu_client_secret
   SHOPIFY_REDIRECT_URI=http://localhost:8001/api/v1/integrations/shopify/callback
   ```
4. Reiniciar: `docker-compose restart core_api`

**MercadoPago:**
1. Crear cuenta en https://www.mercadopago.com.ar/developers
2. Obtener Access Token
3. Actualizar `.env`:
   ```bash
   MERCADOPAGO_ACCESS_TOKEN=TEST-tu-token-aqui
   ```

### 3. Habilitar Frontend

```powershell
# Descomentar en docker-compose.yml el servicio 'frontend'
# Luego:
docker-compose up -d frontend

# Acceder a http://localhost:3000
```

### 4. Configurar CI/CD

Ver `docs/cicd-setup.md` (a crear) para integración con GitHub Actions.

---

## 📚 RECURSOS ADICIONALES

- **Documentación API:** http://localhost:8001/api/v1/docs
- **Auditoría Técnica:** `README_AUDIT.md`
- **Análisis Detallado:** `ANALISIS_DETALLADO_PROYECTO.md`
- **Módulos Completados:** `RESUMEN_MODULOS_3_4.md`
- **Plan de Mejoras:** `PLAN_MEJORAS_POS_ROPA.md`

---

## 🆘 SOPORTE

Si tienes problemas, consulta:
1. Logs de Docker: `docker-compose logs -f`
2. Documentación en `/docs`
3. Issues en GitHub
4. Slack del equipo

---

**¡Listo! Tu Nexus POS debería estar corriendo en Docker.** 🚀

Para verificar:
```powershell
curl http://localhost:8001/api/v1/health
# → {"status":"healthy","db":{"connected":true,"active_connections":2}}
```
