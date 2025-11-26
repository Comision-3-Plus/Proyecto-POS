# 🧪 GUÍA RÁPIDA DE TESTING - MÓDULO 4

## 🚀 INICIO RÁPIDO

### 1. Levantar todos los servicios

```powershell
# Iniciar servicios base
docker-compose up -d db redis rabbitmq

# Esperar health checks
Start-Sleep -Seconds 10

# Verificar estado
docker-compose ps
```

**Salida esperada:**
```
NAME                   STATUS
super_pos_db          Up 10 seconds (healthy)
blend_redis           Up 10 seconds (healthy)
rabbitmq              Up 10 seconds (healthy)
```

---

### 2. Iniciar Core API (Python)

```powershell
cd core-api

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Ejecutar migraciones
alembic upgrade head

# Crear super admin (si no existe)
python scripts\create_super_admin.py

# Iniciar API
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verificar:**
```powershell
curl http://localhost:8000/api/v1/health
```

---

### 3. Iniciar Sales Worker (Python)

```powershell
# Nueva terminal PowerShell
cd core-api

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Ejecutar worker
python workers\sales_worker.py
```

**Output esperado:**
```
======================================================================
🐰 SALES WORKER - Sistema Nervioso Blend POS
======================================================================
📡 Conectando a RabbitMQ: amqp://user:pass@localhost:5672/
💾 Conectando a PostgreSQL: localhost:5432
🎯 Escuchando eventos: sales.created
======================================================================

✅ Worker iniciado - Presiona Ctrl+C para detener
```

---

### 4. Iniciar Shopify Worker (Go)

```powershell
# Nueva terminal PowerShell
cd worker-service

# Descargar dependencias (primera vez)
go mod download

# Ejecutar worker
go run cmd\worker\main.go
```

**Output esperado:**
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🔥 BLEND POS - SHOPIFY/MELI SYNC WORKER 🔥                 ║
║                                                               ║
║   Módulo 4: Event-Driven Architecture                        ║
║   Escucha eventos de venta y sincroniza con marketplaces     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

🔧 Configuración cargada:
   🐰 RabbitMQ: amqp://user:pass@localhost:5672/
   📦 Queue: queue.sales.created
   🛍️ Shopify: https://blend-pos.myshopify.com
   🛒 MercadoLibre: https://api.mercadolibre.com
   🆔 Worker ID: shopify-worker-1
🔌 Conectando a RabbitMQ...
✅ Conectado a RabbitMQ exitosamente
🎧 Escuchando eventos en cola [queue.sales.created]... Esperando ventas.
✅ Worker iniciado correctamente
👀 Presiona Ctrl+C para detener...
```

---

## 🧪 EJECUTAR TEST E2E

### Test completo de Módulo 3

```powershell
python test_sistema_nervioso.py
```

**Flujo del test:**
```
1. Login como super admin
2. Obtener/Crear tienda
3. Crear productos de prueba
4. Warmup de cache en Redis
5. Obtener estadísticas de Redis
6. Ejecutar checkout (< 50ms)
7. Esperar worker (3 segundos)
8. Verificar stock actualizado
9. Verificar inventory ledger
```

