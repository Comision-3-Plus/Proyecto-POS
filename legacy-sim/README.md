# 🕵️ Legacy Simulator - Lince/Zoo Logic Mock

Este directorio contiene la simulación de un sistema ERP viejo (Lince, Zoo Logic, Dragonfish) usando SQL Server.

## 🎯 Propósito

Simular un sistema legacy para poder testear el **Legacy Agent** sin necesidad de conectarse a un sistema real de un cliente.

## 🗂️ Estructura de la BD

### Tablas Principales

#### `STK_PRODUCTOS`
Catálogo de productos con diseño arcaico típico de los 2000s.

```sql
CODIGO         varchar(50)  -- SKU viejo
DESCRIPCION    varchar(200) -- Nombre del producto
RUBRO          varchar(50)  -- Categoría
PRECIO         money        -- Precio de venta
COSTO          money        -- Precio de costo
MARCA          varchar(50)  -- Marca del producto
PROVEEDOR      varchar(100) -- Proveedor
FECHA_MODIFICACION datetime
ACTIVO         bit
```

#### `STK_SALDOS`
Matriz de stock separada (diseño horrible pero común).

```sql
ID                      int IDENTITY(1,1)
CODIGO                  varchar(50)  -- FK a STK_PRODUCTOS
TALLE                   varchar(10)  -- Puede ser NULL
COLOR                   varchar(20)  -- Puede ser NULL
CANTIDAD                decimal(10,2)
SUCURSAL                varchar(10)
FECHA_ULTIMO_MOVIMIENTO datetime     -- ⚡ KEY para polling
USUARIO_MODIFICACION    varchar(50)
```

## 🚀 Uso

### 1. Levantar el Contenedor

```bash
docker-compose up -d legacy_db
```

### 2. Verificar que esté corriendo

```bash
docker ps | grep lince_simulator
```

### 3. Conectarse a la BD

**Credenciales:**
- **Host:** localhost
- **Port:** 1433
- **User:** sa
- **Password:** Password123!
- **Database:** LinceIndumentaria

**Con Azure Data Studio / DBeaver:**
```
Server: localhost,1433
Authentication: SQL Login
User: sa
Password: Password123!
```

**Con sqlcmd (dentro del contenedor):**
```bash
docker exec -it lince_simulator /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P Password123! -d LinceIndumentaria
```

### 4. Consultar Datos

```sql
-- Ver todos los productos
SELECT * FROM STK_PRODUCTOS;

-- Ver stock actual
SELECT 
    s.CODIGO,
    p.DESCRIPCION,
    s.TALLE,
    s.COLOR,
    s.CANTIDAD,
    s.FECHA_ULTIMO_MOVIMIENTO
FROM STK_SALDOS s
JOIN STK_PRODUCTOS p ON s.CODIGO = p.CODIGO
ORDER BY s.FECHA_ULTIMO_MOVIMIENTO DESC;
```

## 🧪 Testing

### Simular una Venta

Para testear que el Legacy Agent detecta cambios:

```sql
-- Ejecutar el stored procedure
EXEC sp_SimularVenta 
    @Codigo = 'REM-001', 
    @Talle = 'M', 
    @Color = 'NEGRO', 
    @Cantidad = 2;
```

Esto:
1. Resta 2 unidades del stock
2. Actualiza `FECHA_ULTIMO_MOVIMIENTO` a NOW()
3. El Legacy Agent lo detectará en el próximo polling

### Ver Cambios Recientes

```sql
-- Cambios en los últimos 5 minutos
SELECT 
    s.CODIGO,
    p.DESCRIPCION,
    s.TALLE,
    s.COLOR,
    s.CANTIDAD,
    s.FECHA_ULTIMO_MOVIMIENTO
FROM STK_SALDOS s
JOIN STK_PRODUCTOS p ON s.CODIGO = p.CODIGO
WHERE s.FECHA_ULTIMO_MOVIMIENTO > DATEADD(MINUTE, -5, GETDATE())
ORDER BY s.FECHA_ULTIMO_MOVIMIENTO DESC;
```

## 🔧 Mantenimiento

### Reiniciar la BD

```bash
docker-compose down legacy_db
docker volume rm proyecto-pos-blend_legacy_db_data
docker-compose up -d legacy_db
```

Esto recreará la BD con los datos iniciales del script `init.sql`.

### Logs

```bash
docker logs -f lince_simulator
```

## 📊 Datos Semilla

La BD viene pre-cargada con:

- **8 productos** de indumentaria
- **22 variantes** con diferentes talles/colores
- **1 stored procedure** para simular ventas

## 🚨 Notas Importantes

- Esta BD usa `WITH (NOLOCK)` en las queries del Agent para no bloquear operaciones
- La columna `FECHA_ULTIMO_MOVIMIENTO` es el "watermark" para el polling incremental
- El diseño es intencionalmente arcaico para simular sistemas reales legacy

## 🔗 Próximo Paso

Una vez que la BD esté corriendo, ejecutar el **Legacy Agent** en Go para comenzar la sincronización con Blend Core.
