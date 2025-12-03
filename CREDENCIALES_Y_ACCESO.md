# 🔐 Credenciales y Acceso al Sistema

## 📋 Información de la Tienda

**Tienda Activa:**
- **Nombre:** NexusPOS Store
- **ID:** `3f340a5d-40b3-442e-92b9-2a12975d4adb`
- **Rubro:** indumentaria

## 👤 Credenciales de Acceso

### Usuario Administrador (Owner)
```
Email:    admin@nexuspos.com
Password: admin123
Rol:      owner
Tienda:   NexusPOS Store
```

**✅ CREDENCIALES VERIFICADAS** - El login funciona correctamente.

## 🚀 Iniciar el Sistema

### 1. Backend (FastAPI)
```powershell
cd C:\Users\juani\Desktop\Proyecto-POS\core-api
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**URL:** http://localhost:8000

**Swagger Docs:** http://localhost:8000/docs

### 2. Frontend (React + Vite)
```powershell
cd C:\Users\juani\Desktop\Proyecto-POS\frontend
npm run dev
```

**URL:** http://localhost:5173 (o el puerto que indique Vite)

## 📦 Datos Cargados

✅ **4 Ubicaciones**
- Salón Principal
- Depósito Central
- Vidriera  
- Depósito Secundario

✅ **19 Talles**
- Numéricos: 28, 30, 32, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44
- Alfanuméricos: XS, S, M, L, XL, XXL

✅ **15 Colores**
- Azul, Azul Claro, Azul Marino, Azul Oscuro
- Beige, Blanco, Bordo
- Floral, Gris
- Marrón, Negro
- Negro/Blanco, Rojo, Rosa
- Verde

✅ **10 Productos con 186 Variantes**
1. **Remera Básica** (REM-BAS) - 20 variantes
2. **Jean Clásico** (JEAN-CLA) - 21 variantes
3. **Campera de Cuero** (CAMP-CUERO) - 8 variantes
4. **Buzo Canguro** (BUZO-CANG) - 25 variantes
5. **Vestido Casual** (VEST-CAS) - 20 variantes
6. **Zapatillas Deportivas** (ZAP-DEP) - 32 variantes
7. **Camisa Formal** (CAM-FORM) - 16 variantes
8. **Short Deportivo** (SHORT-DEP) - 16 variantes
9. **Sweater Lana** (SWEAT-LAN) - 16 variantes
10. **Pollera Jean** (POLL-JEAN) - 12 variantes

✅ **793 Movimientos de Inventario**
- Stock inicial en 4 ubicaciones
- Ajustes de inventario
- Transferencias entre ubicaciones

## 🚪 Cómo Acceder al Sistema

### Paso 1: Verificar Servidores
Asegúrate que ambos servidores estén corriendo:
- **Backend:** `http://localhost:8000` ✅
- **Frontend:** `http://localhost:3001` ✅

### Paso 2: Abrir Navegador
Abre tu navegador en: **`http://localhost:3001`**

### Paso 3: Iniciar Sesión
Ingresa las credenciales:
```
Email:    admin@nexuspos.com
Password: admin123
```

### Paso 4: Explorar el Sistema
Una vez autenticado, tendrás acceso a:
- 📊 **Dashboard:** Resumen de ventas e inventario
- 📦 **Productos:** Catálogo con 186 variantes cargadas
- 💰 **Ventas:** Punto de venta
- 👥 **Clientes:** Gestión de clientes  
- 📈 **Stock:** Control de inventario multi-ubicación
- 📊 **Reportes:** Analytics y exportación a CSV

## 🔄 Cerrar Sesión

En el sidebar (barra lateral izquierda), encontrarás el botón **"Cerrar Sesión"** en la parte inferior, justo debajo de tu información de usuario.

- **Expandido:** Botón rojo con icono de salida y texto "Cerrar Sesión"
- **Colapsado:** Solo icono rojo con tooltip al pasar el mouse

## ⚙️ Endpoints Principales

### Autenticación
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/register
GET  /api/v1/auth/me
```

### Productos (Nuevo Sistema - Inventory Ledger)
```
GET    /api/v1/productos/              # Listar productos
POST   /api/v1/productos/              # Crear producto con variantes
GET    /api/v1/productos/{id}          # Detalle del producto
GET    /api/v1/productos/{id}/variants # Variantes con stock por ubicación
GET    /api/v1/productos/sizes         # Listar talles
GET    /api/v1/productos/colors        # Listar colores
GET    /api/v1/productos/locations     # Listar ubicaciones
```

### Stock
```
GET    /api/v1/stock/resumen           # Resumen de stock por variante
GET    /api/v1/stock/variant/{id}      # Stock de una variante específica
GET    /api/v1/stock/transactions      # Historial de movimientos
POST   /api/v1/stock/adjustment        # Ajuste de inventario
POST   /api/v1/stock/transfer          # Transferencia entre ubicaciones
GET    /api/v1/stock/locations         # Ubicaciones disponibles
GET    /api/v1/stock/low-stock         # Productos con stock bajo
```

### Reportes
```
GET    /api/v1/reportes/top-productos       # Productos más vendidos
GET    /api/v1/reportes/tendencia-ventas    # Tendencia de ventas
GET    /api/v1/reportes/por-categoria       # Ventas por categoría
GET    /api/v1/reportes/por-metodo-pago     # Ventas por método de pago
GET    /api/v1/reportes/ventas-detalle      # Detalle de ventas
GET    /api/v1/reportes/export/csv          # Exportar a CSV
```

### Clientes
```
GET    /api/v1/clientes/                # Listar clientes
POST   /api/v1/clientes/                # Crear cliente
GET    /api/v1/clientes/{id}            # Detalle del cliente
PUT    /api/v1/clientes/{id}            # Actualizar cliente
DELETE /api/v1/clientes/{id}            # Desactivar cliente
GET    /api/v1/clientes/top             # Top clientes por compras
GET    /api/v1/clientes/{id}/compras    # Historial de compras
```

## 🐛 Solución de Problemas

### Los productos aparecen con precio y stock en $0

**Causa:** Estás viendo productos de la tabla legacy `productos_legacy` en lugar de la nueva tabla `products` con `product_variants`.

**Solución:**
1. Cierra sesión
2. Vuelve a iniciar sesión con `admin@nexuspos.com` / `admin123`
3. El token incluirá el `tienda_id` correcto
4. Los productos ahora mostrarán precio y stock de las variantes

### El backend no responde

**Verificar:**
```powershell
# Ver si el puerto 8000 está en uso
netstat -ano | findstr :8000

# Matar el proceso si es necesario
taskkill /PID <PID> /F

# Reiniciar el backend
cd C:\Users\juani\Desktop\Proyecto-POS\core-api
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Error de CORS en el frontend

**Verificar que el backend esté configurado para:**
- Permitir `http://localhost:5173`
- Permitir `http://localhost:3000`
- Permitir `http://localhost:3001`

El archivo `core-api/core/config.py` debe tener:
```python
BACKEND_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001"
]
```

## 📞 Soporte

Para problemas adicionales, revisa:
- `core-api/logs/` - Logs del backend
- Consola del navegador (F12) - Errores del frontend
- Network tab en DevTools - Requests HTTP

---

**Última actualización:** 3 de diciembre de 2025
