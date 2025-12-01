# 🎨 POS Pro - Web Portal Frontend

> **Sistema de Punto de Venta Empresarial Multi-tenant**  
> Diseño premium inspirado en Linear / Arc / Stripe

---

## 🚀 Stack Tecnológico

### Core
- **React 18.2** - Biblioteca UI moderna
- **TypeScript 5.3** - Tipado estático robusto
- **Vite 5.0** - Build tool ultra-rápido (HMR instantáneo)

### Data Fetching & State
- **TanStack Query 5.17** (React Query) - Server state management
- **Axios 1.6** - Cliente HTTP con interceptores

### Forms & Validation
- **React Hook Form 7.49** - Formularios performantes
- **Zod 3.22** - Validación de schemas TypeScript-first

### UI & Animations
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion 10.18** - Animaciones fluidas y gestos
- **Lucide React 0.309** - Iconos premium y consistentes

### Routing
- **React Router DOM 6.21** - Routing declarativo

---

## 🎨 Sistema de Diseño

### Paleta de Colores

**Grises Neutros**
```
gray-50:  #F5F6F7  (backgrounds claros)
gray-100: #EBEDEF
gray-200: #D6D9DC
gray-900: #1C1E21  (texto principal)
```

**Primary (Azul Petróleo)**
```
primary-50:  #EBF5FF
primary-500: #1F6FEB  (acciones principales)
primary-600: #1B60D4
```

**Accent (Violeta)**
```
accent-500: #7C3AED  (highlights, gradientes)
accent-600: #6D28D9
```

**Estados**
```
success-500: #10B981  (éxito, stock OK)
danger-500:  #EF4444  (errores, stock bajo)
warning-500: #F59E0B  (alertas)
```

### Tipografía
- **Font Family**: `Inter` (Google Fonts)
- **Font Sizes**: sistema de escala consistente
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Espaciado
- Sistema de múltiplos de **8px**
- Gap entre elementos: `gap-3` (12px), `gap-4` (16px), `gap-6` (24px)

### Border Radius
- **Botones**: `rounded-lg` (12px)
- **Cards/Modals**: `rounded-xl` (16px) o `rounded-2xl` (24px)
- **Inputs**: `rounded-lg` (12px)

### Transiciones
- **Duración**: `150ms` por defecto
- **Easing**: `ease-out` para entradas, `ease-in-out` para toggles

---

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes atómicos reutilizables
│   │   │   ├── Button.tsx   # Botón premium (4 variantes, loading state)
│   │   │   ├── Input.tsx    # Input con label flotante
│   │   │   ├── Table.tsx    # Tabla con striping, sorting, pagination
│   │   │   └── Modal.tsx    # Modal con animación fade + scale
│   │   └── layout/          # Componentes de layout
│   │       └── Sidebar.tsx  # Sidebar colapsable con indicador activo
│   ├── context/             # React Contexts
│   │   ├── AuthContext.tsx  # Autenticación global
│   │   └── ToastContext.tsx # Sistema de notificaciones
│   ├── hooks/               # Custom hooks
│   │   └── useProductosQuery.ts  # React Query hooks para productos
│   ├── screens/             # Pantallas principales
│   │   ├── Login.tsx        # Pantalla de login
│   │   └── Productos.tsx    # Gestión de productos
│   ├── services/            # Servicios de API
│   │   ├── api/
│   │   │   └── apiClient.ts # Cliente Axios con interceptores
│   │   ├── auth.service.ts
│   │   ├── productos.service.ts
│   │   └── ventas.service.ts
│   ├── types/
│   │   └── api.ts           # Interfaces TypeScript de API
│   ├── lib/
│   │   └── utils.ts         # Utilidades (cn para Tailwind)
│   ├── styles/
│   │   └── globals.css      # Estilos globales + Tailwind
│   ├── App.tsx              # Componente raíz con routing
│   └── main.tsx             # Entry point
├── public/                  # Assets estáticos
├── index.html               # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🛠️ Setup e Instalación

### Prerrequisitos
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Instalación

```bash
cd frontend
npm install
```

### Variables de Entorno

Crear archivo `.env` (opcional, el proxy de Vite ya apunta a `localhost:8001`):

```env
VITE_API_BASE_URL=http://localhost:8001/api/v1
```

### Scripts Disponibles

```bash
# Desarrollo (HMR + Vite dev server)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

---

## 🎯 Componentes Principales

### Button Component

```tsx
import Button from '@/components/ui/Button';

<Button variant="primary" size="md" isLoading={false}>
  Guardar
</Button>
```

**Variantes**: `primary` | `secondary` | `ghost` | `danger`  
**Tamaños**: `sm` | `md` | `lg`

### Input Component

```tsx
import Input from '@/components/ui/Input';

<Input
  label="Correo Electrónico"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errorMessage}
/>
```

### Table Component

```tsx
import Table from '@/components/ui/Table';

const columns: Column<Product>[] = [
  {
    key: 'nombre',
    header: 'Nombre',
    sortable: true,
    render: (product) => <span>{product.nombre}</span>,
  },
];

<Table
  data={productos}
  columns={columns}
  keyExtractor={(p) => p.id}
  sortBy="nombre"
  sortOrder="asc"
  onSort={handleSort}
  isLoading={isLoading}
