# 🧪 Nexus POS - Enterprise Testing Suite

Suite completa de testing de 6 niveles: desde health checks hasta race conditions.

## 📋 Requisitos

```bash
pip install httpx redis psycopg2-binary pika colorama python-dotenv
```

## 🚀 Ejecución Rápida

```bash
# Ejecutar todos los niveles
python test_suite_enterprise.py
```

## 🧪 Los 6 Niveles de Testing

### 🟢 NIVEL 1: LA SALUD DEL MOTOR (Health & Smoke Tests)
**Objetivo**: Verificar que todos los servicios responden.

**Tests**:
- ✅ API Health Check (< 100ms)
- ✅ Database Connection (Supabase, < 50ms)
- ✅ Redis Connection (< 5ms)
- ✅ RabbitMQ Connection

**Comando Manual**:
```bash
curl -X GET http://localhost:8001/api/v1/health
```

**Éxito**: `{"status": "ok", "db": "connected", "redis": "connected"}`

---

### 💵 NIVEL 2: EL FLUJO DE CAJA (The Happy Path)
**Objetivo**: Vender una remera y que stock + plata coincidan.

**Tests**:
1. Crear "Remera Test" con stock 10
2. Vender 2 unidades
3. Validar stock = 8 (NO PUEDE SER 7 NI 9)
4. Verificar entrada en payments

**Comando Manual**:
```bash
# 1. Login
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexuspos.com","password":"admin123"}'

# 2. Crear producto
curl -X POST http://localhost:8001/api/v1/productos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Remera Test","precio":5000,"stock":10,"codigo":"REM-001"}'

# 3. Vender 2 unidades
curl -X POST http://localhost:8001/api/v1/ventas/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"items":[{"producto_id":"xxx","cantidad":2,"precio_unitario":5000}],"metodo_pago":"efectivo","total":10000}'

# 4. Verificar stock
curl -X GET http://localhost:8001/api/v1/productos/{id} \
  -H "Authorization: Bearer $TOKEN"
```

**Éxito**: Stock = 8 exactos.

---

### 🕵️‍♂️ NIVEL 3: EL AGENTE DOBLE (Auditoría y Seguridad)
**Objetivo**: Detectar modificaciones maliciosas.

**Tests**:
1. Cambiar precio de $20.000 a $10 (sospechoso)
2. Verificar registro en `audit_logs`

**Comando Manual (SQL)**:
```sql
SELECT * FROM audit_logs 
WHERE resource_type = 'productos' 
  AND action = 'UPDATE'
ORDER BY created_at DESC 
LIMIT 1;
```

**Éxito**: Ver JSON con:
```json
{
  "old_value": 20000,
  "new_value": 10,
  "user_id": "xxx",
  "timestamp": "2025-11-26..."
}
```

---

### 🖨️ NIVEL 4: EL PUENTE DE HARDWARE (Blend Agent Go)
**Objetivo**: Imprimir ticket fiscal desde web.

**Tests**:
1. Health check del agente (localhost:8080)
2. Detectar impresoras
3. Imprimir ticket de prueba

**Comando Manual**:
```bash
# 1. En una terminal, correr el agente
cd blend-agent
go run cmd/main.go

# 2. En otra terminal, probar impresión
curl -X POST http://localhost:8080/api/print/fiscal \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"description":"REMERA TEST","quantity":1,"unit_price":5000,"tax_rate":21}
    ],
    "payment": {"method":"efectivo","amount":5000}
  }'
```

**Éxito**: Consola del agente muestra:
```
🖨️  Imprimiendo ticket fiscal Epson...
✅ Ticket fiscal Epson impreso correctamente
```

---

### 💥 NIVEL 5: CAOS & RESILIENCIA (La prueba AFIP)
**Objetivo**: Sistema funciona aunque AFIP esté caído.

**Tests**:
1. Simular AFIP down (desconectar internet)
2. Hacer venta
3. Verificar que NO falla
4. Reconectar internet
5. Verificar que worker reintenta y obtiene CAE

