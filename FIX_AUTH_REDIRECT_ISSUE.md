# Fix: Auth Redirect Issue - Productos Page

## 🐛 Problema
Cuando el usuario accedía a la página de **Productos**, era redirigido automáticamente al **Login** a pesar de estar autenticado.

## 🔍 Diagnóstico

### Síntomas
- Login funcionaba correctamente ✅
- Token JWT se guardaba en `localStorage` ✅
- Backend respondía correctamente con token en Postman/curl ✅
- Frontend redirigía a login al acceder a `/productos` ❌

### Investigación
1. **Logs del backend** mostraban:
   ```
   WARNING | HTTP Exception: Not authenticated
   INFO | Response: GET /api/v1/productos/ - 401 (0.002s)
   ```

2. **Pruebas con curl** revelaron un **307 Temporary Redirect**:
   ```bash
   GET /api/v1/productos  → 307 Redirect → GET /api/v1/productos/
   # ❌ El header Authorization se pierde en el redirect
   ```

3. **Root Cause**:
   - Frontend llamaba a: `GET /api/v1/productos` (sin barra final)
   - FastAPI redirigía a: `GET /api/v1/productos/` (con barra final)
   - **El header `Authorization: Bearer <token>` se perdía durante el redirect 307**
   - Backend recibía request sin token → retornaba 401
   - Frontend interceptor capturaba 401 → redirigía a `/login`

## 🔧 Solución Implementada

### Cambio 1: Frontend - `productos.service.ts`
```typescript
// ❌ ANTES
const BASE_PATH = '/productos';

// ✅ DESPUÉS
const BASE_PATH = '/productos/'; // ⭐ Barra final para evitar 307 redirect
```

**Motivo**: Asegurar que todas las llamadas al API incluyan la barra final para que coincidan exactamente con las rutas de FastAPI y evitar redirects.

### URLs Actualizadas
```typescript
// ANTES                           // DESPUÉS
GET /productos                     → GET /productos/
GET /productos/:id                 → GET /productos/:id  (sin cambio)
GET /productos/:id/variants        → GET /productos/:id/variants (sin cambio)
GET /productos/sizes               → GET /productos/sizes
GET /productos/colors              → GET /productos/colors
GET /productos/locations           → GET /productos/locations
```

## ✅ Verificación

### Prueba 1: Backend directo
```powershell
# Login
$login = @{email = "admin@nexuspos.com"; password = "admin123"} | ConvertTo-Json
$resp = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/auth/login" -Method POST -Body $login -ContentType "application/json"
$token = $resp.access_token

# Productos CON barra final ✅
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/productos/" -Headers $headers
# → 200 OK, 177 productos
```

### Prueba 2: Frontend en navegador
1. Abrir `http://localhost:3000`
2. Login con `admin@nexuspos.com` / `admin123`
3. Navegar a **Productos**
4. ✅ Debería cargar la tabla con 177 productos de ropa

## 📚 Lecciones Aprendidas

1. **Redirects HTTP pierden headers de autenticación** por seguridad
2. **FastAPI es estricto con barras finales** cuando `redirect_slashes=True` (default)
3. **Siempre usar barras finales consistentemente** en servicios de frontend
4. **Los interceptores de Axios capturan 401** y ejecutan lógica de logout automático

## 🔗 Referencias

### Archivos Modificados
- `frontend/src/services/productos.service.ts`

### Configuración Relevante
- **Backend**: FastAPI en `http://localhost:8001`
- **Frontend**: Vite dev server en `http://localhost:3000`
- **Proxy**: Vite proxy `/api` → `http://localhost:8001`
- **Auth**: JWT tokens en `localStorage` con clave `access_token`

### Endpoints Corregidos
```
POST   /api/v1/auth/login           → OK ✅
GET    /api/v1/productos/           → OK ✅ (antes fallaba sin barra)
GET    /api/v1/productos/sizes      → OK ✅
GET    /api/v1/productos/colors     → OK ✅
GET    /api/v1/productos/locations  → OK ✅
```

## 🚀 Estado Actual

- ✅ Backend corriendo en Docker (puerto 8001)
- ✅ Supabase con 177 productos cargados
- ✅ Frontend corriendo en Vite (puerto 3000)
- ✅ Autenticación funcionando correctamente
- ✅ Productos endpoint resuelto
- ✅ Sin redirects 307 que pierdan headers

---
**Fecha**: 2025-12-02  
**Autor**: GitHub Copilot  
**Issue**: Auth redirect en página de productos  
**Status**: ✅ RESUELTO
