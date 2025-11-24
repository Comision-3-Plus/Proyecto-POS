# 🧪 Suite de Tests Completa - Super POS

## 📦 Entregables

### ✅ Tests Python (core-api)

#### Estructura Creada
```
core-api/
├── conftest.py                           # ✅ Fixtures globales + DB setup
├── pyproject.toml                        # ✅ Configuración pytest actualizada
└── tests/
    ├── __init__.py                       # ✅
    ├── unit/
    │   ├── __init__.py                   # ✅
    │   ├── test_schemas.py               # ✅ 12 tests de validación DTOs
    │   └── test_validators.py            # ✅ 15 tests de lógica polimórfica
    └── integration/
        ├── __init__.py                   # ✅
        └── test_full_flow.py             # ✅ 5 tests de contrato RabbitMQ
```

**Total: 32 tests de Python**

#### Tests Clave

1. **`test_schemas.py`** - Validación de DTOs Pydantic
   - ✅ Validación de creación de tiendas, usuarios, ventas
   - ✅ Validación de emails, passwords, roles
   - ✅ Validación de cantidades, métodos de pago

2. **`test_validators.py`** - Validación de lógica polimórfica
   - ✅ Validadores de SKU, stock, precios
   - ✅ Validación de productos polimórficos (general, pesable, ropa)
   - ✅ Enriquecimiento de atributos JSONB

3. **`test_full_flow.py`** - ⭐ CRÍTICO: Contrato con Worker Go
   - ✅ Flujo completo de venta (API → DB → RabbitMQ)
   - ✅ Validación de estructura JSON exacta para Go
   - ✅ Validación de tipos de datos (UUID, float64, int)
   - ✅ Tests de fallo (stock insuficiente, producto inactivo)

---

### ✅ Tests Go (worker-service)

#### Estructura Creada
```
worker-service/
└── internal/
    ├── models/
    │   └── producto_test.go              # ✅ 10 tests de mapeo DB
    ├── reports/
    │   └── generator_test.go             # ✅ 7 tests de Excel
    ├── alerts/
    │   └── stock_checker_test.go         # ✅ 6 tests de alertas
    └── consumer/
        └── consumer_test.go              # ✅ 15 tests de mensajes
```

**Total: 38 tests de Go**

#### Tests Clave

1. **`producto_test.go`** - Validación de mapeo schema Python
   - ✅ Mapeo de campos en español (nombre, precio_venta, stock_actual)
   - ✅ Manejo de UUIDs
   - ✅ Manejo de JSONB polimórfico
   - ✅ Validación de tipos float64 para decimales

2. **`generator_test.go`** - Generación de reportes Excel
   - ✅ Estructura de headers
   - ✅ Cálculo de margen de ganancia
   - ✅ Formato UUID en Excel
   - ✅ Test de integración con DB (opcional)

3. **`stock_checker_test.go`** - Alertas de stock bajo
   - ✅ Lógica de umbral (threshold)
   - ✅ Filtros multi-tenant
   - ✅ Mock de email client
   - ✅ Test de integración con DB (opcional)

4. **`consumer_test.go`** - ⭐ CRÍTICO: Procesamiento de mensajes Python
   - ✅ Validación de schema JSON desde Python
   - ✅ Validación de UUIDs en formato string
   - ✅ Validación de tipos numéricos (float64, int)
   - ✅ Tests de ACK/NACK
   - ✅ Contrato bidireccional Python ↔ Go

---

## 🚀 Cómo Ejecutar

### Opción 1: Script Automatizado (Recomendado)

```powershell
# Todos los tests (Python + Go)
.\run_tests.ps1 -Target all -Coverage

# Solo Python
.\run_tests.ps1 -Target python -Coverage

# Solo Go
.\run_tests.ps1 -Target go -Coverage

# Tests E2E (levanta Docker + API + Worker)
.\run_tests.ps1 -Target e2e
```

### Opción 2: Manual

#### Python
```powershell
cd core-api
pytest -v                                    # Todos
pytest tests/unit/ -v                        # Solo unitarios
pytest tests/integration/ -v                 # Solo integración
pytest --cov=. --cov-report=html             # Con cobertura
```

#### Go
```powershell
cd worker-service
go test ./... -v                             # Todos
go test ./internal/consumer -v               # Solo consumer
go test ./... -coverprofile=coverage.out     # Con cobertura
go tool cover -html=coverage.out             # Ver HTML
```

---