**Comando Manual**:
```bash
# 1. Ver logs del worker AFIP
docker logs -f nexuspos-worker

# 2. Desconectar internet
# (Deshabilitar adaptador de red)

# 3. Hacer venta (debe funcionar)
curl -X POST http://localhost:8001/api/v1/ventas/checkout ...

# 4. Reconectar internet

# 5. Ver logs del worker
# Debe mostrar:
#   ⚠️  Error conectando a AFIP. Reintentando en 5s...
#   ⚠️  Error conectando a AFIP. Reintentando en 10s...
#   ✅ CONEXIÓN EXITOSA. CAE ASIGNADO: 123456789
```

**Éxito**: Venta NO falla + CAE obtenido minutos después.

---

### 🏎️ NIVEL 6: LA CARRERA (Concurrency / Race Condition)
**Objetivo**: Evitar overselling en Hot Sale.

**Tests**:
1. Producto con stock = 1
2. 2 clientes comprando AL MISMO TIEMPO
3. Uno debe dar 200 OK
4. El otro debe dar 409 CONFLICT

**Comando Manual**:
```bash
# Script de prueba
python << 'EOF'
import asyncio
import httpx

async def comprar():
    async with httpx.AsyncClient() as client:
        return await client.post(
            "http://localhost:8001/api/v1/ventas/checkout",
            headers={"Authorization": "Bearer $TOKEN"},
            json={"items":[{"producto_id":"xxx","cantidad":1,"precio_unitario":1000}],"metodo_pago":"efectivo","total":1000}
        )

async def main():
    results = await asyncio.gather(comprar(), comprar())
    print([r.status_code for r in results])

asyncio.run(main())
EOF
```

**Éxito**: Output `[200, 409]` o `[409, 200]`  
**Fallo CRÍTICO**: Output `[200, 200]` (vendiste lo que no tenés)

---

## 📊 Interpretación de Resultados

### ✅ Verde (Success)
- Todo OK
- Sistema funciona como debe

### ⚠️ Amarillo (Warning)
- Funciona pero con latencia alta
- O requiere implementación adicional

### ❌ Rojo (Error)
- Test falló
- Revisar código o infraestructura

---

## 🔧 Troubleshooting

### Error: "Connection Refused"
**Causa**: Servicio no está corriendo.

**Solución**:
```bash
# API
cd core-api
uvicorn main:app --reload --port 8001

# Blend Agent
cd blend-agent
go run cmd/main.go

# Docker services
docker-compose up -d
```

### Error: "Token inválido"
**Causa**: Usuario no existe o password incorrecto.

**Solución**:
```bash
# Verificar que exista usuario admin
# En psql o pgAdmin:
SELECT * FROM users WHERE email = 'admin@nexuspos.com';

# Si no existe, crearlo via script seed
python core-api/scripts/seed_demo_data.py
```

### Error: "Stock incorrecto"
**Causa**: Posible race condition o doble descuento.

**Solución**:
```python
# En models.py, verificar que haya lock en updates:
# UPDATE productos SET stock = stock - :cantidad WHERE id = :id AND stock >= :cantidad
```

---

## 📈 Reporte de Coverage

Al finalizar, la suite muestra:

```
📊 REPORTE FINAL
================================================================================

✅ Exitosos: 15
❌ Fallidos: 2
⚠️  Warnings: 3
📊 Total: 20

⚠️  ALGUNOS TESTS FALLARON - REVISAR
```

**Target**: 100% de tests en verde antes de ir a producción.

---

## 🚀 Integración con CI/CD

Agregar a `.github/workflows/ci.yml`:

```yaml
- name: Run Enterprise Test Suite
  run: |
    python test_suite_enterprise.py
```

---

## 📝 Notas de Producción

1. **NIVEL 1** es obligatorio antes de cada deploy
2. **NIVEL 2** valida el core del negocio
3. **NIVEL 3** es crítico para compliance (auditoría)
4. **NIVEL 4** requiere hardware físico (mock en CI)
5. **NIVEL 5** requiere simulación de fallas (no en CI)
6. **NIVEL 6** detecta bugs de concurrencia (ejecutar en staging)

---

**Última actualización**: 26 de noviembre de 2025  
**Versión**: 1.0.0  
**Mantenedor**: Nexus POS Team
