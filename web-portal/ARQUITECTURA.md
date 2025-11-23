# 🏗️ ARQUITECTURA FRONTEND - NEXUS POS

## 📋 Resumen Ejecutivo

Frontend completo para Nexus POS desarrollado con Next.js 14 (App Router), TypeScript, Tailwind CSS y Shadcn/UI.

**Stack Tecnológico:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + Shadcn/UI
- TanStack Query (React Query) v5
- Recharts (gráficos)
- Lucide React (iconos)

**Look & Feel:**
Minimalista, limpio, estilo Stripe/Vercel. Fondo blanco/gris claro, acentos en negro.

## 🎯 Componentes CLAVE Implementados

### 1. SISTEMA DE AUTENTICACIÓN

**Archivos:**
- `src/middleware.ts` - Protección de rutas con Next.js Middleware
- `src/app/login/page.tsx` - Página de login centrada
- `src/hooks/use-auth.ts` - Hook para login/logout/usuario actual

**Flujo:**
1. Usuario ingresa credenciales en `/login`
2. Hook `useAuth()` envía POST a `/api/auth/login`
3. Backend devuelve token JWT
4. Token se guarda en localStorage + cookie
5. Middleware verifica cookie en cada request
6. Si no hay token → redirect a `/login`

**Características:**
- ✅ Auto-focus en input de email
- ✅ Validación de formulario
- ✅ Manejo de errores visuales
- ✅ Redirección automática post-login

---

### 2. LAYOUT CON SIDEBAR

**Archivos:**
- `src/components/layout/dashboard-layout.tsx` - Sidebar colapsable
- `src/app/(dashboard)/layout.tsx` - Layout wrapper

**Características:**
- ✅ Sidebar colapsable (w-64 ↔ w-20)
- ✅ Íconos: Dashboard, POS, Productos, Caja
- ✅ Header superior con nombre de tienda y avatar
- ✅ Botón de logout
- ✅ Indicador de ruta activa (fondo negro)

**Navegación:**
- `/dashboard` - Dashboard con métricas
- `/pos` - Punto de Venta (LA JOYA)
- `/productos` - Gestión de productos
- `/caja` - Cierre de caja (pendiente)

---

### 3. MÓDULO POS (💎 JOYA DE LA CORONA)

**Archivos:**
- `src/app/(dashboard)/pos/page.tsx` - Componente principal
- `src/app/(dashboard)/pos/payment-modal.tsx` - Modal de cobro
- `src/hooks/use-barcode-scanner.ts` - Scanner de códigos

**Layout:**
```
┌──────────────────────────────────────────────┬──────────────┐
│  BÚSQUEDA + SCANNER                          │   CARRITO    │
├──────────────────────────────────────────────┤   (Ticket)   │
│                                              │              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                │  Item 1      │
│  │Prod│ │Prod│ │Prod│ │Prod│                │  Item 2      │
│  └────┘ └────┘ └────┘ └────┘                │  Item 3      │
│                                              │              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                ├──────────────┤
│  │Prod│ │Prod│ │Prod│ │Prod│                │  TOTAL: $... │
│  └────┘ └────┘ └────┘ └────┘                │  [COBRAR]    │
└──────────────────────────────────────────────┴──────────────┘
70%                                            30%
```

**Funcionalidades:**

#### Scanner de Código de Barras
```typescript
useBarcodeScanner({
  onScan: (code) => {
    // Buscar producto por código de barras o SKU
    const producto = productos.find(p => 
      p.codigo_barras === code || p.sku === code
    );
    if (producto) addToCart(producto);
  }
});
```

**Cómo funciona:**
1. Lector USB simula teclado
2. Hook escucha eventos `keypress` globales
3. Acumula caracteres hasta detectar "Enter"
4. Busca producto y lo agrega automáticamente

#### Búsqueda Manual
- Input con auto-focus permanente
- Filtrado en tiempo real por nombre/SKU
- Ícono de scanner como indicador visual

#### Grilla de Productos
- Cards responsive (2-5 columnas según viewport)
- Imagen placeholder si no hay imagen
- Nombre, SKU, Precio, Stock
- Click → Agregar al carrito

#### Carrito (Panel Derecho)
- Lista de items con cantidad
- Botones +/- para modificar cantidad
- Botón rojo para eliminar
- Total calculado en tiempo real
- Botón "COBRAR" verde gigante

#### Modal de Cobro
**Método: EFECTIVO**
- Input para monto recibido
- Cálculo automático de vuelto
- Validación: no permite cobrar si es insuficiente

**Método: MERCADO PAGO**
- Ícono de QR placeholder
- Texto: "Mostrá este QR al cliente"
- (Lista para integración real)

**Confirmación:**
- Envía POST a `/api/ventas`
- Limpia carrito
- Muestra toast de éxito
- Invalida queries de dashboard

---

### 4. MÓDULO PRODUCTOS (ABM)

**Archivos:**
- `src/app/(dashboard)/productos/page.tsx` - Lista/tabla
- `src/app/(dashboard)/productos/producto-form-modal.tsx` - Formulario

**Características:**

