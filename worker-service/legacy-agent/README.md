# 🕵️ Legacy Agent - Data Synchronization Service

**OPERACIÓN: LEGACY LEECHER**

Agente en Go que sincroniza datos desde sistemas ERP legacy (Lince, Zoo Logic, Dragonfish) hacia Blend Core usando polling inteligente.

## 🎯 Características

- ✅ **Polling Inteligente**: Solo lee cambios desde el último watermark
- ✅ **WITH (NOLOCK)**: No bloquea las operaciones del sistema legacy
- ✅ **Incremental**: Rastrea `FECHA_ULTIMO_MOVIMIENTO` para evitar full scans
- ✅ **Resiliente**: Maneja errores y reintentos automáticos
- ✅ **Performance**: Procesa en batches configurables
- ✅ **Seguro**: No modifica datos en el sistema legacy (read-only)

## 🏗️ Arquitectura

```
┌─────────────────────┐
│   SQL Server        │
│   (Lince Legacy)    │
│   STK_PRODUCTOS     │
│   STK_SALDOS ◄──────┼────┐
└─────────────────────┘    │
                           │ WITH (NOLOCK)
                           │ Polling cada 5s
┌─────────────────────┐    │
│  Legacy Agent (Go)  │────┘
│  - Detecta cambios  │
│  - Transforma data  │────┐
│  - Envía a Blend    │    │
└─────────────────────┘    │ HTTP POST
                           │ /api/v1/sync/legacy
┌─────────────────────┐    │
│   Blend Core API    │◄───┘
│   (Python FastAPI)  │
│   - Valida datos    │
│   - Escribe Ledger  │
└─────────────────────┘
```

## 🚀 Quick Start

### 1. Prerrequisitos

- Go 1.21+
- SQL Server legacy corriendo (o usar el simulador con Docker)
- Blend Core API corriendo

### 2. Instalación

```bash
cd worker-service/legacy-agent
go mod download
```

### 3. Configuración

Copiar el archivo de ejemplo:

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
LEGACY_CONN_STRING=server=localhost;user id=sa;password=Password123!;port=1433;database=LinceIndumentaria
BLEND_API_URL=http://localhost:8000/api/v1
BLEND_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Token del login
TIENDA_ID=123e4567-e89b-12d3-a456-426614174000
POLLING_INTERVAL=5s
```

#### Obtener el Token de Autenticación

```bash
# Login en Blend Core
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexuspos.com","password":"admin123"}'

# Copiar el access_token de la respuesta
```

#### Obtener el TIENDA_ID

```bash
# Listar tiendas (con token de super_admin)
curl -X GET http://localhost:8000/api/v1/admin/tiendas \
  -H "Authorization: Bearer YOUR_TOKEN"

# Copiar el 'id' de la tienda que quieras sincronizar
```

### 4. Ejecutar

```bash
go run main.go
```

Salida esperada:

```
🕵️ LEGACY AGENT iniciado
📡 Conectado a: sqlserver://***:***@localhost:1433/LinceIndumentaria
🎯 Blend API: http://localhost:8000/api/v1
⏱️  Polling interval: 5s
👀 Iniciando vigilancia...
🔍 Escaneando cambios desde 10:30:45...
   ✅ No hay cambios
🔍 Escaneando cambios desde 10:30:50...
🚨 DETECTADOS 3 CAMBIOS DE STOCK
   ✅ Sincronizado: REM-001 | NEGRO M | Stock: 13.00
   ✅ Sincronizado: JEAN-505 | AZUL 40 | Stock: 8.00
   ✅ Sincronizado: BUZO-HOOD | GRIS L | Stock: 6.00
📊 Resultado: 3 exitosos, 0 errores
```

## 🧪 Testing

### Usando el Simulador SQL Server

1. Levantar el contenedor:

```bash
docker-compose up -d legacy_db
```

2. Simular una venta:

```bash
# Conectarse a SQL Server
docker exec -it lince_simulator /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P Password123! -d LinceIndumentaria

# Ejecutar el stored procedure
EXEC sp_SimularVenta @Codigo = 'REM-001', @Talle = 'M', @Color = 'NEGRO', @Cantidad = 2;
GO
```

3. Observar los logs del Agent:

```bash
# El agent debería detectar el cambio en el próximo polling
🚨 DETECTADOS 1 CAMBIOS DE STOCK
   ✅ Sincronizado: REM-001 | NEGRO M | Stock: 11.00
```

### Consultar Cambios Manualmente

```sql
-- Ver cambios en los últimos 10 minutos
SELECT 
    s.CODIGO,
    p.DESCRIPCION,
    s.TALLE,
    s.COLOR,
    s.CANTIDAD,
    s.FECHA_ULTIMO_MOVIMIENTO
FROM STK_SALDOS s WITH (NOLOCK)
JOIN STK_PRODUCTOS p ON s.CODIGO = p.CODIGO
WHERE s.FECHA_ULTIMO_MOVIMIENTO > DATEADD(MINUTE, -10, GETDATE())
ORDER BY s.FECHA_ULTIMO_MOVIMIENTO DESC;
```

## 📊 Monitoreo

### Métricas que el Agent expone (futuro)

- Total de registros sincronizados
- Errores por minuto
- Latencia del polling
- Último watermark procesado

### Logs

El agent usa logging estructurado. Niveles:

- `INFO`: Operaciones normales
- `WARN`: Errores recuperables
- `ERROR`: Errores críticos

## 🔧 Troubleshooting

### Error: No puede conectarse a SQL Server

```
❌ Error conectando a SQL Server: login error: mssql: Login failed for user 'sa'
```

**Solución:**
- Verificar que SQL Server esté corriendo: `docker ps | grep lince`
- Verificar credenciales en `.env`
- Verificar firewall (puerto 1433)

### Error: TIENDA_ID no configurado

```
❌ TIENDA_ID no configurado. Set TIENDA_ID en .env
```

**Solución:**
- Obtener el UUID de la tienda desde Blend API
- Configurar en `.env`

### Error: API retorna 401 Unauthorized

```
❌ Error API: 401 - {"detail":"Not authenticated"}
```

**Solución:**
- Verificar que `BLEND_API_TOKEN` esté configurado
- Hacer login nuevamente para obtener un token válido

### Error: API retorna 404 Not Found

```
❌ Error API: 404 - {"detail":"Endpoint /sync/legacy not found"}
```

**Solución:**
- El endpoint aún no está implementado en Blend Core
- Ver siguiente sección

## 🚧 Próximos Pasos

1. Implementar endpoint `POST /api/v1/sync/legacy` en Blend Core
2. Lógica de matching: SKU legacy → Variant ID en Blend
3. Escribir en el Inventory Ledger
4. Manejo de conflictos (si hay venta simultánea en ambos sistemas)
5. Dashboard de sincronización en tiempo real

## 📚 Documentación Adicional

- [Arquitectura del Sistema](../../docs/LEGACY_LEECHER.md)
- [Simulador SQL Server](../../legacy-sim/README.md)
- [API de Sincronización](../../core-api/api/routes/sync.py)

## 🔒 Seguridad

- ✅ El agent NUNCA modifica datos en el sistema legacy
- ✅ Usa read-only queries con `WITH (NOLOCK)`
- ✅ Token de autenticación para Blend API
- ✅ Passwords nunca se loguean

## 📜 Licencia

MIT
