/**
 * README del frontend - Web Portal
 */

# Nexus POS - Frontend (Web Portal)

Frontend del sistema de punto de venta construido con Next.js 14, TypeScript y React Query.

## 🏗️ Estructura del Proyecto

```
src/
├── app/                      # App Router de Next.js
│   ├── (auth)/              # Rutas de autenticación
│   │   └── login/
│   ├── (app)/               # Rutas protegidas de la aplicación
│   │   ├── dashboard/
│   │   ├── productos/
│   │   ├── ventas/
│   │   ├── reportes/
│   │   ├── inventario/
│   │   └── configuracion/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/               # Componentes React
│   ├── layouts/             # Layouts de la aplicación
│   ├── productos/           # Componentes de productos
│   ├── ventas/              # Componentes de ventas
│   ├── dashboard/           # Componentes del dashboard
│   └── ui/                  # Componentes UI base (shadcn/ui)
│
├── hooks/                    # Hooks personalizados
│   ├── useAuth.ts           # Hook de autenticación
│   ├── useProductos.ts      # Hooks de productos
│   ├── useVentas.ts         # Hooks de ventas
│   └── useDashboard.ts      # Hooks del dashboard
│
├── services/                 # Servicios API
│   ├── auth.service.ts
│   ├── productos.service.ts
│   ├── ventas.service.ts
│   ├── dashboard.service.ts
│   ├── reportes.service.ts
│   ├── inventario.service.ts
│   ├── insights.service.ts
│   └── index.ts
│
├── types/                    # Tipos TypeScript
│   └── api.ts               # Tipos de la API
│
├── lib/                      # Utilidades y configuración
│   ├── api-client.ts        # Cliente Axios configurado
│   ├── utils.ts             # Funciones utilitarias
│   ├── constants.ts         # Constantes de la aplicación
│   └── env.ts               # Variables de entorno tipadas
│
└── providers/                # Providers de contexto
    └── query-provider.tsx   # Provider de React Query
```

## 🚀 Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **React Query (TanStack Query)** - Gestión de estado del servidor
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos utilitarios
- **shadcn/ui** - Componentes UI
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas
- **Orval** - Generación de cliente API desde OpenAPI
- **Sonner** - Notificaciones toast

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.local.example .env.local

# Editar variables de entorno
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start

# Linter
npm run lint

# Generar cliente API desde OpenAPI (Orval)
npm run generate:api
```

## 🔌 Servicios API

Todos los servicios API están en `src/services/`:

### Autenticación
```typescript
import { authService } from '@/services';

await authService.login({ email, password });
await authService.getCurrentUser();
authService.logout();
```

### Productos
```typescript
import { productosService } from '@/services';

await productosService.list({ search: 'remera' });
await productosService.create(productoData);
await productosService.update(id, updateData);
```

### Ventas
```typescript
import { ventasService } from '@/services';

await ventasService.scanProducto(codigo);
await ventasService.checkout(ventaData);
await ventasService.list({ fecha_desde, fecha_hasta });
```

## 🎣 Hooks de React Query

Todos los hooks están en `src/hooks/`:

```typescript
import { useProductos, useCreateProducto } from '@/hooks';

// Listar productos
const { data, isLoading } = useProductos({ search: 'remera' });

// Crear producto
const createProducto = useCreateProducto();
await createProducto.mutateAsync(data);
```

## 🎨 Componentes

### Layouts
- `AppLayout` - Layout principal con sidebar

### Productos
- `ProductosTable` - Tabla de productos con filtros
- `ProductoForm` - Formulario crear/editar producto

### Ventas
- `VentasTable` - Tabla de ventas
- `POS` - Punto de venta (scanner + checkout)

## 🔐 Autenticación

El sistema usa JWT almacenado en localStorage. Los interceptores de Axios agregan automáticamente el token a todas las requests.

```typescript
// Hook de autenticación
const { user, isAuthenticated } = useAuth();
const logout = useLogout();
```

## 📝 Variables de Entorno

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# App Info
NEXT_PUBLIC_APP_NAME="Nexus POS"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## 🔄 Generación de Cliente API con Orval

Orval genera automáticamente el cliente API desde el archivo OpenAPI:

```bash
npm run generate:api
```

Esto genera:
- Tipos TypeScript
- Hooks de React Query
- Servicios API tipados

## 📊 Estado del Servidor

React Query maneja todo el estado del servidor con:
- **Caching automático**
- **Revalidación en segundo plano**
- **Invalidación de queries**
- **Optimistic updates**

## 🎯 Próximos Pasos

1. Instalar dependencias faltantes (shadcn/ui, sonner, etc.)
2. Configurar Orval
3. Implementar páginas de la aplicación
4. Crear componentes UI adicionales
5. Implementar validaciones de formularios
6. Agregar tests

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com/)
- [Orval](https://orval.dev/)