#### Data Table
- Columnas: Imagen, Nombre, SKU, Rubro, Stock, Precio, Acciones
- Búsqueda en tiempo real
- Indicador visual de stock bajo (<10 en rojo)
- Botones de editar/eliminar

#### Formulario Dinámico
**Campos Base:**
- Nombre, SKU, Precio, Stock, Rubro, Código de Barras

**Campos Dinámicos por Rubro:**

```typescript
if (rubro === "ROPA") {
  // Mostrar inputs para:
  talles: "S, M, L, XL"  // Split por coma
  colores: "Rojo, Azul"  // Split por coma
}
```

**Checkbox "Pesable":**
```typescript
if (pesable) {
  // Mostrar input:
  peso_kg: number  // Peso en kilogramos
}
```

**Validaciones:**
- Campos requeridos: Nombre, SKU, Precio, Stock
- Formato de número en precio/stock
- Conversión de strings separados por coma a arrays

---

### 5. DASHBOARD

**Archivo:**
- `src/app/(dashboard)/dashboard/page.tsx`

**Componentes:**

#### 3 Cards de Métricas
```typescript
1. Ventas de Hoy   → $ formatCurrency(ventas_hoy)
2. Tickets Emitidos → número
3. Stock Bajo      → productos < 10 unidades
```

#### Gráfico de Ventas (Recharts)
```typescript
<LineChart data={ventas_semana}>
  // ventas_semana: Array<{ fecha: string, total: number }>
</LineChart>
```

**Configuración:**
- Eje X: Fechas
- Eje Y: Montos
- Línea negra, grosor 2px
- Puntos en cada valor

#### Insights de IA
```typescript
insights.map(insight => (
  <div className={getColorByType(insight.tipo)}>
    {insight.mensaje}
  </div>
))
```

**Tipos de Insight:**
- `WARNING` → Fondo amarillo (ej: "Stock bajo en Coca-Cola")
- `INFO` → Fondo azul (ej: "Nuevo producto disponible")
- `SUCCESS` → Fondo verde (ej: "Objetivo de ventas alcanzado")

---

## 🔌 HOOKS PERSONALIZADOS

### `useAuth()`
```typescript
const { user, login, logout, isLoading, error } = useAuth();

// user: User | null
// login: (credentials) => void
// logout: () => void
```

### `useProducts()`
```typescript
const { 
  productos,           // Producto[]
  isLoading,           // boolean
  createProducto,      // (data: Partial<Producto>) => void
  updateProducto,      // ({ id, data }) => void
  deleteProducto       // (id: number) => void
} = useProducts();
```

### `useCreateSale()`
```typescript
const createSale = useCreateSale();

createSale.mutate({
  items: [
    { producto_id: 1, cantidad: 2, precio_unitario: 1000 }
  ],
  metodo_pago: "EFECTIVO" | "MERCADOPAGO"
});
```

### `useDashboard()`
```typescript
const { metrics, insights, isLoading } = useDashboard();

// metrics: DashboardMetrics
// insights: Insight[]
```

### `useBarcodeScanner()`
```typescript
useBarcodeScanner({
  onScan: (code: string) => void,
  minLength: 3,        // Mínimo caracteres
  timeout: 100         // ms entre teclas
});
```

---

## 🎨 SISTEMA DE COMPONENTES UI

Todos en `src/components/ui/` siguiendo patrón Shadcn/UI:

```typescript
✅ Button    - Variantes: default, outline, ghost, destructive, success
✅ Input     - Estilos base con focus ring
✅ Label     - Asociado con inputs
✅ Card      - Header, Content, Footer
✅ Dialog    - Modales con overlay
✅ Table     - Header, Body, Row, Cell
✅ Avatar    - Con fallback de iniciales
✅ Toast     - Notificaciones temporales
```

**Variante especial: Button success**
```typescript
<Button variant="success">COBRAR</Button>
// → Fondo verde, texto blanco
```

---

## 📡 CLIENTE API

**Archivo:** `src/lib/api-client.ts`

```typescript
class ApiClient {
  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, data: unknown): Promise<T>
  async put<T>(endpoint: string, data: unknown): Promise<T>
  async delete<T>(endpoint: string): Promise<T>
}

export const apiClient = new ApiClient();
```

**Características:**
- ✅ Agrega automáticamente token de localStorage
- ✅ Manejo de errores centralizado
- ✅ Headers `Content-Type: application/json`
- ✅ Tipado con TypeScript genéricos

**Endpoints del Backend:**
```
POST   /api/auth/login          → { access_token, user }
GET    /api/auth/me             → User
GET    /api/productos           → Producto[]
POST   /api/productos           → Producto
PUT    /api/productos/:id       → Producto
DELETE /api/productos/:id       → void
POST   /api/ventas              → Venta
GET    /api/dashboard/metrics   → DashboardMetrics
GET    /api/insights            → Insight[]
```

---

## 🚀 GUÍA DE INSTALACIÓN

### 1. Instalar Dependencias
```bash
cd frontend
npm install
```

