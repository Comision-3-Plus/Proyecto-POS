# 🕵️ MÓDULO 2: LEGACY LEECHER

**OPERACIÓN: INFILTRACIÓN Y SINCRONIZACIÓN AUTOMÁTICA**

Sistema de sincronización en tiempo real desde ERPs legacy (Lince, Zoo Logic, Dragonfish) hacia Blend Core usando polling inteligente con SQL Server.

---

## 🎯 Objetivo

Leer datos de stock desde sistemas viejos **SIN TOCAR NADA**, sin permisos especiales, sin migración, y actualizar automáticamente el Inventory Ledger de Blend.

### ¿Por qué es necesario?

Los clientes ya tienen un sistema funcionando (Lince, Zoo Logic, etc.):
- ✅ Sus cajeros están acostumbrados
- ✅ Tienen años de datos históricos  
- ❌ Pero no pueden aprovechar las features de Blend (Ledger, Insights, Analytics)

**Solución:** El Legacy Agent "espía" sus cambios y los replica en Blend.

---

## 🏗️ Arquitectura

```
┌────────────────────────────────────────────────────────────┐
│                    SISTEMA CLIENTE                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │  SQL Server (Lince / Zoo Logic)                  │      │
│  │  ┌─────────────────────────────────────┐         │      │
│  │  │ STK_PRODUCTOS                        │         │      │
│  │  │  - CODIGO (SKU)                      │         │      │
│  │  │  - DESCRIPCION                       │         │      │
│  │  │  - PRECIO                            │         │      │
│  │  └─────────────────────────────────────┘         │      │
│  │  ┌─────────────────────────────────────┐         │      │
│  │  │ STK_SALDOS                           │         │      │
│  │  │  - CODIGO                            │         │      │
│  │  │  - TALLE / COLOR                     │         │      │
│  │  │  - CANTIDAD                          │         │      │
│  │  │  - FECHA_ULTIMO_MOVIMIENTO ◄─────────┼─┐       │      │
│  │  └─────────────────────────────────────┘ │       │      │
│  └──────────────────────────────────────────┼───────┘      │
└─────────────────────────────────────────────┼──────────────┘
                                              │
                                              │ WITH (NOLOCK)
                                              │ Polling cada 5s
┌─────────────────────────────────────────────▼──────────────┐
│             LEGACY AGENT (Go Service)                       │
│  ┌────────────────────────────────────────────────┐        │
│  │  1. Detecta cambios con watermark              │        │
│  │  2. Lee solo registros nuevos                  │        │
│  │  3. Transforma datos                           │        │
│  │  4. Envía a Blend API                          │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────┬──────────────┘
                                              │ HTTP POST
                                              │ /api/v1/sync/legacy
┌─────────────────────────────────────────────▼──────────────┐
│              BLEND CORE API (Python FastAPI)                │
│  ┌────────────────────────────────────────────────┐        │
│  │  POST /sync/legacy                             │        │
│  │  - Recibe datos del Agent                      │        │
│  │  - Busca/crea producto en Blend                │        │
│  │  - Calcula delta de stock                      │        │
│  │  - Escribe en Inventory Ledger                 │        │
│  └────────────────────────────────────────────────┘        │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │  INVENTORY LEDGER (PostgreSQL)                 │        │
│  │  - transaction_type: 'LEGACY_SYNC'             │        │
│  │  - delta: diferencia calculada                 │        │
│  │  - Stock siempre sincronizado ✅               │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Conceptos Clave

### 1. **WITH (NOLOCK)** - La Magia de No Bloquear

```sql
SELECT * FROM STK_SALDOS WITH (NOLOCK)
WHERE FECHA_ULTIMO_MOVIMIENTO > @watermark
```

**¿Qué hace?**
- Lee datos SIN poner locks en la tabla
- La cajera puede seguir vendiendo mientras el Agent lee
- NO afecta la performance del sistema cliente

**Riesgo:** Puede leer datos "sucios" (dirty read) en medio de una transacción.  
**Solución:** En retail esto no es problema. Si lee stock=10 cuando en realidad es 9, en el próximo polling (5 segundos) se corrige.

### 2. **Watermark / Checkpoint Pattern**

```go
var lastCheck time.Time = time.Now().Add(-24 * time.Hour)