**Output esperado:**
```
🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪
TEST E2E: MÓDULO 3 - SISTEMA NERVIOSO
🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪

======================================================================
PASO 1: LOGIN COMO SUPER ADMIN
======================================================================
✅ Login exitoso - Token: eyJhbGciOiJIUzI1NiIs...

======================================================================
PASO 2: OBTENER/CREAR TIENDA
======================================================================
✅ Usando tienda existente: 123e4567-e89b-12d3-a456-426614174000

======================================================================
PASO 3: CREAR PRODUCTOS DE PRUEBA
======================================================================
✅ Producto creado: TEST-NERVIOSO-1 (ID: uuid-1)
✅ Producto creado: TEST-NERVIOSO-2 (ID: uuid-2)
✅ Producto creado: TEST-NERVIOSO-3 (ID: uuid-3)

======================================================================
PASO 4: WARMUP DE CACHE (Redis)
======================================================================
✅ Cache warmed: 3 productos
ℹ️  ✅ Cache calentado: 3 productos en Redis

======================================================================
PASO 5: ESTADÍSTICAS DE CACHE (Redis)
======================================================================
✅ Estadísticas obtenidas:
   📊 Total Keys: 3
   💾 Memoria Usada: 0.12 MB
   ✅ Hits: 0
   ❌ Misses: 0
   📈 Hit Rate: 0.0%

======================================================================
PASO 6: CHECKOUT EVENT-DRIVEN (Redis + RabbitMQ)
======================================================================
ℹ️  Comprando:
   - Producto 1: 2 unidades
   - Producto 2: 1 unidad
✅ Checkout completado en 42.35ms
   💰 Total: $300.00
   💳 Método: EFECTIVO
   📦 Items: 2
   📝 Mensaje: ✅ Venta reservada - procesando en segundo plano
✅ ⚡ Latencia < 50ms (EXCELENTE)

======================================================================
PASO 7: ESPERANDO WORKER (PostgreSQL + Ledger)
======================================================================
ℹ️  Esperando 3 segundos para que worker procese evento...
   ⏳ 3...
   ⏳ 2...
   ⏳ 1...
✅ Worker debería haber procesado el evento

======================================================================
PASO 8: VERIFICAR STOCK ACTUALIZADO (PostgreSQL)
======================================================================
✅ Producto 1: Stock correcto (48.0)
✅ Producto 2: Stock correcto (49.0)

======================================================================
PASO 9: VERIFICAR INVENTORY LEDGER
======================================================================
✅ Ledger obtenido: 1 entradas
✅ Entrada de VENTA encontrada:
   📅 Fecha: 2024-11-26T10:30:45.123456
   📦 Cantidad: -2.0
   📊 Stock Anterior: 50.0
   📊 Stock Nuevo: 48.0
   📝 Descripción: Venta #uuid - Producto Test Nervioso 1...

======================================================================
✅ TEST E2E COMPLETADO EXITOSAMENTE
======================================================================

📊 RESUMEN:
   - Tienda: 123e4567-e89b-12d3-a456-426614174000
   - Productos creados: 3
   - Venta procesada con event-driven architecture
   - Stock actualizado correctamente
   - Ledger registrado

🎉 El Sistema Nervioso funciona perfectamente!
```

---

## 🔍 VERIFICACIÓN MANUAL

### 1. Verificar RabbitMQ Management UI

```powershell
# Abrir en navegador
Start-Process "http://localhost:15672"
# User: user
# Pass: pass
```

**Verificar:**
- Exchange: `blend_events` (tipo: topic)
- Queue: `queue.sales.created` (consumers: 2)
- Bindings: `sales.created` → `queue.sales.created`

---

### 2. Verificar Redis Cache

```powershell
# Conectar a Redis CLI
docker exec -it blend_redis redis-cli

# Ver todas las keys
KEYS *

# Ver stock de un producto
GET "stock:tienda-id:producto-id"

# Ver estadísticas
INFO stats
```

---

### 3. Verificar PostgreSQL

```powershell
# Conectar a PostgreSQL
docker exec -it super_pos_db psql -U nexuspos -d nexus_pos

# Ver últimas ventas
SELECT id, total, metodo_pago, fecha 
FROM venta 
ORDER BY fecha DESC 
LIMIT 5;

# Ver inventory ledger
SELECT producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, fecha
FROM inventory_ledger
ORDER BY fecha DESC
LIMIT 10;
```

---

## 📊 MONITOREO EN TIEMPO REAL

### Logs de API (Python)

```powershell
# Terminal donde corre uvicorn
# Los logs aparecen automáticamente
```

**Buscar:**
- `🐰 Evento publicado` → Evento enviado a RabbitMQ
- `✅ Venta reservada` → Checkout exitoso

---

### Logs de Sales Worker (Python)

```powershell
# Terminal donde corre sales_worker.py
```

**Buscar:**
- `📥 Mensaje recibido` → Evento consumido
- `✅ Venta {id} procesada exitosamente` → Escritura en DB OK

