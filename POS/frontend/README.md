# 🚀 Nexus POS - Frontend

Sistema de Punto de Venta Multi-Tenant desarrollado con Next.js 14, TypeScript, Tailwind CSS y Shadcn/UI.

## ✨ Características Principales

### 🎨 UI/UX Profesional
- **Diseño Minimalista**: Inspirado en Stripe/Vercel
- **Mobile First**: Responsive y optimizado para todos los dispositivos
- **Rendimiento**: Transiciones instantáneas y optimización de carga
- **Accesibilidad**: Componentes accesibles con Radix UI

### 🔐 Autenticación
- JWT en cookies + localStorage
- Middleware de Next.js para protección de rutas
- Auto-redirección según estado de sesión

### 💎 Módulo POS (Punto de Venta)
- **Scanner de Código de Barras**: Detección automática USB
- **Búsqueda Instantánea**: Filtrado en tiempo real
- **Grilla de Productos**: Cards visuales con imágenes
- **Carrito Intuitivo**: +/- cantidad, eliminar items
- **Modal de Cobro**: Efectivo con cálculo de vuelto, Mercado Pago con QR

### 📦 Módulo Productos
- **Data Table**: Paginación, búsqueda y filtros
- **Formulario Dinámico**: Campos que cambian según rubro (Talles/Colores para Ropa)
- **ABM Completo**: Crear, editar, eliminar productos

### 📊 Dashboard
- **Métricas en Tiempo Real**: Ventas del día, tickets, stock bajo
- **Gráfico de Ventas**: Últimos 7 días con Recharts
- **Insights IA**: Alertas y recomendaciones inteligentes

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Rutas protegidas con layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Dashboard principal
│   │   │   ├── pos/
│   │   │   │   ├── page.tsx      # Módulo POS
│   │   │   │   └── payment-modal.tsx
│   │   │   ├── productos/
│   │   │   │   ├── page.tsx      # Lista de productos
│   │   │   │   └── producto-form-modal.tsx
│   │   │   └── layout.tsx        # Layout con sidebar
│   │   ├── login/
│   │   │   └── page.tsx          # Página de login
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Redirect a dashboard
│   │   ├── providers.tsx         # React Query provider
│   │   └── globals.css           # Estilos globales
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── dashboard-layout.tsx  # Sidebar + Header
│   │   └── ui/                   # Componentes Shadcn/UI
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── table.tsx
│   │       ├── avatar.tsx
│   │       ├── label.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       └── use-toast.ts
│   │
│   ├── hooks/
│   │   ├── use-auth.ts           # Autenticación
│   │   ├── use-products.ts       # Gestión de productos
│   │   ├── use-sales.ts          # Creación de ventas
│   │   ├── use-dashboard.ts      # Métricas e insights
│   │   └── use-barcode-scanner.ts  # Scanner de códigos
│   │
│   ├── lib/
│   │   ├── api-client.ts         # Cliente HTTP
│   │   └── utils.ts              # Utilidades (cn, formatCurrency)
│   │
│   └── types/
│       └── index.ts              # Tipos TypeScript
│
├── middleware.ts                 # Protección de rutas
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🚀 Instalación y Uso

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 2. Configurar Variables de Entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 4. Build para Producción

```bash
npm run build
npm start
```

## 🔑 Funcionalidades Clave

### Scanner de Código de Barras

El hook `useBarcodeScanner` detecta automáticamente códigos escaneados:

```typescript
useBarcodeScanner({
  onScan: (code) => {
    const producto = productos.find(p => p.codigo_barras === code);
    if (producto) addToCart(producto);
  }
});
```

### Hooks Personalizados

#### `useAuth()`
```typescript
const { user, login, logout, isLoading } = useAuth();
```

#### `useProducts()`
```typescript
const { 
  productos, 
  createProducto, 
  updateProducto, 
  deleteProducto 
} = useProducts();
```

#### `useCreateSale()`
```typescript
const createSale = useCreateSale();
createSale.mutate({
  items: [...],
  metodo_pago: "EFECTIVO"
});
```

## 🎨 Sistema de Diseño

### Colores
- **Primary**: Negro (#000000) - Botones y acentos principales
- **Secondary**: Gris claro - Fondos y separadores
- **Success**: Verde - Botón "Cobrar"
- **Destructive**: Rojo - Acciones de eliminación

### Tipografía
- **Font**: Inter (Google Fonts)
- **Tamaños**: Escala modular (text-sm a text-4xl)

### Componentes UI
Todos los componentes base están en `src/components/ui/` y siguen el patrón de Shadcn/UI.

## 🔌 Conexión con Backend

El cliente API en `src/lib/api-client.ts` maneja:
- Autenticación automática con JWT
- Manejo de errores centralizado
- Tipo de respuestas con TypeScript

Endpoints principales:
```typescript
POST   /api/auth/login
GET    /api/auth/me
GET    /api/productos
POST   /api/productos
PUT    /api/productos/:id
DELETE /api/productos/:id
POST   /api/ventas
GET    /api/dashboard/metrics
GET    /api/insights
```

## 📱 Pantallas Principales

### Login (`/login`)
- Email y contraseña
- Validación y redirección automática

### Dashboard (`/dashboard`)
- Métricas: Ventas hoy, tickets, stock bajo
- Gráfico de ventas semanal
- Insights de IA

### POS (`/pos`)
- Búsqueda y scanner
- Grilla de productos
- Carrito con cálculo automático
- Modal de cobro (Efectivo/Mercado Pago)

### Productos (`/productos`)
- Tabla con paginación
- Formulario dinámico
- Campos específicos por rubro

## 🛠️ Tecnologías Utilizadas

- **Next.js 14**: App Router, Server Components
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Utilidades CSS
- **Shadcn/UI**: Componentes con Radix UI
- **TanStack Query**: Estado del servidor
- **Recharts**: Visualización de datos
- **Lucide React**: Iconos

## 📝 Notas de Desarrollo

### Errores de TypeScript
Los errores mostrados durante la creación se resolverán automáticamente al ejecutar `npm install`, ya que instalan las dependencias necesarias (`@types/react`, `@types/node`, etc.).

### Variables de Entorno
Asegúrate de que `NEXT_PUBLIC_API_URL` apunte a tu backend FastAPI.

### Middleware
El archivo `middleware.ts` protege todas las rutas excepto `/login`. Si no hay token, redirige automáticamente.

## 🎯 Próximos Pasos

1. Conectar con el backend real de FastAPI
2. Implementar integración real con Mercado Pago
3. Agregar página de Caja (/caja) para cierre de turno
4. Implementar impresión de tickets
5. Agregar modo offline con Service Workers

## 📄 Licencia

Proyecto privado - Nexus POS © 2025
