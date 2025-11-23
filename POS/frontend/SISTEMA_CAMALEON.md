# 🦎 Sistema Camaleón - Nexus POS

## Descripción

El **Sistema Camaleón** es una arquitectura adaptativa que transforma la interfaz de usuario del POS según el rubro del negocio. La aplicación "cambia de piel" automáticamente para ofrecer una experiencia optimizada para cada tipo de comercio.

## 🎯 Rubros Soportados

### 1. 👕 Ropa / Indumentaria
**Características:**
- Gestión de variantes (colores y talles)
- Matriz de stock por combinación
- Selector visual en ventas
- Experiencia optimizada para boutiques y tiendas de moda

**Flujo de Venta:**
1. Cliente selecciona producto
2. Se abre modal de selección de variantes
3. Elige color y talle
4. Sistema valida stock de esa combinación específica
5. Agrega al carrito con la variante seleccionada

### 2. 🥩 Carnicería / Verdulería (Pesables)
**Características:**
- Precio por kilogramo
- Stock en decimales
- Calculadora de peso en ventas
- Experiencia optimizada para productos a granel

**Flujo de Venta:**
1. Cliente selecciona producto
2. Se abre modal de ingreso de peso
3. Ingresa peso (con botones rápidos: 0.25kg, 0.5kg, 1kg, etc.)
4. Sistema calcula precio automáticamente (peso × precio/kg)
5. Agrega al carrito con el precio calculado

### 3. 🍬 Kiosco / Drugstore (General)
**Características:**
- Código de barras prioritario
- Escaneo rápido
- Ventas ágiles sin modales
- Experiencia optimizada para alto volumen

**Flujo de Venta:**
1. Cliente escanea código de barras o hace clic en producto
2. Se agrega **directamente al carrito** sin preguntas
3. Velocidad máxima para kioscos y drugstores

## 📁 Estructura de Archivos

```
frontend/src/
├── store/
│   └── use-store.ts                    # Store global Zustand (currentStore, rubro)
├── app/
│   ├── onboarding/
│   │   └── page.tsx                    # Selección inicial de rubro
│   └── (dashboard)/
│       ├── productos/
│       │   ├── page.tsx                # Lista de productos
│       │   └── producto-form-modal.tsx # Modal adaptativo
│       └── pos/
│           └── page.tsx                # Punto de venta adaptativo
├── components/
│   ├── productos/
│   │   ├── product-form-factory.tsx    # Factory principal
│   │   ├── clothing-product-form.tsx   # Formulario para ropa
│   │   ├── weighted-product-form.tsx   # Formulario para pesables
│   │   └── standard-product-form.tsx   # Formulario estándar
│   └── pos/
│       ├── product-card-pos.tsx        # Card adaptativa de producto
│       ├── variant-selector-modal.tsx  # Modal de variantes (ropa)
│       └── weight-input-modal.tsx      # Modal de peso (pesables)
```

## 🔧 Componentes Clave

### 1. Store Global (Zustand)

```typescript
// store/use-store.ts
export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      currentStore: null,
      rubro: null,  // 'ropa' | 'pesable' | 'general'
      setStore: (store) => set({ currentStore: store, rubro: mapRubroToType(store.rubro) }),
    }),
    { name: "nexus-store" }
  )
);
```

### 2. ProductFormFactory

```typescript
// Selecciona el formulario correcto según el rubro
function ProductFormFactory({ producto, formData, setFormData }) {
  const { rubro } = useStore();
  
  switch (rubro) {
    case "ropa":
      return <ClothingProductForm {...props} />;
    case "pesable":
      return <WeightedProductForm {...props} />;
    default:
      return <StandardProductForm {...props} />;
  }
}
```

### 3. ProductCardPOS

