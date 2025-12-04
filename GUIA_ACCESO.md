# 🚀 Sistema POS - Guía de Acceso

## ✅ Sistema Funcionando

Todos los servicios están activos y funcionando correctamente:

### 📋 URLs de Acceso

| Servicio | URL | Estado |
|----------|-----|--------|
| **Frontend (Aplicación)** | http://localhost:3000 | ✅ Activo |
| **Backend API** | http://localhost:8001 | ✅ Activo |
| **RabbitMQ Dashboard** | http://localhost:15672 | ✅ Activo |
| **Adminer (DB)** | http://localhost:8080 | ✅ Activo |

### 🔐 Credenciales de Acceso

#### Usuario Administrador
- **Email:** `admin@nexuspos.com`
- **Password:** `admin123`
- **Tienda:** NexusPOS Store (indumentaria)

#### RabbitMQ Dashboard
- **Usuario:** `user`
- **Password:** `pass`

## 🎯 Cómo Usar el Sistema

### 1. Acceder al Sistema
1. Abre tu navegador en: http://localhost:3000
2. Ingresa las credenciales:
   - Email: `admin@nexuspos.com`
   - Password: `admin123`
3. Click en "Iniciar Sesión"

### 2. Navegación Principal

Una vez dentro, verás el **Sidebar** con las siguientes opciones activas:

#### ✅ Funcionales
- **Dashboard** - Vista general con métricas y estadísticas
- **Ventas / POS** - Sistema de punto de venta completo
- **Productos** - Gestión de productos y variantes
- **Stock** - Control de inventario
- **Inventario** - Ajustes y movimientos
- **Compras** - Gestión de compras y proveedores
- **Caja** - Control de caja y turnos
- **OMS** - Order Management System
- **Reportes** - Reportes y análisis
- **Analytics** - Analíticas avanzadas
- **Insights** - Insights del negocio
- **Clientes** - Gestión de clientes
- **Empleados** - Gestión de empleados
- **AFIP** - Integración con AFIP
- **Integraciones** - Shopify, Mercado Libre, etc.
- **Configuración** - Configuración general

### 3. Flujo Recomendado de Prueba

#### Paso 1: Dashboard
- Abre el **Dashboard** (página principal)
- Verás las métricas generales del negocio
- Panel de acciones rápidas

#### Paso 2: Productos
1. Click en **Productos** en el sidebar
2. Verás el listado de productos
3. Click en "**+ Nuevo Producto**" para agregar productos
4. Completa el formulario con:
   - Nombre del producto
   - SKU (se sugiere automáticamente)
   - Precio
   - Categoría
   - Variantes (talle, color)

#### Paso 3: Ventas
1. Click en **Ventas / POS** en el sidebar
2. Verás el sistema de punto de venta con:
   - **Panel izquierdo:** Lista de productos disponibles
   - **Panel derecho:** Carrito de compra
3. Para hacer una venta:
   - Busca productos por nombre o escanea código de barras
   - Agrega productos al carrito
   - Ajusta cantidades
   - Procesa el pago (Efectivo, Tarjeta, etc.)

## 🔧 Comandos Útiles

### Ver logs en tiempo real
```powershell
# Ver todos los logs
docker compose logs -f

# Ver solo el backend
docker compose logs -f core_api

# Ver solo el frontend
docker compose logs -f frontend
```

### Reiniciar servicios
```powershell
# Reiniciar todo
docker compose restart

# Reiniciar solo el backend
docker compose restart core_api
```

### Detener el sistema
```powershell
docker compose down
```

### Iniciar el sistema
```powershell
docker compose up -d
```

## 📊 Estado de los Servicios

Para verificar el estado de todos los servicios:
```powershell
docker compose ps
```

## 🐛 Solución de Problemas

### Si no puedes iniciar sesión:
1. Verifica que el backend esté corriendo:
   ```powershell
   curl http://localhost:8001/health -UseBasicParsing
   ```
   Debería responder: `{"status":"healthy"}`

2. Resetea la contraseña del admin:
   ```powershell
   docker exec super_pos_api python reset_admin.py
   ```

### Si los servicios no responden:
1. Verifica el estado:
   ```powershell
   docker compose ps
   ```

2. Revisa los logs:
   ```powershell
   docker compose logs --tail=50
   ```

3. Reinicia los servicios:
   ```powershell
   docker compose restart
   ```

## 📝 Notas Importantes

- **RabbitMQ** está configurado y funcionando correctamente
- **PostgreSQL** (Supabase) está conectado
- **Redis** está activo para cache
- El sistema usa **FastAPI** (Python) en el backend
- El frontend es **React + TypeScript + Vite**

## 🎨 Características del Sistema

### Dashboard
- Métricas en tiempo real
- Gráficos de ventas
- Alertas y notificaciones
- Acciones rápidas

### Ventas / POS
- Interfaz rápida de doble panel
- Búsqueda instantánea de productos
- Escaneo de códigos de barras
- Múltiples métodos de pago
- Descuentos y promociones

### Productos
- Gestión completa de productos
- Variantes (talle, color)
- Control de stock por ubicación
- Importación/exportación masiva
- Gestión de precios

¡Disfruta usando el sistema! 🚀