for range ticker.C {
    // Solo leer cambios desde lastCheck
    query := `
        SELECT * FROM STK_SALDOS WITH (NOLOCK)
        WHERE FECHA_ULTIMO_MOVIMIENTO > @lastCheck
    `
    
    // Actualizar watermark al registro más nuevo
    for _, item := range items {
        if item.FechaMovimiento.After(lastCheck) {
            lastCheck = item.FechaMovimiento
        }
    }
}
```

**Ventajas:**
- No hace full scan en cada polling
- Solo procesa lo nuevo
- Escalable (millones de registros históricos no importan)

### 3. **Delta Calculation** - Integridad del Ledger

```python
# Stock actual en Blend (calculado desde ledger)
stock_blend = SUM(delta) WHERE variant_id = X AND location_id = Y

# Stock en legacy
stock_legacy = 15

# Delta a escribir en el ledger
delta = stock_legacy - stock_blend  # ej: 15 - 12 = +3

# Crear transacción
InventoryLedger(
    variant_id=X,
    location_id=Y,
    delta=+3,
    transaction_type='LEGACY_SYNC'
)
```

**¿Por qué no sobrescribir directamente?**
- El Ledger es **append-only** (NUNCA se actualiza)
- Cada cambio es una nueva línea
- Auditoría completa: sabemos CUÁNDO y CUÁNTO cambió

---

## 🚀 Flujo Completo (Ejemplo Real)

### Escenario:
En el local, el cajero vende 2 remeras negras talle M usando Lince.

### 1. **En el Sistema Legacy (SQL Server)**

```sql
-- Antes de la venta
SELECT * FROM STK_SALDOS 
WHERE CODIGO = 'REM-001' AND TALLE = 'M' AND COLOR = 'NEGRO';

CODIGO   | TALLE | COLOR | CANTIDAD | FECHA_ULTIMO_MOVIMIENTO
---------|-------|-------|----------|------------------------
REM-001  | M     | NEGRO | 15       | 2025-11-26 10:00:00
```

El cajero vende 2 unidades. Lince ejecuta:

```sql
UPDATE STK_SALDOS
SET CANTIDAD = CANTIDAD - 2,
    FECHA_ULTIMO_MOVIMIENTO = GETDATE()
WHERE CODIGO = 'REM-001' AND TALLE = 'M' AND COLOR = 'NEGRO';
```

Resultado:

```sql
CODIGO   | TALLE | COLOR | CANTIDAD | FECHA_ULTIMO_MOVIMIENTO
---------|-------|-------|----------|------------------------
REM-001  | M     | NEGRO | 13       | 2025-11-26 10:05:23
```

### 2. **Legacy Agent Detecta el Cambio**

```
[10:05:25] 🔍 Escaneando cambios desde 10:05:20...
[10:05:25] 🚨 DETECTADOS 1 CAMBIOS DE STOCK
```

Query ejecutada (con NOLOCK):

```sql
SELECT * FROM STK_SALDOS WITH (NOLOCK)
WHERE FECHA_ULTIMO_MOVIMIENTO > '2025-11-26 10:05:20'
```

Resultado:
```
REM-001 | M | NEGRO | 13 | 2025-11-26 10:05:23
```

### 3. **Agent Envía a Blend API**

```http
POST http://localhost:8000/api/v1/sync/legacy
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sku_legacy": "REM-001",
  "descripcion": "REMERA BASICA ALGODON",
  "talle": "M",
  "color": "NEGRO",
  "stock_real": 13.0,
  "ubicacion": "PRINCIPAL",
  "precio": 15000.0,
  "source": "LEGACY_AGENT",
  "fecha_movimiento": "2025-11-26T10:05:23Z"
}
```

### 4. **Blend Core API Procesa**

```python
# 1. Buscar variante en Blend
variant = find_variant_by_legacy_sku("REM-001", "M", "NEGRO")

