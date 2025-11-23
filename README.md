# 🚀 Super POS - Monorepo Híbrido Refactorizado

## 📊 Visión General

Sistema POS empresarial con arquitectura de microservicios políglota que combina:
- **Python/FastAPI** para lógica de negocio compleja
- **Next.js** para experiencia de usuario moderna
- **Go** para procesamiento de alto rendimiento
- **RabbitMQ** para comunicación asíncrona entre servicios

---

## 🏗️ Arquitectura Actual

```plaintext
Super-POS/
├── core-api/              # 🐍 Python FastAPI - API Principal
│   ├── app/              # Código fuente
│   ├── alembic/          # Migraciones de DB
│   ├── Dockerfile
│   └── requirements.txt
│
├── web-portal/            # ⚛️ Next.js - Frontend Web
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── worker-service/        # 🚀 Go - Procesamiento Asíncrono
│   ├── cmd/
│   ├── internal/
│   └── Dockerfile
│
├── scheduler-service/     # ⏰ Go - Tareas Programadas
│   ├── cmd/
│   ├── Dockerfile
│   └── go.mod
│
├── contracts/             # 📜 JSON Schemas (Contratos de Mensajería)
│   └── README.md
│
├── docs/                  # 📚 Documentación
│   └── ARQUITECTURA_HIBRIDA_ANALISIS.md
│
├── docker-compose.yml     # 🐳 Orquestador de Servicios
├── .env.example
└── README.md
```

---

## 🎯 Refactorización Completada

### ✅ Cambios Realizados

#### 1️⃣ **Eliminación de Código Legacy**
- ❌ `stock-in-order-master/backend` (Backend Go obsoleto)
- ❌ `stock-in-order-master/frontend` (Frontend React Vite obsoleto)
- ❌ `docker-compose.yml` redundantes en subcarpetas

#### 2️⃣ **Reorganización Semántica**
- ✅ `POS/app` → `core-api` (Claridad en el propósito)
- ✅ `POS/frontend` → `web-portal` (Nomenclatura profesional)
- ✅ `stock-in-order-master/worker` → `worker-service`
- ✅ `stock-in-order-master/scheduler` → `scheduler-service`

#### 3️⃣ **Nueva Estructura de Soporte**
- ✅ `contracts/` - Esquemas JSON para mensajes RabbitMQ
- ✅ `docs/` - Documentación centralizada

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker 24+
- Docker Compose 2.20+
- Git

### Instalación

```powershell
# 1. Clonar el repositorio
git clone <repo-url>
cd Super-POS

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Construir servicios
docker-compose build

# 4. Iniciar todos los servicios
docker-compose up -d

# 5. Verificar estado
docker-compose ps
```

### Acceso a Servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Web Portal** | http://localhost:3000 | Frontend Next.js |
| **Core API** | http://localhost:8000 | API Python FastAPI |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **RabbitMQ Dashboard** | http://localhost:15672 | user/pass |
| **Adminer** | http://localhost:8080 | Gestor de DB |

---

## 📋 Comandos Útiles

```powershell
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f core_api

# Reiniciar un servicio
docker-compose restart worker_go

# Ejecutar migraciones de base de datos
docker-compose exec core_api alembic upgrade head

# Acceder a la shell de un contenedor
docker-compose exec core_api bash

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ CUIDADO: Elimina datos)
docker-compose down -v
```

---

## 🔧 Desarrollo Local

### Core API (Python)

```powershell
cd core-api

# Crear entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor de desarrollo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Web Portal (Next.js)

```powershell
cd web-portal

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

### Worker Service (Go)

```powershell
cd worker-service

# Instalar dependencias
go mod download

# Ejecutar worker
go run cmd/worker/main.go
```

---

## 🧪 Testing

```powershell
# Tests de Core API (Python)
cd core-api
pytest tests/ -v --cov=app

# Tests de Frontend
cd web-portal
npm test

# Tests de Worker (Go)
cd worker-service
go test ./... -v
```

---

## 📚 Documentación Técnica

### Arquitectura
- 📖 [Análisis de Arquitectura Híbrida](./ARQUITECTURA_HIBRIDA_ANALISIS.md)
- 📖 [Convenciones de Mensajería RabbitMQ](./docs/RABBITMQ_CONVENTIONS.md) *(próximamente)*
- 📖 [Guía de Migraciones](./docs/MIGRACION_SUPABASE.md)

