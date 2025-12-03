# 🏪 NEXUS POS - Sistema de Punto de Venta Multi-Tenant

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8.svg)](https://golang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema POS (Point of Sale) moderno y escalable especializado en **retail de ropa**, con arquitectura multi-tenant, integraciones e-commerce y capacidades enterprise.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Inicio Rápido](#-inicio-rápido)
- [Documentación](#-documentación)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)

---

## ✨ Características Principales

### 🎯 Core POS
- ✅ **Multi-tenant** - Múltiples tiendas en una misma instancia
- ✅ **Inventory Ledger** - Sistema append-only para trazabilidad completa de stock
- ✅ **Variantes de Producto** - Soporte nativo para color + talle (retail de ropa)
- ✅ **Multi-ubicación** - Gestión de stock por sucursales/depósitos
- ✅ **Sistema de Cajas** - Control de turnos y movimientos
- ✅ **Facturación AFIP** - Integración con AFIP (Argentina) con circuit breaker

### 🔐 Seguridad & Control
- ✅ **RBAC Granular** - Roles y permisos por recurso (vendedor, cajero, encargado, dueño, admin)
- ✅ **Auditoría Inmutable** - Registro de todas las operaciones críticas
- ✅ **JWT Authentication** - Autenticación segura con tokens
- ✅ **Request Tracking** - Request ID propagado a través de todo el sistema

### 🌐 Integraciones E-commerce
- ✅ **Shopify OAuth 2.0** - Conexión completa con webhooks bidireccionales
- ✅ **API Keys** - Sistema para custom e-commerce (WooCommerce, Magento, etc.)
- ✅ **Webhooks Salientes** - Notificaciones automáticas de eventos (products, stock, orders)
- ✅ **Sincronización** - Bidireccional POS ↔ E-commerce

### 📊 Analytics & Reportes
- ✅ **Dashboard en Tiempo Real** - Métricas de ventas, productos y rentabilidad
- ✅ **Reportes Especializados** - Productos más vendidos, tendencias, análisis ABC
- ✅ **Exportación** - Excel y PDF de reportes
- ✅ **Insights** - Análisis predictivo de ventas

### ⚡ Performance
- ✅ **Event-Driven** - Checkout asíncrono con RabbitMQ
- ✅ **Redis Cache** - Cache distribuido con scripts Lua atómicos
- ✅ **Workers Go** - Procesamiento asíncrono de alta performance
- ✅ **Connection Pooling** - Optimizado para Supabase/PgBouncer

---

## 🏗️ Arquitectura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEXUS POS ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Frontend   │───▶│   Core API   │───▶│  PostgreSQL  │     │
│  │ React + Vite │    │   FastAPI    │    │  (Supabase)  │     │
│  └──────────────┘    └──────┬───────┘    └──────────────┘     │
│                              │                                  │
│                    ┌─────────┴─────────┐                       │
│                    ▼                   ▼                        │
│              ┌──────────┐        ┌──────────┐                  │
│              │  Redis   │        │ RabbitMQ │                  │
│              │  Cache   │        │  Events  │                  │
│              └──────────┘        └─────┬────┘                  │
│                                        │                        │
│                              ┌─────────┴────────────┐          │
│                              ▼                      ▼           │
│                        ┌───────────┐        ┌────────────┐     │
│                        │  Workers  │        │ Scheduler  │     │
│                        │    Go     │        │     Go     │     │
│                        └───────────┘        └────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Integraciones: Shopify, MercadoPago, AFIP             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Checkout (Event-Driven)

```
1. POS → POST /api/v1/ventas/checkout
2. API → Valida stock en Redis (< 10ms)
3. API → Publica evento a RabbitMQ: queue.sales.created
4. API → Retorna 201 CREATED (respuesta inmediata)
5. Worker Go → Consume evento
6. Worker Go → Registra venta en DB
7. Worker Go → Actualiza Inventory Ledger
8. Worker Go → Sincroniza con Shopify/WooCommerce
9. Worker Go → Genera factura AFIP (si aplica)
```

---

## 🚀 Stack Tecnológico

### Backend
- **FastAPI** 0.109.0 - Framework web async
- **SQLModel** - ORM con validación Pydantic
- **PostgreSQL** 17 - Base de datos principal
- **Redis** 7 - Cache y locking distribuido
- **RabbitMQ** 3.13 - Cola de mensajes
- **Alembic** - Migraciones de DB

### Workers & Scheduler
- **Go** 1.21+ - Procesamiento asíncrono
- **aio-pika** - Consumer Python de RabbitMQ

### Frontend
- **React** 18 - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Formularios y validación

### DevOps
- **Docker** & **Docker Compose** - Containerización
- **Adminer** - UI para PostgreSQL

---

## 🚀 Inicio Rápido

### Opción 1: Con Docker (Recomendado)

```powershell
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/Proyecto-POS.git
cd Proyecto-POS

# 2. Levantar todo el sistema (automático)
.\start-docker.ps1

# O manualmente:
# Copiar configuración
Copy-Item .env.docker .env

# Editar .env y cambiar SECRET_KEY
# Luego:
docker-compose up -d

# Aplicar migraciones
docker-compose run --rm core_api alembic upgrade head

# Crear usuario admin
docker exec -it super_pos_api python create_admin_simple.py
```

**Listo!** El sistema estará disponible en:
- API: http://localhost:8001
- Docs: http://localhost:8001/api/v1/docs
- RabbitMQ: http://localhost:15672 (user: nexususer / pass: nexuspass2025)
- Adminer: http://localhost:8080

### Opción 2: Desarrollo Local (Sin Docker)

```powershell
# 1. Crear entorno virtual Python
cd core-api
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar .env (necesitas PostgreSQL, Redis, RabbitMQ locales)
Copy-Item .env.example .env
# Editar .env con tus credenciales

# 4. Aplicar migraciones
alembic upgrade head

# 5. Iniciar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Verificar Instalación

```powershell
# Health check
curl http://localhost:8001/api/v1/health

# Debería retornar:
# {
#   "status": "healthy",
#   "db": {"connected": true, "active_connections": 2}
# }
```

---

## 📚 Documentación

### Documentos Principales

| Documento | Descripción |
|-----------|-------------|
| **[ANALISIS_DETALLADO_PROYECTO.md](ANALISIS_DETALLADO_PROYECTO.md)** | 📊 Análisis técnico completo del proyecto (8.5/10) |
| **[GUIA_DOCKER.md](GUIA_DOCKER.md)** | 🐳 Guía paso a paso para Docker |
| **[README_AUDIT.md](README_AUDIT.md)** | 🔍 Auditoría técnica profesional del backend |
| **[RESUMEN_MODULOS_3_4.md](RESUMEN_MODULOS_3_4.md)** | 🌐 Integraciones Shopify y Custom E-commerce |
| **[PLAN_MEJORAS_POS_ROPA.md](PLAN_MEJORAS_POS_ROPA.md)** | 📋 Roadmap de mejoras y especialización retail |

### API Documentation

- **Swagger UI:** http://localhost:8001/api/v1/docs
- **ReDoc:** http://localhost:8001/api/v1/redoc

### Endpoints Principales

#### Autenticación
```bash
POST /api/v1/auth/login          # Login
POST /api/v1/auth/register       # Registro (testing)
GET  /api/v1/auth/me             # Usuario actual
```

#### Productos
```bash
GET    /api/v1/productos                          # Listar productos
POST   /api/v1/productos                          # Crear producto
GET    /api/v1/productos/{id}                     # Detalle producto
GET    /api/v1/productos/{id}/variants            # Variantes
POST   /api/v1/productos/{id}/variants            # Crear variante
GET    /api/v1/productos/variants/{id}/stock      # Stock por ubicación
```

#### Ventas
```bash
GET    /api/v1/ventas                        # Listar ventas
POST   /api/v1/ventas/checkout               # Checkout (event-driven)
GET    /api/v1/ventas/{id}                   # Detalle venta
PATCH  /api/v1/ventas/{id}/anular            # Anular venta
POST   /api/v1/ventas/{id}/facturar          # Facturar AFIP
```

#### Integraciones
```bash
# Shopify OAuth
GET    /api/v1/integrations/shopify/install
GET    /api/v1/integrations/shopify/callback
POST   /api/v1/integrations/shopify/webhooks/{topic}

# API Keys Custom
POST   /api/v1/integrations/api-keys         # Generar API key
POST   /api/v1/integrations/webhooks         # Registrar webhook
GET    /api/v1/integrations/public/products  # Listar productos (con API key)
GET    /api/v1/integrations/public/stock/{variant_id}  # Stock (con API key)
```

---

## 📊 Modelo de Datos

### Entidades Principales

```sql
-- Tiendas (Multi-tenant)
tiendas (id, nombre, email, plan, activo)

-- Usuarios con RBAC
users (id, email, nombre, rol, tienda_id, activo)

-- Productos (nuevo modelo retail)
products (id, name, description, category_id, brand, season, material, tienda_id)
product_variants (id, product_id, size_id, color_id, sku, barcode)
sizes (id, name, category, tienda_id)
colors (id, name, hex_code, sample_image_url, tienda_id)
product_categories (id, name, slug, parent_id, tienda_id)

-- Inventory Ledger (append-only, inmutable)
inventory_ledger (
  id, 
  product_variant_id, 
  location_id, 
  delta,              -- +5 ingreso, -3 venta
  transaction_type,   -- purchase, sale, adjustment, transfer
  reference_type,     -- Venta, OrdenCompra, Transfer
  reference_id,
  created_at
)

-- Ventas
ventas (id, tienda_id, user_id, cliente_id, total, estado, fecha_venta)
detalle_venta (id, venta_id, product_variant_id, cantidad, precio_unitario)

-- Integraciones E-commerce
integraciones_ecommerce (id, tienda_id, plataforma, access_token, config)
webhooks (id, tienda_id, url, events, secret, is_active)
api_keys (id, tienda_id, key_hash, description)
```

### Cálculo de Stock (Ledger)

```sql
-- El stock NUNCA se actualiza, se CALCULA en tiempo real:
SELECT 
    pv.sku,
    l.name as location,
    SUM(il.delta) as stock_actual
FROM inventory_ledger il
JOIN product_variants pv ON pv.id = il.product_variant_id
JOIN locations l ON l.id = il.location_id
WHERE pv.id = '123e4567-e89b-12d3-a456-426614174000'
  AND l.id = '123e4567-e89b-12d3-a456-426614174001'
GROUP BY pv.sku, l.name;
```

**Ventajas:**
- ✅ Trazabilidad completa (auditoría gratis)
- ✅ Nunca se pierden datos históricos
- ✅ Fácil debugging ("¿quién vendió esto?")
- ✅ Reportes históricos precisos
- ✅ Rollback de transacciones sin corrupción

---

## 🧪 Testing

### Ejecutar Tests

```powershell
# Con Docker
docker exec -it super_pos_api pytest tests/unit -v
docker exec -it super_pos_api pytest tests/integration -v

# Sin Docker
cd core-api
pytest tests/unit -v
pytest tests/integration -v

# Con cobertura
pytest --cov=. --cov-report=html
Start-Process htmlcov/index.html
```

### Estado de Tests
- ✅ Tests unitarios: `test_models.py`, `test_schemas.py`, `test_rbac.py`
- ✅ Tests de integración: `test_auth_flow.py`, `test_full_flow.py`
- ⚠️ Cobertura actual: ~45%
- ⚠️ Algunos tests necesitan actualización (campos renombrados)

---

## 🗺️ Roadmap

### ✅ Completado (Módulos 1-4)
- ✅ Limpieza de tablas innecesarias (RFID, OMS, Loyalty)
- ✅ Especialización retail de ropa (categorías, season, brand, material)
- ✅ OAuth 2.0 con Shopify + webhooks
- ✅ API Keys para custom e-commerce
- ✅ Generadores automáticos de SKU y EAN-13
- ✅ Inventory Ledger append-only

### 🚧 En Progreso (Módulos 5-6)
- 🔄 Refactor arquitectural (capa de repositorios)
- 🔄 Optimización de queries N+1
- 🔄 Vistas materializadas para reportes
- 🔄 Tests de cobertura completa

### 📅 Planificado (Módulos 7+)
- ⏳ CI/CD con GitHub Actions
- ⏳ Monitoreo con Prometheus + Grafana
- ⏳ Módulo de fidelización simplificado
- ⏳ App móvil POS (React Native)
- ⏳ Soporte multi-idioma (i18n)
- ⏳ 2FA para usuarios admin

---

## 🐛 Problemas Conocidos

### Deuda Técnica (Prioridad Alta)
1. **Migración de productos legacy** - Ejecutar `migrate_legacy_products.py`
2. **Lógica en controladores** - Extraer a servicios de dominio
3. **Tests desactualizados** - Sincronizar con modelos actuales

### Mejoras de Performance
1. **N+1 queries** - En `listar_ventas()` y algunos reportes
2. **Falta de cache** - Productos y categorías no se cachean
3. **Rate limiting** - No aplicado en `/auth/login`

Ver **[ANALISIS_DETALLADO_PROYECTO.md](ANALISIS_DETALLADO_PROYECTO.md)** para detalles completos.

---

## 🤝 Contribuir

### Guía de Contribución

1. **Fork** el repositorio
2. **Crear branch** para tu feature: `git checkout -b feature/nueva-caracteristica`
3. **Commit** cambios: `git commit -m 'Add: nueva característica'`
4. **Push** a tu branch: `git push origin feature/nueva-caracteristica`
5. **Abrir Pull Request** con descripción detallada

### Estándares de Código

#### Python (FastAPI)
- ✅ PEP 8 (usar `black` para formateo)
- ✅ Type hints obligatorios
- ✅ Docstrings en funciones públicas
- ✅ Tests para nuevas features

#### Go (Workers)
- ✅ `gofmt` para formateo
- ✅ Manejo de errores explícito
- ✅ Context propagation

#### TypeScript (Frontend)
- ✅ ESLint + Prettier
- ✅ Componentes funcionales con hooks
- ✅ Props tipadas con interfaces

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo [LICENSE](LICENSE) para detalles.

---

## 📞 Contacto y Soporte

- **Issues:** https://github.com/Comision-3-Plus/Proyecto-POS/issues
- **Discussions:** https://github.com/Comision-3-Plus/Proyecto-POS/discussions
- **Email:** comision3plus@gmail.com

---

## 🙏 Agradecimientos

- **FastAPI** - Sebastián Ramírez (@tiangolo)
- **SQLModel** - Sebastián Ramírez (@tiangolo)
- **React** - Meta/Facebook
- **Tailwind CSS** - Adam Wathan & equipo

---

## 📈 Estadísticas del Proyecto

- **Líneas de código:** ~25,000+ (Python + Go + TypeScript)
- **Endpoints:** 80+ REST endpoints
- **Tablas DB:** 40+ tablas
- **Servicios:** 8+ microservicios
- **Integraciones:** Shopify, MercadoPago, AFIP
- **Puntuación técnica:** 8.5/10 (ver auditoría)

---

<p align="center">
  <b>Hecho con ❤️ por Comisión 3 Plus</b>
  <br>
  <i>Sistema POS Enterprise para el Futuro del Retail</i>
</p>

<p align="center">
  <a href="#-tabla-de-contenidos">⬆ Volver arriba</a>
</p>