# 2. Calcular stock actual en Blend desde ledger
stock_blend = calculate_stock_from_ledger(variant.id, location.id)
# Resultado: 15.0

# 3. Calcular delta
delta = 13.0 - 15.0 = -2.0

# 4. Escribir en ledger
InventoryLedger.create(
    variant_id=variant.id,
    location_id=location.id,
    delta=-2.0,
    transaction_type='LEGACY_SYNC',
    reference_doc='LEGACY_REM-001_2025-11-26T10:05:23Z',
    notes='Sincronización desde LEGACY_AGENT'
)
```

### 5. **Resultado en Blend**

```sql
-- Inventory Ledger (PostgreSQL)
SELECT * FROM inventory_ledger 
WHERE variant_id = '...' 
ORDER BY occurred_at DESC 
LIMIT 5;

transaction_id | delta | transaction_type | occurred_at
---------------|-------|------------------|-------------------
...uuid...     | -2.0  | LEGACY_SYNC      | 2025-11-26 10:05:25
...uuid...     | +15.0 | INITIAL_STOCK    | 2025-11-20 09:00:00
```

Stock calculado:
```sql
SELECT SUM(delta) FROM inventory_ledger 
WHERE variant_id = '...';

-- Resultado: 13.0 ✅
```

### 6. **Agent Log**

```
[10:05:25] ✅ Sincronizado: REM-001 | NEGRO M | Stock: 13.00
[10:05:25] 📊 Resultado: 1 exitosos, 0 errores
```

---

## 🧪 Testing

### Setup

1. **Levantar SQL Server Simulator**

```bash
docker-compose up -d legacy_db
```

2. **Inicializar datos legacy**

Los scripts en `legacy-sim/init.sql` se ejecutan automáticamente.

Verificar:

```bash
docker exec -it lince_simulator /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P Password123! -d LinceIndumentaria \
  -Q "SELECT COUNT(*) FROM STK_PRODUCTOS"
```

3. **Configurar Legacy Agent**

```bash
cd worker-service/legacy-agent
cp .env.example .env
```

Editar `.env`:
```env
TIENDA_ID=<UUID_DE_TU_TIENDA>
BLEND_API_TOKEN=<TOKEN_DEL_LOGIN>
```

4. **Iniciar Blend Core API**

```bash
cd core-api
uvicorn main:app --reload
```

5. **Iniciar Legacy Agent**

```bash
cd worker-service/legacy-agent
go run main.go
```

### Test Manual

**Simular una venta en el sistema legacy:**

```sql
-- En SQL Server (Lince)
EXEC sp_SimularVenta 
    @Codigo = 'REM-001', 
    @Talle = 'M', 
    @Color = 'NEGRO', 
    @Cantidad = 2;
```

**Observar logs del Agent:**

```
🚨 DETECTADOS 1 CAMBIOS DE STOCK
✅ Sincronizado: REM-001 | NEGRO M | Stock: 11.00
```

**Verificar en Blend:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/productos/variants/{variant_id}/stock
```

---

## 🔧 Configuración Avanzada

### Variables de Entorno del Agent

| Variable | Descripción | Default |
|----------|-------------|---------|
| `LEGACY_CONN_STRING` | Connection string de SQL Server | `server=localhost;user id=sa;...` |
| `BLEND_API_URL` | URL de Blend Core API | `http://localhost:8000/api/v1` |
| `BLEND_API_TOKEN` | Token JWT para autenticación | (requerido) |
| `TIENDA_ID` | UUID de la tienda en Blend | (requerido) |
| `POLLING_INTERVAL` | Intervalo de polling | `5s` |
| `BATCH_SIZE` | Registros por batch | `100` |

### Performance Tuning

**Para sistemas con alto volumen:**

```env
POLLING_INTERVAL=10s  # Reducir frecuencia
BATCH_SIZE=500        # Procesar más por iteración
```

**Para sincronización en tiempo real:**