### APIs
- 📖 [Documentación de Core API](http://localhost:8000/docs) (Swagger)
- 📖 [Esquemas de Contratos](./contracts/README.md)

---

## 🔒 Seguridad

### Variables de Entorno Sensibles

⚠️ **NUNCA commitear archivos `.env` con credenciales reales**

Ejemplo de `.env`:

```env
# Base de Datos
POSTGRES_USER=nexuspos
POSTGRES_PASSWORD=CHANGE_ME_IN_PRODUCTION
POSTGRES_DB=nexus_pos

# Seguridad
SECRET_KEY=GENERATE_RANDOM_256_BIT_KEY
ALGORITHM=HS256

# RabbitMQ
RABBITMQ_USER=user
RABBITMQ_PASS=CHANGE_ME_IN_PRODUCTION

# Integraciones
MERCADOPAGO_ACCESS_TOKEN=your_token_here
SENDGRID_API_KEY=your_key_here
```

### Generación de Claves Seguras

```powershell
# PowerShell: Generar SECRET_KEY
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

---

## 🐳 Docker Compose - Servicios

### Servicios Principales

| Servicio | Imagen | Puerto | Propósito |
|----------|--------|--------|-----------|
| `db` | postgres:17-alpine | 5432 | Base de datos PostgreSQL |
| `rabbitmq` | rabbitmq:3.13-management | 5672, 15672 | Message broker |
| `core_api` | custom (Python) | 8000 | API REST principal |
| `worker_go` | custom (Go) | - | Procesamiento asíncrono |
| `scheduler_go` | custom (Go) | - | Tareas programadas |
| `frontend` | custom (Next.js) | 3000 | Aplicación web |
| `adminer` | adminer:latest | 8080 | Administrador de DB |

### Health Checks Configurados

Todos los servicios críticos tienen health checks:
- PostgreSQL: `pg_isready`
- RabbitMQ: `rabbitmq-diagnostics ping`
- Core API: Endpoint `/health`

---

## 🔄 Flujo de Trabajo Recomendado

### 1. Feature Development

```powershell
# Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# Hacer cambios...
# Ejecutar tests
npm test  # o pytest según el servicio

# Commit
git add .
git commit -m "feat: descripción del cambio"

# Push y crear Pull Request
git push origin feature/nueva-funcionalidad
```

### 2. Database Migrations

```powershell
# Crear nueva migración (Python/Alembic)
docker-compose exec core_api alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
docker-compose exec core_api alembic upgrade head

# Revertir última migración
docker-compose exec core_api alembic downgrade -1
```

### 3. Debugging

```powershell
# Ver logs en tiempo real
docker-compose logs -f core_api worker_go

# Inspeccionar contenedor
docker-compose exec core_api bash

# Ver variables de entorno
docker-compose exec core_api env

# Verificar conectividad a servicios
docker-compose exec core_api ping rabbitmq
docker-compose exec core_api ping db
```

---

## 📊 Monitoreo y Observabilidad

### Logs Estructurados

Todos los servicios deben emitir logs en formato JSON:

```json
{
  "timestamp": "2025-11-23T10:30:00Z",
  "service": "core-api",
  "level": "INFO",
  "trace_id": "abc-123",
  "message": "Request procesado exitosamente"
}
```

### Métricas Recomendadas (Futuro)

- **Prometheus** + **Grafana**: Métricas de sistema
- **Jaeger**: Distributed tracing
- **Sentry**: Error tracking

---

## 🤝 Contribución

### Convenciones de Código

- **Python**: PEP 8, usar `black` para formateo
- **TypeScript**: ESLint + Prettier
- **Go**: `gofmt`, seguir convenciones estándar

### Commits Semánticos

```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
refactor: Refactorización sin cambio de funcionalidad
test: Añadir/modificar tests
chore: Tareas de mantenimiento
```

---

## 🐛 Troubleshooting

### Problema: Servicios no inician

```powershell
# Verificar logs
docker-compose logs

# Reconstruir desde cero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Problema: Error de conexión a DB

```powershell
# Verificar estado de PostgreSQL
docker-compose ps db

# Verificar conectividad
docker-compose exec core_api ping db

# Reiniciar DB (⚠️ Perderás datos locales)
docker-compose restart db
```

### Problema: RabbitMQ no conecta

```powershell
# Verificar estado
docker-compose logs rabbitmq

# Verificar credenciales en .env
cat .env | grep RABBITMQ

# Reiniciar servicio
docker-compose restart rabbitmq
```

---

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/Comision-3-Plus/Proyecto-POS/issues)
- **Documentación**: `./docs/`
- **Contacto**: [Tu email/Slack]

---

## 📜 Licencia

[Especificar licencia - MIT, Apache 2.0, etc.]

---

## 🎖️ Créditos

Proyecto desarrollado por el equipo de Comisión 3 Plus.

**Arquitectura refactorizada por**: GitHub Copilot (Claude Sonnet 4.5)  
**Fecha de refactorización**: Noviembre 23, 2025

---

**¡Gracias por usar Super POS!** 🚀
