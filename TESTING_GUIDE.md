# 🧪 Guía de Testing - Super POS (Python + Go)

## 📋 Índice

1. [Arquitectura de Testing](#arquitectura-de-testing)
2. [Tests Python (core-api)](#tests-python-core-api)
3. [Tests Go (worker-service)](#tests-go-worker-service)
4. [Tests End-to-End](#tests-end-to-end)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Comandos Rápidos](#comandos-rápidos)

---

## 🏗️ Arquitectura de Testing

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│                  [Playwright E2E Tests]                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              CORE-API (Python/FastAPI)                       │
│  [pytest] Unit + Integration + Contract Tests                │
│  • test_schemas.py      - Validación DTOs                    │
│  • test_validators.py   - Validación lógica                  │
│  • test_full_flow.py    - Contrato RabbitMQ                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ RabbitMQ
                      │ (JSON Message)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            WORKER-SERVICE (Go)                               │
│  [go test] Unit + Integration Tests                          │
│  • producto_test.go      - Mapeo DB                          │
│  • generator_test.go     - Reportes Excel                    │
│  • stock_checker_test.go - Alertas                           │
│  • consumer_test.go      - Procesamiento mensajes            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐍 Tests Python (core-api)

### Estructura de Directorios

```
core-api/
├── conftest.py                    # Fixtures globales
├── tests/
│   ├── __init__.py
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_schemas.py        # DTOs y validaciones Pydantic
│   │   └── test_validators.py     # Lógica de negocio
│   └── integration/
│       ├── __init__.py
│       └── test_full_flow.py      # Flujo completo + RabbitMQ
```

### Instalación de Dependencias

```powershell
cd core-api
pip install pytest pytest-asyncio pytest-cov httpx
```

### Ejecutar Tests

```powershell
# Todos los tests
pytest -v

# Solo tests unitarios
pytest tests/unit/ -v

# Solo tests de integración
pytest tests/integration/ -v

# Con cobertura
pytest --cov=. --cov-report=html

# Test específico
pytest tests/integration/test_full_flow.py::TestFullSalesFlow::test_venta_completa_con_rabbitmq_event -v
```

### Configurar Base de Datos de Test

```powershell
# Crear DB de testing
psql -U postgres -c "CREATE DATABASE nexus_pos_test;"

# Ejecutar migraciones (si usas Alembic)
cd core-api
$env:DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/nexus_pos_test"
alembic upgrade head
```

### Tests Clave

#### 1. `test_full_flow.py` - CRÍTICO para integración Go

Este test valida que el mensaje JSON enviado a RabbitMQ tenga la estructura EXACTA esperada por el Worker Go:

```python
@pytest.mark.asyncio
async def test_venta_completa_con_rabbitmq_event(
    client, session, tienda_test, producto_general, 
    auth_headers_owner, mock_rabbitmq
):
    # ... crea venta ...
    
    # Valida contrato JSON
    message = mock_rabbitmq[0]["data"]
    
    assert message["evento"] == "NUEVA_VENTA"
    assert isinstance(UUID(message["venta_id"]), UUID)
    assert isinstance(message["total"], (int, float))
    assert message["metodo_pago"] in ["efectivo", "tarjeta_debito", ...]
```

**¿Por qué es importante?**
- Si cambias el schema en Python y no actualizas Go, el Worker fallará silenciosamente.
- Este test garantiza que ambos servicios "hablen el mismo idioma".

---

## 🐹 Tests Go (worker-service)

### Estructura de Directorios

```
worker-service/
└── internal/
    ├── models/
    │   ├── producto.go
    │   └── producto_test.go        # Tests de mapeo DB
    ├── reports/
    │   ├── generator.go
    │   └── generator_test.go       # Tests de generación Excel
    ├── alerts/
    │   ├── stock_checker.go
    │   └── stock_checker_test.go   # Tests de alertas
    └── consumer/
        ├── consumer.go
        └── consumer_test.go        # Tests de procesamiento
```

### Instalación de Dependencias

```powershell
cd worker-service
go mod tidy
go get github.com/stretchr/testify/assert
go get github.com/stretchr/testify/require
```

### Ejecutar Tests

```powershell
# Todos los tests
go test ./... -v

# Tests de un paquete específico
go test ./internal/models -v

# Con cobertura
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out

# Solo tests unitarios (sin DB)
go test ./internal/consumer -v -short

# Tests de integración (requieren DB)
go test ./internal/models -v
```

### Tests Clave

#### 1. `producto_test.go` - Validación de Schema

Valida que el struct Go mapee correctamente los nombres de columna en español:

```go
func TestProductoStructMapping(t *testing.T) {
    jsonInput := `{
        "nombre": "Coca Cola",
        "precio_venta": 1500.0,
        "stock_actual": 100.0
    }`
    
    var producto Producto
    json.Unmarshal([]byte(jsonInput), &producto)
    
    assert.Equal(t, "Coca Cola", producto.Nombre)
    assert.Equal(t, 1500.0, producto.PrecioVenta)
}
```

#### 2. `consumer_test.go` - Validación del Contrato Python ↔ Go

```go
func TestVentaNuevaMessage_JSONSchema(t *testing.T) {
    // Mensaje que llega desde Python
    jsonMessage := `{
        "evento": "NUEVA_VENTA",
        "venta_id": "550e8400-e29b-41d4-a716-446655440000",
        "total": 4500.0
    }`
    
    var msg VentaNuevaMessage
    json.Unmarshal([]byte(jsonMessage), &msg)
    
    assert.Equal(t, "NUEVA_VENTA", msg.Evento)
    uuid.Parse(msg.VentaID) // Valida que sea UUID válido
}
```

---

## 🔄 Tests End-to-End

### Estrategia E2E con Docker Compose

Para probar el flujo completo:

1. **API recibe request**
2. **API guarda en DB**
3. **API publica mensaje a RabbitMQ**
4. **Worker Go consume mensaje**
5. **Worker genera archivo/log**

### Setup del Ambiente E2E

```powershell
# 1. Levantar servicios con Docker Compose
docker-compose up -d postgres rabbitmq

# 2. Esperar a que estén listos
Start-Sleep -Seconds 10

# 3. Ejecutar migraciones
cd core-api
alembic upgrade head

# 4. Levantar Worker en background
cd ..\worker-service
Start-Process -NoNewWindow -FilePath "go" -ArgumentList "run", "cmd/api/main.go"

# 5. Levantar API
cd ..\core-api
Start-Process -NoNewWindow -FilePath "uvicorn" -ArgumentList "main:app", "--reload"
```

### Script E2E Automatizado

Crea `run_e2e_tests.ps1`:

```powershell
# run_e2e_tests.ps1
Write-Host "🚀 Iniciando tests E2E..." -ForegroundColor Green

# Levantar infraestructura
docker-compose up -d
Start-Sleep -Seconds 15

# Ejecutar migraciones
cd core-api
alembic upgrade head

# Iniciar Worker (background)
cd ..\worker-service
$workerJob = Start-Job -ScriptBlock { go run cmd/api/main.go }

# Iniciar API (background)
cd ..\core-api
$apiJob = Start-Job -ScriptBlock { uvicorn main:app --port 8000 }

Start-Sleep -Seconds 10

# Ejecutar tests E2E
pytest tests/integration/test_full_flow.py -v

# Limpiar
Stop-Job $workerJob, $apiJob
Remove-Job $workerJob, $apiJob
docker-compose down

Write-Host "✅ Tests E2E completados" -ForegroundColor Green
```

Ejecutar:

```powershell
.\run_e2e_tests.ps1
```

### Test Manual E2E

```powershell
# 1. Crear una venta por API
curl -X POST http://localhost:8000/api/v1/ventas/checkout `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "items": [{"producto_id": "UUID_PRODUCTO", "cantidad": 2}],
    "metodo_pago": "efectivo"
  }'

# 2. Verificar logs del Worker
docker-compose logs -f worker_go

# Deberías ver:
# 📨 Mensaje recibido en cola de reportes: {...}
# ✅ Venta procesada exitosamente
```

---

## 🤖 CI/CD Pipeline

### GitHub Actions (`.github/workflows/test.yml`)

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test-python:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd core-api
          pip install -r requirements.txt
      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/nexus_pos_test
        run: |
          cd core-api
          pytest --cov=. --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - name: Run tests
        run: |
          cd worker-service
          go test ./... -v -coverprofile=coverage.out
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## ⚡ Comandos Rápidos

### Python

```powershell
# Tests rápidos (sin integración)
pytest tests/unit/ -v

# Tests con cobertura
pytest --cov=. --cov-report=term-missing

# Test específico con output detallado
pytest tests/integration/test_full_flow.py -v -s
```

### Go

```powershell
# Tests rápidos
go test ./internal/consumer -v

# Tests con race detector
go test -race ./...

# Benchmark
go test -bench=. ./internal/reports
```

### Docker

```powershell
# Ejecutar tests dentro de container
docker-compose run --rm core_api pytest -v

docker-compose run --rm worker_go go test ./... -v
```

---

## 🔍 Troubleshooting

### Problema: Tests de Python fallan con "connection refused"

**Solución:** Verifica que PostgreSQL esté corriendo:

```powershell
docker-compose ps
docker-compose logs postgres
```

### Problema: Worker Go no procesa mensajes

**Solución:** Verifica RabbitMQ:

```powershell
# Management UI
Start-Process http://localhost:15672
# Usuario: guest / Contraseña: guest

# Logs
docker-compose logs rabbitmq
```

### Problema: Tests Go fallan con "no such table"

**Solución:** Las migraciones solo corren en Python:

```powershell
cd core-api
alembic upgrade head
```

---

## 📊 Coverage Goals

| Servicio       | Target Coverage | Actual |
|----------------|-----------------|--------|
| core-api       | 80%             | TBD    |
| worker-service | 70%             | TBD    |

---

## 🎯 Checklist de Pre-Deploy

- [ ] Todos los tests unitarios Python pasan
- [ ] Todos los tests unitarios Go pasan
- [ ] Test de contrato RabbitMQ pasa (`test_full_flow.py`)
- [ ] Test de contrato JSON Go pasa (`consumer_test.go`)
- [ ] Coverage > 70% en ambos servicios
- [ ] E2E manual testeado
- [ ] Migrations aplicadas en staging

---

## 📚 Recursos

- [pytest Documentation](https://docs.pytest.org/)
- [Go Testing Package](https://pkg.go.dev/testing)
- [Testify (Go)](https://github.com/stretchr/testify)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

---

**Última actualización:** 2025-11-23  
**Mantenedor:** QA Team - Super POS
