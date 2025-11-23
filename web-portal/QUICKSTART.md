# ⚡ QUICK START - Nexus POS Frontend

## 🚀 Instalación Rápida (3 pasos)

### 1️⃣ Instalar Dependencias
```bash
cd c:\Users\juani\Desktop\POS\frontend
npm install
```

### 2️⃣ Configurar Backend URL
```bash
# Copiar archivo de ejemplo
copy .env.local.example .env.local

# O crear directamente .env.local con:
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
```

### 3️⃣ Ejecutar
```bash
npm run dev
```

Abre http://localhost:3000 🎉

---

## 🔑 Credenciales de Prueba

Según tu backend, por ejemplo:
```
Email: admin@nexuspos.com
Password: tu_password_aqui
```

---

## 📁 Archivos Clave para Revisar

```
📂 frontend/
  ├── 📄 README.md              ← Documentación general
  ├── 📄 ARQUITECTURA.md        ← Arquitectura completa (LEER ESTO!)
  │
  ├── 📂 src/
  │   ├── 📂 app/
  │   │   ├── (dashboard)/
  │   │   │   ├── pos/
  │   │   │   │   └── page.tsx     ← 💎 MÓDULO POS (LO MÁS IMPORTANTE)
  │   │   │   ├── productos/
  │   │   │   │   └── page.tsx     ← Gestión de productos
  │   │   │   └── dashboard/
  │   │   │       └── page.tsx     ← Dashboard con métricas
  │   │   └── login/
  │   │       └── page.tsx         ← Pantalla de login
  │   │
  │   ├── 📂 hooks/
  │   │   ├── use-auth.ts          ← Hook de autenticación
  │   │   ├── use-products.ts      ← Hook de productos
  │   │   ├── use-sales.ts         ← Hook de ventas
  │   │   └── use-barcode-scanner.ts  ← Scanner USB (¡IMPORTANTE!)
  │   │
  │   ├── 📂 components/
  │   │   ├── layout/
  │   │   │   └── dashboard-layout.tsx  ← Sidebar + Header
  │   │   └── ui/                  ← Componentes Shadcn/UI
  │   │
  │   ├── 📂 lib/
  │   │   └── api-client.ts        ← Cliente HTTP para backend
  │   │
  │   └── 📂 types/
  │       └── index.ts             ← Tipos TypeScript
  │
  └── 📄 middleware.ts             ← Protección de rutas
```

---

## 🎯 Flujo de Usuario

```
1. Abre http://localhost:3000
   ↓
2. Redirige a /login (si no hay token)
   ↓
3. Ingresa email/password
   ↓
4. Redirige a /dashboard
   ↓
5. Navega a /pos para vender
```

---

## 💎 MÓDULO POS - Cómo Usar

### Opción 1: Click Manual
1. Ve a `/pos`
2. Busca productos en la barra superior
3. Click en el producto → Se agrega al carrito
4. Modifica cantidad con +/-
5. Click en "COBRAR"
6. Elige método: Efectivo o Mercado Pago
7. Confirma venta

### Opción 2: Scanner de Código de Barras
1. Conecta lector USB (simula teclado)
2. Escanea código de barras
3. ¡Producto se agrega automáticamente al carrito!
4. Continúa escaneando más productos
5. Click en "COBRAR"

**Nota:** El scanner detecta cuando tecleas rápido y terminas con Enter (comportamiento de lectores USB estándar).

---

## 🔌 Conexión con Backend

El frontend espera que el backend esté corriendo en:
```
http://localhost:8000
```

### Endpoints Requeridos:

```http
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

Si tu backend usa rutas diferentes, actualiza:
```typescript
// src/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'react'"
```bash
npm install
```

### Error: "NEXT_PUBLIC_API_URL is not defined"
Crea `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Error 401: Unauthorized
Verifica que:
1. Backend esté corriendo
2. Credenciales sean correctas
3. Token se esté guardando en localStorage

### Scanner no funciona
Verifica que:
1. Lector USB esté conectado
2. Funcione como teclado (escribe en Notepad)
3. Termine cada scan con Enter

---

## 📝 Scripts Disponibles

```bash
npm run dev          # Modo desarrollo (puerto 3000)
npm run build        # Build para producción
npm run start        # Ejecutar build de producción
npm run lint         # Verificar código
```

---

## 🎨 Personalización Rápida

### Cambiar Colores
Edita `src/app/globals.css`:
```css
:root {
  --primary: 222.2 47.4% 11.2%;  /* Negro por defecto */
  --primary: 220 50% 50%;        /* Cambiar a azul */
}
```

### Cambiar Logo
Edita `src/components/layout/dashboard-layout.tsx`:
```tsx
<span className="text-white font-bold text-2xl">N</span>
<!-- Cambia "N" por tu inicial -->
```

### Agregar Campo en Productos
1. Edita `src/types/index.ts` → Agrega propiedad en `Producto`
2. Edita `src/app/(dashboard)/productos/producto-form-modal.tsx` → Agrega input

---

## 📚 Siguiente Lectura

Para entender la arquitectura completa:
👉 **Lee `ARQUITECTURA.md`**

Contiene:
- Explicación detallada de cada módulo
- Diagramas de flujo
- Guía de hooks
- Integración con backend
- Ejemplos de código

---

## 💡 Tips de Desarrollo

### Hot Reload
Next.js recarga automáticamente cuando guardas cambios.

### TypeScript
Los errores de tipo se muestran en:
- VSCode (si tienes instalado)
- Terminal de npm run dev
- Navegador (en desarrollo)

### React Query DevTools
Descomentar en `src/app/providers.tsx` para ver queries en navegador:
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

---

## ✅ Checklist Primera Ejecución

- [ ] Backend corriendo en puerto 8000
- [ ] `npm install` ejecutado sin errores
- [ ] `.env.local` creado con URL correcta
- [ ] `npm run dev` ejecutado
- [ ] http://localhost:3000 abre correctamente
- [ ] Login funciona
- [ ] Dashboard muestra datos
- [ ] POS carga productos
- [ ] Crear venta funciona

---

## 🆘 Ayuda

Si algo no funciona:

1. **Verifica backend**: `curl http://localhost:8000/api/productos`
2. **Verifica logs**: Mira la terminal de `npm run dev`
3. **Verifica Network**: F12 → Network → Ve las peticiones

---

**¡Listo! Ahora tenés el frontend completo de Nexus POS funcionando** 🚀

Para más detalles técnicos, lee `ARQUITECTURA.md`.