/>
```

### Modal Component

```tsx
import Modal from '@/components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Crear Producto"
  size="lg"
  footer={
    <>
      <Button variant="secondary" onClick={handleCancel}>Cancelar</Button>
      <Button variant="primary" onClick={handleSubmit}>Guardar</Button>
    </>
  }
>
  {/* Modal content */}
</Modal>
```

---

## 📡 Data Fetching con React Query

### Ejemplo: useProductosQuery

```tsx
import { useProductosQuery, useCreateProducto } from '@/hooks/useProductosQuery';

function Productos() {
  const { data: productos, isLoading } = useProductosQuery();
  const createProducto = useCreateProducto();

  const handleCreate = async (data: CreateProductRequest) => {
    await createProducto.mutateAsync(data);
    // Optimistic update automático + invalidación de cache
  };

  return (
    <div>
      {productos?.map((p) => <div key={p.id}>{p.nombre}</div>)}
    </div>
  );
}
```

**Features**:
- ✅ Cache automático (5 minutos staleTime)
- ✅ Optimistic updates
- ✅ Rollback automático en errores
- ✅ Retry inteligente (1 reintento por defecto)

---

## 🔐 Autenticación

### AuthContext

```tsx
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    await login('admin@pos.com', 'admin123');
    // Redirige automáticamente al Dashboard
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Bienvenido, {user?.nombre}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

---

## 🎭 Animaciones con Framer Motion

### Entrada de Pantalla

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

### Modal con Fade + Scale

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  {/* Modal content */}
</motion.div>
```

---

## 🚨 Sistema de Toasts

```tsx
import { useToast } from '@/context/ToastContext';

function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleAction = async () => {
    try {
      await someAction();
      success('Operación exitosa');
    } catch (err) {
      error('Ocurrió un error');
    }
  };
}
```

**Auto-dismiss**: 5 segundos por defecto  
**Posición**: Top-right  
**Animación**: Fade + slide-in suave

---

## 🎨 Utilidad `cn` (clsx + tailwind-merge)

```tsx
import { cn } from '@/lib/utils';

<button
  className={cn(
    'base-class',
    isActive && 'active-class',
    variant === 'primary' && 'bg-primary-500',
    className // permite override desde props
  )}
>
  Button
</button>
```

Combina clases de Tailwind inteligentemente evitando conflictos.

---

## 📦 Integración con Backend

### Configuración Axios (apiClient.ts)

- **Base URL**: `http://localhost:8001/api/v1`
- **Interceptores Request**: Agrega JWT automáticamente
- **Interceptores Response**: Retry automático en errores 5xx/network
- **Logout automático**: En errores 401 (no autorizado)

### Servicios Disponibles

- `authService` - Login, logout, me, isAuthenticated
- `productosService` - CRUD completo de productos
- `ventasService` - Escaneo, checkout, facturación

---

## 🧪 Credenciales Demo

**Email**: `admin@pos.com`  
**Password**: `admin123`

---

## 🎯 Pantallas Implementadas

✅ **Dashboard** - Overview con métricas, estado AFIP y actividad reciente  
✅ **Ventas / POS** - Panel doble con scanner RFID + carrito + loyalty points  
✅ **Productos** - Listado con búsqueda, filtros y tabla premium  
✅ **Stock** - Gestión de inventario multi-ubicación con alertas  
✅ **OMS** - Sincronización de órdenes e-commerce (Shopify/ML/TiendaNube)  
✅ **Reportes** - Dashboards analíticos con gráficos y métricas  
✅ **Clientes** - CRM completo con loyalty tiers (Bronze/Silver/Gold/Platinum)  
✅ **Configuración** - Tabs Notion-style (AFIP, Integraciones, RBAC, General)  
✅ **Login** - Autenticación con diseño premium  

### Rutas Disponibles

```typescript
/                    -> Dashboard (protected)
/login               -> Login
/ventas              -> Punto de Venta (protected)
/productos           -> Gestión de Productos (protected)
/stock               -> Inventario Multi-ubicación (protected)
/oms                 -> Order Management System (protected)
/reportes            -> Analytics y Reportes (protected)
/clientes            -> CRM y Loyalty (protected)
/configuracion       -> Settings (protected)
```  

---

## 🔧 Configuración de Vite

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 📚 Recursos

- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hook Form](https://react-hook-form.com)
- [Lucide Icons](https://lucide.dev)

---

## 👨‍💻 Desarrollo

### Buenas Prácticas

1. **Componentes atómicos** en `components/ui/` (reutilizables)
2. **Pantallas completas** en `screens/`
3. **Hooks personalizados** prefijo `use`
4. **Tipado estricto** con TypeScript (evitar `any`)
5. **React Query** para todo lo relacionado con server state
6. **Optimistic updates** en mutaciones críticas
7. **Toasts automáticos** en errores de API (interceptor)

### Performance

- ✅ Lazy loading de rutas (React.lazy + Suspense)
- ✅ Memoización de componentes pesados (React.memo)
- ✅ Debounce en búsquedas (useDebounce hook)
- ✅ Virtualización de listas largas (react-window)

---

## 📄 Licencia

Sistema propietario - Uso interno exclusivo.

---

**¡Listo para iniciar!** 🚀

```bash
npm install && npm run dev
```

El servidor de desarrollo estará en **http://localhost:5173**
