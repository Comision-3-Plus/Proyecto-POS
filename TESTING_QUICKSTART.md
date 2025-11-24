# 🚀 Quick Start - Testing

## Ejecutar Tests INMEDIATAMENTE

### Opción 1: Usar el Script Automatizado (Recomendado)

```powershell
# Ejecutar TODOS los tests (Python + Go)
.\run_tests.ps1 -Target all

# Solo tests de Python con cobertura
.\run_tests.ps1 -Target python -Coverage

# Solo tests unitarios de Python
.\run_tests.ps1 -Target python-unit -Verbose

# Solo tests de Go con cobertura
.\run_tests.ps1 -Target go -Coverage

# Tests End-to-End (levanta Docker, API, Worker)
.\run_tests.ps1 -Target e2e
```

### Opción 2: Ejecutar Manualmente

#### Python (core-api)

```powershell
cd core-api

# Instalar dependencias (primera vez)
pip install -r requirements.txt

# Ejecutar todos los tests
pytest -v

# Solo tests unitarios
pytest tests/unit/ -v

# Solo tests de integración (importante para validar contrato con Go)
pytest tests/integration/ -v

# Con cobertura HTML
pytest --cov=. --cov-report=html
# Abrir: htmlcov/index.html
```

#### Go (worker-service)

```powershell
cd worker-service

# Instalar dependencias (primera vez)
go mod tidy

# Ejecutar todos los tests
go test ./... -v

# Solo tests de un paquete
go test ./internal/consumer -v

# Con cobertura
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
# Abrir: coverage.html
```

---

## 🎯 Tests Más Importantes

### 1. Test de Contrato Python ↔ Go (CRÍTICO)

Este test valida que el mensaje JSON enviado desde Python tenga la estructura EXACTA que espera Go:

```powershell
cd core-api
pytest tests/integration/test_full_flow.py::TestFullSalesFlow::test_venta_completa_con_rabbitmq_event -v
```

**¿Por qué es crítico?**
- Si Python envía `venta_id` y Go espera `ventaId`, el Worker fallará.
- Este test garantiza que ambos servicios estén sincronizados.

### 2. Test de Mapeo de Modelos Go

Valida que el struct `Producto` en Go mapee correctamente los nombres de columna en español de PostgreSQL:

```powershell
cd worker-service
go test ./internal/models -v -run TestProductoStructMapping
```

### 3. Test de Validadores Polimórficos

Valida que los productos de tipo `ropa`, `pesable`, etc. se validen correctamente:

```powershell
cd core-api
pytest tests/unit/test_validators.py::TestValidadoresPolimorficos -v
```

---

## 🐳 Setup de Base de Datos para Testing

### Crear DB de Test (Primera vez)

```powershell
# Iniciar PostgreSQL
docker-compose up -d postgres

# Esperar a que esté listo
Start-Sleep -Seconds 5

# Crear la base de datos de test
docker exec -it pos-postgres psql -U postgres -c "CREATE DATABASE nexus_pos_test;"

# Ejecutar migraciones
cd core-api
$env:DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/nexus_pos_test"
alembic upgrade head
```

### Limpiar DB de Test (Después de testing)

```powershell
docker exec -it pos-postgres psql -U postgres -c "DROP DATABASE nexus_pos_test;"
docker exec -it pos-postgres psql -U postgres -c "CREATE DATABASE nexus_pos_test;"
```

---

## 🔍 Debugging de Tests

### Ver logs detallados de pytest

```powershell
pytest -v -s --log-cli-level=DEBUG
```

### Ver qué fixtures se están usando

```powershell
pytest --fixtures
```

### Ejecutar solo un test específico

```powershell
# Python
pytest tests/unit/test_schemas.py::TestVentaSchemas::test_venta_create_valid -v

# Go
go test ./internal/consumer -run TestVentaNuevaMessage_JSONSchema -v
```

### Re-ejecutar solo los tests que fallaron

```powershell
pytest --lf  # last failed
```

---

## 📊 Ver Reportes de Cobertura

### Python

```powershell
cd core-api
pytest --cov=. --cov-report=html
Start-Process htmlcov/index.html  # Abre en navegador
```

### Go

```powershell
cd worker-service
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
Start-Process coverage.html  # Abre en navegador
```

---

## ⚠️ Problemas Comunes

### Error: "ModuleNotFoundError: No module named 'pytest'"

**Solución:**
```powershell
cd core-api
pip install -r requirements.txt
```

### Error: "database 'nexus_pos_test' does not exist"

**Solución:**
```powershell
docker exec -it pos-postgres psql -U postgres -c "CREATE DATABASE nexus_pos_test;"
```

### Error: "cannot connect to the Docker daemon"

**Solución:**
```powershell
# Iniciar Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 30
```

### Error Go: "no such table: productos"

**Solución:**
Las migraciones solo se ejecutan desde Python:
```powershell
cd core-api
alembic upgrade head
```

---

## 🎓 Recursos de Aprendizaje

### Pytest
- [Tutorial Oficial](https://docs.pytest.org/en/stable/getting-started.html)
- [Fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)
- [Parametrize](https://docs.pytest.org/en/stable/how-to/parametrize.html)

### Go Testing
- [Testing Package](https://pkg.go.dev/testing)
- [Testify](https://github.com/stretchr/testify)
- [Table-Driven Tests](https://dave.cheney.net/2019/05/07/prefer-table-driven-tests)

### Arquitectura Políglota
- [Microservices Testing](https://martinfowler.com/articles/microservice-testing/)
- [Contract Testing](https://pactflow.io/blog/what-is-contract-testing/)

---

## 📝 Checklist Pre-Commit

Antes de hacer commit, asegurate que:

- [ ] `.\run_tests.ps1 -Target all` pasa sin errores
- [ ] Coverage Python > 70%
- [ ] Coverage Go > 60%
- [ ] Test de contrato RabbitMQ pasa
- [ ] Ningún test está marcado como `@pytest.mark.skip`
- [ ] No hay prints de debug (`print()` en Python, `fmt.Println()` en Go)

---

**¿Necesitas ayuda?** Revisa `TESTING_GUIDE.md` para la guía completa.
