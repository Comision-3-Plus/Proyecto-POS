# 🧪 GUÍA COMPLETA DE TESTING - NEXUS POS ENTERPRISE

## 📚 Índice

1. [Introducción](#introducción)
2. [Los 6 Niveles de Testing](#los-6-niveles-de-testing)
3. [Instalación y Setup](#instalación-y-setup)
4. [Ejecución de Tests](#ejecución-de-tests)
5. [Interpretación de Resultados](#interpretación-de-resultados)
6. [Troubleshooting](#troubleshooting)
7. [Mejores Prácticas](#mejores-prácticas)

---

## 📖 Introducción

Esta guía documenta el sistema completo de testing para Nexus POS, diseñado para validar **6 niveles críticos** del sistema antes de ir a producción.

### ¿Por qué 6 niveles?

Porque cada nivel valida un aspecto diferente del sistema:

1. **NIVEL 1** → ¿El motor arranca? (Health Checks)
2. **NIVEL 2** → ¿Funciona el flujo básico? (Happy Path)
3. **NIVEL 3** → ¿Detectamos fraude? (Auditoría)
4. **NIVEL 4** → ¿Funciona el hardware? (Impresoras)
5. **NIVEL 5** → ¿Sobrevive al caos? (Resiliencia AFIP)
6. **NIVEL 6** → ¿Previene overselling? (Race Conditions)

### Herramientas Disponibles

| Herramienta | Tipo | Uso |
|-------------|------|-----|
| `test_suite_enterprise.py` | Python Suite Completa | Testing automatizado de los 6 niveles |
| `test_manual.ps1` | PowerShell Script | Testing manual interactivo |
| `test_race_conditions.py` | Python Especializado | Detectar overselling |
| `test_chaos.py` | Python Especializado | Resiliencia bajo fallas |

---

## 🧪 Los 6 Niveles de Testing

### 🟢 NIVEL 1: LA SALUD DEL MOTOR

**Objetivo**: Verificar que todos los servicios críticos responden.

#### Tests Incluidos

```
✅ API Health Check (< 100ms)
✅ Database Connection (Supabase, < 50ms)
✅ Redis Connection (< 5ms)
✅ RabbitMQ Connection
```

#### Comando Rápido

```powershell
# Health check manual
curl.exe -X GET http://localhost:8001/api/v1/health
```

#### Resultado Esperado

```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected",
  "rabbit": "connected",
  "timestamp": "2025-11-26T..."
}
```

#### Criterios de Éxito

- ✅ **Verde**: Todos los servicios responden < 100ms
- ⚠️ **Amarillo**: Servicios responden pero con latencia > 100ms
- ❌ **Rojo**: Algún servicio no responde o timeout

---

### 💵 NIVEL 2: EL FLUJO DE CAJA

**Objetivo**: Vender una remera y que stock + plata coincidan.

#### Tests Incluidos

```
1. Crear "Remera Test" con Stock 10
2. Vender 2 unidades
3. Validar Stock = 8 (NO PUEDE SER 7 NI 9)
4. Verificar entrada en payments
```

#### Flujo Completo

```powershell
# 1. Login
$body = @{email="admin@nexuspos.com"; password="admin123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.access_token

# 2. Crear producto
$headers = @{Authorization="Bearer $token"}
$producto = @{nombre="Remera Test"; precio=5000; stock=10; codigo="REM-001"} | ConvertTo-Json
$prod = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/productos" -Method Post -Headers $headers -Body $producto -ContentType "application/json"

# 3. Vender 2 unidades
$venta = @{
    items=@(@{producto_id=$prod.id; cantidad=2; precio_unitario=5000})
    metodo_pago="efectivo"
    total=10000
} | ConvertTo-Json -Depth 3
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/ventas/checkout" -Method Post -Headers $headers -Body $venta -ContentType "application/json"

# 4. Verificar stock
$stock = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/productos/$($prod.id)" -Method Get -Headers $headers
Write-Host "Stock actual: $($stock.stock)"  # Debe ser 8
```

#### Criterios de Éxito

- ✅ **Verde**: Stock = 8 exactos
- ❌ **Rojo (7)**: Double-debit bug (se restó 2 veces)
- ❌ **Rojo (9)**: No se descontó el stock
- ❌ **Rojo (otro)**: Inconsistencia crítica

---

### 🕵️‍♂️ NIVEL 3: EL AGENTE DOBLE

**Objetivo**: Detectar modificaciones maliciosas de precios.

#### Tests Incluidos

```
1. Cambiar precio de $20.000 a $10 (sospechoso)
2. Verificar registro en audit_logs
```

#### Validación SQL

```sql
-- Conectar a Supabase y ejecutar:
SELECT 
    user_id,
    action,
    resource_type,
    resource_id,
    payload_before,
    payload_after,
    created_at
FROM audit_logs
WHERE resource_type = 'productos'
  AND action = 'UPDATE'
ORDER BY created_at DESC
LIMIT 1;
```

#### Resultado Esperado

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "action": "UPDATE",
  "resource_type": "productos",
  "resource_id": "xxx",
  "payload_before": {"precio": 20000},
  "payload_after": {"precio": 10},
  "created_at": "2025-11-26T10:30:00Z"
}
```

#### Criterios de Éxito

- ✅ **Verde**: Audit log existe y refleja el cambio
- ❌ **Rojo**: Tabla audit_logs vacía (middleware no está activo)

---

### 🖨️ NIVEL 4: EL PUENTE DE HARDWARE

**Objetivo**: Imprimir ticket fiscal desde la web.

#### Tests Incluidos

```
1. Health check del Blend Agent (localhost:8080)
2. Detectar impresoras Epson/Hasar
3. Imprimir ticket de prueba
```

#### Ejecución

**Terminal 1 - Iniciar Blend Agent:**

```bash
cd blend-agent
go run cmd/main.go
```

**Terminal 2 - Probar impresión:**

```powershell
$printBody = @{
    items=@(@{description="REMERA TEST"; quantity=1; unit_price=5000; tax_rate=21})
    payment=@{method="efectivo"; amount=5000}
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:8080/api/print/fiscal" -Method Post -Body $printBody -ContentType "application/json"
```

#### Consola Blend Agent (Output Esperado)

```
┌───────────────────────────────────────┐
│  🖨️  BLEND AGENT - Hardware Bridge   │
│  Listening on http://localhost:8080  │
└───────────────────────────────────────┘

[2025-11-26 10:45:23] 🖨️  Imprimiendo ticket fiscal Epson...
[2025-11-26 10:45:24] ✅ Ticket fiscal Epson impreso correctamente
```

#### Criterios de Éxito

- ✅ **Verde**: Consola muestra "✅ Ticket impreso"
- ⚠️ **Amarillo**: Simulación OK pero DLL real no conectada
- ❌ **Rojo**: Connection Refused (agente no corriendo)

---

### 💥 NIVEL 5: CAOS & RESILIENCIA

**Objetivo**: Sistema funciona aunque AFIP esté caído.

#### Tests Incluidos

```
1. Simular AFIP down (desconectar internet)
2. Hacer venta (debe funcionar)
3. Verificar que NO falla
4. Reconectar internet
5. Verificar que worker reintenta y obtiene CAE
```

#### Procedimiento Manual

**Paso 1 - Monitorear Worker AFIP:**

```powershell
docker logs -f nexuspos-worker
```

**Paso 2 - Desconectar Internet:**

```
Panel de Control → Redes → Deshabilitar adaptador
```

**Paso 3 - Hacer Venta:**

```powershell
# Debe dar 200 OK aunque AFIP esté caído
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/ventas/checkout" ...
```

**Paso 4 - Reconectar Internet**

**Paso 5 - Ver Logs del Worker:**

```
[2025-11-26 10:50:00] ⚠️  Error conectando a AFIP. Reintentando en 2s...
[2025-11-26 10:50:02] ⚠️  Error conectando a AFIP. Reintentando en 4s...
[2025-11-26 10:50:06] ⚠️  Error conectando a AFIP. Reintentando en 8s...
[2025-11-26 10:50:14] ✅ CONEXIÓN EXITOSA. CAE ASIGNADO: 70123456789012
```

#### Criterios de Éxito

- ✅ **Verde**: Venta NO falla + CAE obtenido minutos después
- ❌ **Rojo**: Venta falla con Error 500
- ⚠️ **Amarillo**: Venta OK pero CAE nunca se obtiene (verificar worker)

---

### 🏎️ NIVEL 6: LA CARRERA

**Objetivo**: Evitar overselling en Hot Sale.

#### Tests Incluidos

```
Test 1: Stock = 1, 2 compradores concurrentes
Test 2: Stock = 5, 10 compradores concurrentes
Test 3: Stock = 100, 200 compradores concurrentes (STRESS)
```

#### Ejecución Automatizada

```powershell
python test_race_conditions.py
```

#### Output Esperado

```
🏎️ RACE CONDITION TESTER - Hot Sale Simulator
================================================================================

Test 1: Stock = 1, 2 compradores concurrentes
  📦 Producto creado: ID=xxx, Stock=1
  🏃 Lanzando 2 compradores concurrentes...

  📊 Resultados:
     • Ventas exitosas: 1
     • Conflictos (sin stock): 1
     • Errores: 0
     • Stock inicial: 1
     • Stock final: 0

  ✅ CORRECTO: Se vendieron exactamente 1 unidades
  ✅ Stock final es 0
```

#### Criterios de Éxito

- ✅ **Verde**: `Ventas exitosas = Stock inicial` y `Stock final = 0`
- ❌ **CRÍTICO**: `Ventas exitosas > Stock inicial` → **OVERSELLING**

---

## 🚀 Instalación y Setup

### Prerrequisitos

- Python 3.10+
- Go 1.21+ (opcional, para Blend Agent)
- Docker Desktop
- PowerShell 5.1+

### Instalación Rápida

```powershell
# Ejecutar script de instalación
.\setup_testing.ps1
```

### Instalación Manual

```powershell
# 1. Instalar dependencias Python
pip install httpx redis psycopg2-binary pika colorama python-dotenv

# 2. Verificar servicios Docker
docker-compose up -d

# 3. Iniciar API
cd core-api
uvicorn main:app --reload --port 8001

# 4. Iniciar Blend Agent (opcional)
cd blend-agent
go run cmd/main.go
```

---

## 🏃 Ejecución de Tests

### Opción 1: Suite Completa (Recomendado)

```powershell
python test_suite_enterprise.py
```

**Output:**

```
🧪 NEXUS POS - SUITE DE TESTING ENTERPRISE
================================================================================

🧪 NIVEL 1: LA SALUD DEL MOTOR (Health & Smoke Tests)
────────────────────────────────────────────────────────────────────────────────

✅ API Health Check: Latencia: 45.23ms
✅ Database Connection (Supabase): Latencia: 32.11ms
✅ Redis Connection: Latencia: 2.45ms ⚡
✅ RabbitMQ Connection: Broker conectado

Nivel 1 completado: 4/4 tests OK

🧪 NIVEL 2: EL FLUJO DE CAJA (The Happy Path)
────────────────────────────────────────────────────────────────────────────────

✅ Login: Token obtenido
✅ Crear Producto: ID = abc123 (Stock inicial: 10)
✅ Venta Normal: ID = def456 (2 unidades vendidas)
✅ Validar Stock: Correcto (8)

Nivel 2 completado: 4/4 tests OK

...

📊 REPORTE FINAL
================================================================================

✅ Exitosos: 18
❌ Fallidos: 0
⚠️  Warnings: 2
📊 Total: 20

🎉 ¡TODOS LOS TESTS PASARON!
```

### Opción 2: Tests Manuales Interactivos

```powershell
.\test_manual.ps1
```

### Opción 3: Tests Especializados

**Race Conditions:**

```powershell
python test_race_conditions.py
```

**Chaos Engineering:**

```powershell
python test_chaos.py
```

---

## 📊 Interpretación de Resultados

### Códigos de Color

| Color | Significado | Acción |
|-------|-------------|--------|
| ✅ Verde | Test pasó exitosamente | Ninguna |
| ⚠️ Amarillo | Test pasó con warnings | Revisar performance |
| ❌ Rojo | Test falló | CRÍTICO - Arreglar antes de deploy |

### Escenarios Comunes

#### Escenario 1: "Stock incorrecto"

```
❌ Validar Stock: 7 (esperado 8) - Posible double-debit
```

**Causa**: Race condition en actualización de stock.

**Solución**: Verificar que `productos.stock` use lock en update:

```sql
UPDATE productos 
SET stock = stock - :cantidad 
WHERE id = :id AND stock >= :cantidad
```

#### Escenario 2: "API timeout"

```
❌ API Health Check: Timeout después de 5s
```

**Causa**: API no está corriendo o puerto incorrecto.

**Solución**:

```powershell
cd core-api
uvicorn main:app --reload --port 8001
```

#### Escenario 3: "Redis connection refused"

```
❌ Redis Connection: Connection Refused
```

**Causa**: Redis no está corriendo.

**Solución**:

```powershell
docker-compose up -d redis
```

#### Escenario 4: "Audit log vacío"

```
❌ Verificar Audit Log: Tabla vacía
```

**Causa**: `AuditMiddleware` no está registrado en `main.py`.

**Solución**:

```python
# En core-api/main.py
from core.audit_middleware import AuditMiddleware
app.add_middleware(AuditMiddleware)
```

---

## 🔧 Troubleshooting

### Problema: "Token inválido"

**Error:**

```
❌ Login: 401 Unauthorized
```

**Solución:**

```sql
-- Verificar usuario en DB
SELECT * FROM users WHERE email = 'admin@nexuspos.com';

-- Si no existe, crear con seed:
cd core-api
python scripts/seed_demo_data.py
```

### Problema: "Blend Agent no responde"

**Error:**

```
❌ Blend Agent Health: Connection Refused
```

**Solución:**

```powershell
# Terminal 1: Iniciar agente
cd blend-agent
go run cmd/main.go

# Terminal 2: Verificar
curl.exe http://localhost:8080/health
```

### Problema: "Overselling detectado"

**Error:**

```
❌ Race Condition: CRÍTICO - Ambas ventas exitosas (overselling)
```

**Solución**: Implementar lock optimista en checkout:

```python
# En routes/ventas.py
from sqlalchemy import select, update

# Usar FOR UPDATE
stmt = select(Producto).where(Producto.id == item.producto_id).with_for_update()
producto = await session.scalar(stmt)

# O usar UPDATE condicional
result = await session.execute(
    update(Producto)
    .where(Producto.id == item.producto_id)
    .where(Producto.stock >= item.cantidad)
    .values(stock=Producto.stock - item.cantidad)
)

if result.rowcount == 0:
    raise HTTPException(status_code=409, detail="Sin stock")
```

---

## 🎯 Mejores Prácticas

### 1. Ejecutar ANTES de cada deploy

```powershell
# Pre-deploy checklist
python test_suite_enterprise.py

# Si todos pasan → OK para deploy
# Si alguno falla → NO DEPLOYAR
```

### 2. Integrar en CI/CD

```yaml
# .github/workflows/ci.yml
- name: Run Enterprise Test Suite
  run: |
    python test_suite_enterprise.py
```

### 3. Monitorear performance

```powershell
# Ver latencias reales
python test_suite_enterprise.py | Select-String "Latencia"
```

### 4. Testing en Staging

```powershell
# Configurar URL de staging
$env:API_URL = "https://staging.nexuspos.com"
python test_suite_enterprise.py
```

### 5. Alertas automáticas

```python
# En test_suite_enterprise.py, agregar:
if errors > 0:
    send_slack_alert(f"❌ {errors} tests fallidos")
```

---

## 📈 Métricas de Éxito

### Criterios de Producción

Para ir a producción, todos los tests deben cumplir:

| Nivel | Criterio | Target |
|-------|----------|--------|
| 1 | Latencia API | < 100ms |
| 1 | Latencia DB | < 50ms |
| 1 | Latencia Redis | < 5ms |
| 2 | Stock exacto | 100% exactitud |
| 3 | Audit logs | 100% cobertura |
| 4 | Impresión | 99% éxito |
| 5 | Resiliencia AFIP | 100% ventas |
| 6 | Race conditions | 0 overselling |

### Reporte Mensual

```
Mes: Noviembre 2025
────────────────────
NIVEL 1: 100% (40/40 tests)
NIVEL 2: 100% (40/40 tests)
NIVEL 3: 95% (38/40 tests) ⚠️
NIVEL 4: 90% (36/40 tests) ⚠️
NIVEL 5: 100% (40/40 tests)
NIVEL 6: 100% (40/40 tests)

Total: 97.5% (234/240 tests)
```

---

## 🚨 Checklist Pre-Producción

- [ ] **NIVEL 1**: Todos los servicios responden < 100ms
- [ ] **NIVEL 2**: Stock se descuenta exactamente
- [ ] **NIVEL 3**: Audit logs capturan todos los cambios
- [ ] **NIVEL 4**: Blend Agent imprime tickets
- [ ] **NIVEL 5**: Sistema funciona sin AFIP
- [ ] **NIVEL 6**: 0 casos de overselling en stress test

**SI TODOS ✅ → READY FOR PRODUCTION**

---

**Última actualización**: 26 de noviembre de 2025  
**Versión**: 1.0.0  
**Mantenedor**: Nexus POS Team