### 2. Configurar Backend
```bash
cp .env.local.example .env.local
# Editar .env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Ejecutar
```bash
npm run dev
# → http://localhost:3000
```

### 4. Login de Prueba
```
Email: admin@tienda.com
Password: (tu contraseña del backend)
```

---

## 🔧 PUNTOS DE INTEGRACIÓN CON BACKEND

### Autenticación
```typescript
// Frontend envía:
POST /api/auth/login
{ email: string, password: string }

// Backend debe devolver:
{
  access_token: string,
  token_type: "bearer",
  user: {
    id: number,
    email: string,
    nombre: string,
    tienda: {
      id: number,
      nombre: string,
      rubro: string
    }
  }
}
```

### Productos
```typescript
// GET /api/productos
Producto[] = [
  {
    id: 1,
    nombre: "Coca Cola 500ml",
    sku: "COCA500",
    precio: 500,
    stock: 50,
    rubro: "COMESTIBLE",
    pesable: false,
    codigo_barras: "7791234567890",
    imagen_url?: string,
    variantes?: {
      talles?: string[],
      colores?: string[]
    }
  }
]
```

### Ventas
```typescript
// POST /api/ventas
{
  items: [
    {
      producto_id: 1,
      cantidad: 2,
      precio_unitario: 500
    }
  ],
  metodo_pago: "EFECTIVO" | "MERCADOPAGO" | "TARJETA"
}

// Backend debe devolver:
{
  id: number,
  fecha: string,  // ISO format
  total: number,
  metodo_pago: string,
  items: ItemVenta[],
  estado: "COMPLETADA"
}
```

### Dashboard
```typescript
// GET /api/dashboard/metrics
{
  ventas_hoy: number,
  tickets_emitidos: number,
  productos_bajo_stock: number,
  ventas_semana: [
    { fecha: "2025-11-20", total: 15000 },
    { fecha: "2025-11-21", total: 18000 }
  ]
}

// GET /api/insights
Insight[] = [
  {
    id: 1,
    tipo: "WARNING" | "INFO" | "SUCCESS",
    mensaje: "Te estás quedando sin stock de Coca-Cola",
    fecha: "2025-11-20T10:30:00"
  }
]
```

---

## 📱 PANTALLAS Y RUTAS

```
┌─────────────────────────────────────────────┐
│ /login                                      │
│ → Página de login (sin autenticación)      │
│ → Redirige a /dashboard si ya hay token    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ LAYOUT CON SIDEBAR (protegido)             │
│                                             │
│  ├─ /dashboard                              │
│  │  → Métricas, gráficos, insights          │
│  │                                           │
│  ├─ /pos  💎                                │
│  │  → Scanner, productos, carrito, cobro    │
│  │                                           │
│  ├─ /productos                               │
│  │  → Tabla, ABM, formulario dinámico       │
│  │                                           │
│  └─ /caja                                    │
│     → (Pendiente de implementar)            │
└─────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE FUNCIONALIDADES

### Autenticación
- [x] Login con email/password
- [x] Protección de rutas con middleware
- [x] Logout con limpieza de token
- [x] Auto-redirección según estado

### Layout
- [x] Sidebar colapsable
- [x] Header con nombre de tienda
- [x] Avatar de usuario
- [x] Indicador de ruta activa

### POS
- [x] Scanner de código de barras USB
- [x] Búsqueda manual de productos
- [x] Grilla responsive de productos
- [x] Carrito con +/- cantidad
- [x] Modal de cobro (Efectivo/MP)
- [x] Cálculo automático de vuelto
- [x] Integración con backend para ventas

### Productos
- [x] Tabla con búsqueda
- [x] Crear producto
- [x] Editar producto
- [x] Eliminar producto
- [x] Formulario con campos dinámicos (Ropa → Talles/Colores)
- [x] Campo pesable con peso
- [x] Código de barras

### Dashboard
- [x] Cards de métricas
- [x] Gráfico de ventas 7 días
- [x] Lista de insights IA
- [x] Actualización automática (refetch)

### UX/UI
- [x] Diseño minimalista
- [x] Mobile first responsive
- [x] Transiciones suaves
- [x] Toasts de confirmación
- [x] Estados de carga
- [x] Manejo de errores visual

---

## 🎯 SIGUIENTES PASOS (Opcional)

1. **Módulo Caja** (`/caja`)
   - Cierre de turno
   - Conciliación efectivo/digital
   - Historial de ventas del día

2. **Impresión de Tickets**
   - Integración con impresora térmica
   - Template de ticket personalizable

3. **Mercado Pago Real**
   - SDK de MP en frontend
   - QR dinámico por transacción
   - Webhook de confirmación

4. **Reportes Avanzados**
   - Ventas por período
   - Productos más vendidos
   - Exportación a Excel/PDF

5. **Modo Offline**
   - Service Workers
   - IndexedDB para caché
   - Sincronización cuando vuelve conexión

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

- Next.js App Router: https://nextjs.org/docs/app
- Shadcn/UI: https://ui.shadcn.com
- TanStack Query: https://tanstack.com/query/latest
- Tailwind CSS: https://tailwindcss.com
- Recharts: https://recharts.org

---

**Desarrollado por:** Senior Frontend Architect
**Fecha:** Noviembre 2025
**Versión:** 1.0.0