---

### Logs de Shopify Worker (Go)

```powershell
# Terminal donde corre worker Go
```

**Buscar:**
- `📥 Mensaje recibido` → Evento consumido
- `🛍️ [SHOPIFY] Procesando venta` → Inicio de procesamiento
- `✅ Stock actualizado en Shopify` → Sync OK
- `✨ [SHOPIFY] Venta sincronizada exitosamente` → Proceso completo

---

## 🧪 TESTS ADICIONALES

### Test de Carga (opcional)

```powershell
# Instalar Apache Bench (si no está instalado)
# Descargar de https://httpd.apache.org/download.cgi

# Ejecutar test de carga
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" -H "X-Tienda-ID: $TIENDA_ID" -T "application/json" -p checkout_payload.json http://localhost:8000/api/v1/ventas/checkout
```

**checkout_payload.json:**
```json
{
  "items": [
    {"producto_id": "uuid-1", "cantidad": 1}
  ],
  "metodo_pago": "EFECTIVO"
}
```

---

### Test de Failover

#### 1. Caída de RabbitMQ

```powershell
# Detener RabbitMQ
docker-compose stop rabbitmq

# Intentar checkout (debe fallar gracefully)
curl -X POST http://localhost:8000/api/v1/ventas/checkout ...

# Reiniciar RabbitMQ
docker-compose start rabbitmq

# Workers se reconectan automáticamente
```

#### 2. Caída de Redis

```powershell
# Detener Redis
docker-compose stop redis

# Intentar checkout (debe dar 503 - Cache miss)
curl -X POST http://localhost:8000/api/v1/ventas/checkout ...

# Reiniciar Redis
docker-compose start redis

# Ejecutar warmup
curl -X POST http://localhost:8000/api/v1/cache/warmup -H "Authorization: Bearer $TOKEN"

# Checkout debe funcionar
```

---

## 🔧 TROUBLESHOOTING

### Workers no arrancan

```powershell
# Ver logs de docker-compose
docker-compose logs -f

# Ver servicios corriendo
docker-compose ps

# Reiniciar servicios específicos
docker-compose restart rabbitmq
docker-compose restart redis
```

---

### Cola de RabbitMQ se llena

```powershell
# Ver profundidad de cola
docker exec -it rabbitmq rabbitmqctl list_queues name messages

# Purgar cola (CUIDADO: borra mensajes)
docker exec -it rabbitmq rabbitmqctl purge_queue queue.sales.created

# Escalar workers
# Abrir más terminales y ejecutar workers adicionales
```

---

### Redis sin memoria

```powershell
# Limpiar Redis
docker exec -it blend_redis redis-cli FLUSHDB

# Re-warmup
curl -X POST http://localhost:8000/api/v1/cache/warmup -H "Authorization: Bearer $TOKEN"
```

---

## ✅ CHECKLIST DE TESTING

### Antes de cada test
- [ ] Servicios corriendo (db, redis, rabbitmq)
- [ ] Core API iniciada (puerto 8000)
- [ ] Sales Worker corriendo (Python)
- [ ] Shopify Worker corriendo (Go)
- [ ] Warmup de Redis ejecutado

### Durante el test
- [ ] Checkout responde en < 50ms
- [ ] Logs de Sales Worker muestran procesamiento
- [ ] Logs de Shopify Worker muestran sincronización
- [ ] Stock actualizado en PostgreSQL
- [ ] Ledger registrado

### Después del test
- [ ] No hay mensajes en cola de RabbitMQ
- [ ] No hay mensajes en DLQ
- [ ] Redis hit rate > 90%
- [ ] Sin errores en logs

---

## 🎉 ¡LISTO!

Con esta guía puedes:
1. Levantar el stack completo
2. Ejecutar tests E2E
3. Monitorear en tiempo real
4. Debuggear problemas

**Próximo paso:** Deploy en producción con Docker Compose completo o Kubernetes.

---

**Autor:** Blend Development Team  
**Fecha:** Noviembre 2024  
**Versión:** 1.0