```env
POLLING_INTERVAL=2s   # Aumentar frecuencia
BATCH_SIZE=50         # Batches más pequeños
```

---

## 🚨 Troubleshooting

### El Agent no detecta cambios

**Verificar que `FECHA_ULTIMO_MOVIMIENTO` se actualiza:**

```sql
SELECT TOP 10 * FROM STK_SALDOS 
ORDER BY FECHA_ULTIMO_MOVIMIENTO DESC;
```

Si la fecha no cambia, el sistema legacy no está actualizando ese campo.

**Solución:** Modificar la query para usar otro watermark (ej: un campo de audit log).

### Stock duplicado en Blend

**Causa:** La misma transacción legacy se procesa 2 veces.

**Solución:** Implementar idempotencia en el endpoint usando `reference_doc`:

```python
# Verificar si ya existe esa transacción
existing = session.query(InventoryLedger).filter_by(
    reference_doc=f"LEGACY_{sku}_{timestamp}"
).first()

if existing:
    return {"message": "Ya procesado"}
```

### API retorna 401

**Causa:** Token expirado.

**Solución:** Renovar token:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexuspos.com","password":"admin123"}' \
  | jq -r '.access_token'
```

---

## 📊 Monitoreo y Observabilidad

### Métricas Clave

- **Latencia del polling**: Tiempo entre cambio en legacy y sync en Blend
- **Tasa de error**: % de sincronizaciones fallidas
- **Throughput**: Transacciones procesadas por segundo
- **Lag del watermark**: Diferencia entre NOW() y último registro procesado

### Logs Estructurados

El Agent usa logging estructurado:

```json
{
  "timestamp": "2025-11-26T10:05:25Z",
  "level": "INFO",
  "message": "Sincronizado",
  "sku": "REM-001",
  "talle": "M",
  "color": "NEGRO",
  "stock": 13.0,
  "delta": -2.0
}
```

### Alertas Recomendadas

- ⚠️ Si el Agent no procesa cambios en > 5 minutos
- 🚨 Si la tasa de error > 5%
- 📉 Si el lag del watermark > 1 hora

---

## 🔒 Seguridad

### ✅ Garantías

1. **Read-Only**: El Agent NUNCA escribe en el sistema legacy
2. **Non-Blocking**: Usa `WITH (NOLOCK)` para no afectar performance
3. **Autenticación**: Requiere token JWT válido para Blend API
4. **Multi-Tenant**: Isolation por `tienda_id`

### ⚠️ Consideraciones

- El token debe rotarse periódicamente
- Connection string del legacy debe estar encriptado en producción
- Usar VPN o red privada para conexión a SQL Server del cliente

---

## 🎓 Lecciones Aprendidas

### ✅ Qué funciona bien

- **Polling simple**: Más robusto que webhooks (el legacy no los soporta)
- **Watermark por fecha**: Escalable y eficiente
- **NOLOCK**: No impacta al cliente
- **Auto-creación de productos**: Menos configuración manual

### ❌ Qué NO hacer

- ❌ No usar triggers en SQL Server del cliente (difícil de debuggear)
- ❌ No intentar "sincronización bidireccional" (complejidad exponencial)
- ❌ No hacer full scan en cada polling (no escala)

---

## 🚀 Próximos Pasos

1. ✅ Polling básico funcionando
2. ⏳ Idempotencia con reference_doc
3. ⏳ Dashboard de sincronización en tiempo real
4. ⏳ Alertas automáticas si hay problemas
5. ⏳ Soporte para otros sistemas legacy (no solo Lince)

---

## 📚 Referencias

- [Inventory Ledger Architecture](./ARQUITECTURA_HIBRIDA_ANALISIS.md)
- [Legacy Simulator Setup](../legacy-sim/README.md)
- [Legacy Agent Code](../worker-service/legacy-agent/README.md)
- [API Sync Endpoint](../core-api/api/routes/sync.py)

---

**¡SISTEMA LISTO PARA INFILTRARSE EN LA COMPETENCIA! 🔥**