```typescript
// Card adaptativa que decide qué hacer al hacer clic
function ProductCardPOS({ producto, onAddToCart }) {
  const isRopa = producto.atributos?.colores || producto.atributos?.talles;
  const isPesable = producto.atributos?.pesable;
  
  const handleClick = () => {
    if (isRopa) setVariantModalOpen(true);      // Modal de variantes
    else if (isPesable) setWeightModalOpen(true); // Modal de peso
    else onAddToCart(producto, { cantidad: 1 }); // Directo al carrito
  };
}
```

## 🚀 Flujo de Implementación

### 1. Onboarding (Primera Vez)
```
Usuario nuevo → /onboarding → Elige rubro → PATCH /api/v1/tiendas/me → /dashboard
```

### 2. Login Existente
```
Login → API devuelve user.tienda.rubro → Store Zustand actualizado → Dashboard
```

### 3. Carga de Producto
```
Click "Nuevo Producto" → ProductFormFactory lee rubro → Renderiza formulario específico
```

### 4. Venta en POS
```
Click en producto → ProductCardPOS detecta tipo → Abre modal o agrega directo
```

## 🎨 Modelo de Datos

### Producto (Ropa)
```json
{
  "id": "uuid",
  "nombre": "Remera Lisa",
  "sku": "REM-001",
  "precio_venta": 5000,
  "atributos": {
    "colores": ["negro", "blanco", "rojo"],
    "talles": ["S", "M", "L"],
    "variantes_stock": {
      "negro-S": 10,
      "negro-M": 15,
      "blanco-L": 5
    }
  }
}
```

### Producto (Pesable)
```json
{
  "id": "uuid",
  "nombre": "Carne Molida",
  "sku": "CAR-001",
  "precio_venta": 2500,  // Precio por kg
  "stock_actual": 15.5,   // Stock en kg (decimal)
  "atributos": {
    "pesable": true,
    "unidad": "kg"
  }
}
```

### Producto (General)
```json
{
  "id": "uuid",
  "nombre": "Coca-Cola 500ml",
  "sku": "COCA-500",
  "codigo_barras": "7790895001406",
  "precio_venta": 800,
  "stock_actual": 50
}
```

## 🔌 Integración con Backend

### Endpoint de Actualización de Rubro
```http
PATCH /api/v1/tiendas/me
Content-Type: application/json

{
  "rubro": "ropa"  // o "pesable" o "general"
}
```

### Endpoint de Usuario
```http
GET /api/v1/auth/me

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "tienda": {
    "id": "uuid",
    "nombre": "Mi Tienda",
    "rubro": "ropa"  ← Campo crítico
  }
}
```

## 📝 Notas de Implementación

### Persistencia
- El store Zustand persiste el `rubro` en `localStorage`
- Se sincroniza automáticamente en cada login
- Se actualiza al cambiar el rubro en onboarding

### Validaciones
- **Ropa**: Valida stock por variante específica
- **Pesable**: Valida que el peso no supere el stock disponible
- **General**: Valida stock entero tradicional

### UX/UI
- Cada rubro tiene colores y iconos distintivos
- Los formularios cambian completamente de estructura
- Los modales de venta son específicos para cada caso

## 🎯 Próximos Pasos

1. **Reportes por Rubro**: Dashboards específicos para cada tipo
2. **Más Rubros**: Farmacia, Ferretería, etc.
3. **Configuración Avanzada**: Permitir rubros personalizados
4. **Templates**: Precargar productos según el rubro elegido

## 🐛 Troubleshooting

**Problema**: El formulario no cambia al crear producto
- Verificar que `useStore().rubro` tenga un valor válido
- Revisar que la tienda tenga el campo `rubro` definido

**Problema**: Los productos no se agregan al carrito
- Verificar que `ProductCardPOS` esté recibiendo `onAddToCart`
- Revisar la estructura de `metadata` en el carrito

**Problema**: El onboarding no guarda el rubro
- Verificar que el endpoint `PATCH /api/v1/tiendas/me` exista
- Revisar que el backend actualice correctamente el campo

---

**Autor**: Sistema Camaleón v1.0  
**Fecha**: Noviembre 2025  
**Stack**: Next.js 14 + TypeScript + Zustand + Shadcn/UI