## 🎯 Test Más Importante

### `test_full_flow.py::test_venta_completa_con_rabbitmq_event`

Este test es **CRÍTICO** porque:

1. ✅ Valida que Python envíe el mensaje con la estructura **EXACTA** que espera Go
2. ✅ Detecta inmediatamente si cambias el schema de Python y olvidas actualizar Go
3. ✅ Evita bugs silenciosos donde el Worker recibe mensajes pero falla al procesarlos

**Ejemplo de validación:**

```python
# Python envía:
{
    "evento": "NUEVA_VENTA",
    "venta_id": "uuid-string",
    "tienda_id": "uuid-string",
    "total": 4500.0,
    "metodo_pago": "efectivo",
    "items_count": 2
}

# Go valida:
assert isinstance(UUID(message["venta_id"]), UUID)
assert isinstance(message["total"], (int, float))
assert message["metodo_pago"] in ["efectivo", "tarjeta_debito", ...]
```

---

## 📊 Cobertura Objetivo

| Servicio       | Target | Tests Creados |
|----------------|--------|---------------|
| Python core-api| 80%    | 32 tests      |
| Go worker      | 70%    | 38 tests      |

---

## 🔍 Estrategia End-to-End

### Flujo Validado

```
┌─────────────┐
│   FRONTEND  │
└──────┬──────┘
       │ HTTP POST /ventas/checkout
       ▼
┌─────────────────────────────────────────────────┐
│  PYTHON API                                      │
│  1. Valida request (test_schemas.py)            │
│  2. Guarda en DB                                 │
│  3. Publica mensaje RabbitMQ                    │
│     → test_full_flow.py valida estructura ✓     │
└──────┬──────────────────────────────────────────┘
       │ RabbitMQ (JSON)
       ▼
┌─────────────────────────────────────────────────┐
│  GO WORKER                                       │
│  1. Consume mensaje (consumer_test.go)          │
│  2. Valida schema                                │
│  3. Procesa tarea (reports, alerts)             │
└─────────────────────────────────────────────────┘
```

### Cómo Probar E2E

```powershell
# Automático
.\run_tests.ps1 -Target e2e

# Manual
docker-compose up -d
cd core-api; alembic upgrade head
cd ..\worker-service; go run cmd/api/main.go &
cd ..\core-api; uvicorn main:app &
pytest tests/integration/test_full_flow.py -v
```

---

## 📚 Documentación Adicional

- **`TESTING_GUIDE.md`** - Guía completa de testing (arquitectura, troubleshooting)
- **`TESTING_QUICKSTART.md`** - Comandos rápidos y ejemplos
- **`run_tests.ps1`** - Script automatizado de ejecución

---

## ✅ Checklist Pre-Deploy

- [ ] `.\run_tests.ps1 -Target all -Coverage` pasa sin errores
- [ ] Test de contrato RabbitMQ pasa (`test_full_flow.py`)
- [ ] Test de contrato Go pasa (`consumer_test.go`)
- [ ] Coverage Python > 70%
- [ ] Coverage Go > 60%
- [ ] Ningún test usa `@pytest.mark.skip` o `t.Skip()`
- [ ] No hay prints de debug olvidados

---

## 🎓 Comandos de Ejemplo

```powershell
# Ejecutar solo el test de contrato Python → Go
cd core-api
pytest tests/integration/test_full_flow.py::TestFullSalesFlow::test_venta_completa_con_rabbitmq_event -v -s

# Ejecutar solo el test de contrato Go (deserialización)
cd worker-service
go test ./internal/consumer -run TestVentaNuevaMessage_JSONSchema -v

# Ver cobertura de tests de integración
cd core-api
pytest tests/integration/ --cov=. --cov-report=term-missing

# Ejecutar tests Go con race detector
cd worker-service
go test -race ./...
```

---

## 🐛 Troubleshooting

### Error: "database 'nexus_pos_test' does not exist"
```powershell
docker exec -it pos-postgres psql -U postgres -c "CREATE DATABASE nexus_pos_test;"
cd core-api
alembic upgrade head
```

### Error: "ModuleNotFoundError: No module named 'pytest'"
```powershell
cd core-api
pip install -r requirements.txt
```

### Tests Go fallan con "cannot find package"
```powershell
cd worker-service
go mod tidy
```

---

**Última actualización:** 2025-11-23  
**Tests totales:** 70 (32 Python + 38 Go)  
**Status:** ✅ Todos implementados y documentados
