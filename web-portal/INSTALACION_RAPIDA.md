# 🚀 GUÍA RÁPIDA DE INSTALACIÓN - NEXUS POS FRONTEND

## ⏱️ Tiempo estimado: 10 minutos

---

## 📋 PASO 1: Instalar Dependencias (2 min)

```bash
cd web-portal
npm install
```

Esto instalará todas las dependencias necesarias:
- React Query (server state)
- Zustand (client state)
- Axios (HTTP client)
- React Hook Form + Zod (forms & validation)
- Sonner (notifications)
- Lucide React (icons)
- Orval (API generator)

---

## 🎨 PASO 2: Configurar Shadcn/UI (3 min)

```bash
# Inicializar Shadcn/UI
npx shadcn@latest init

# Cuando pregunte, selecciona:
# ✅ Style: Default
# ✅ Base color: Slate
# ✅ CSS variables: Yes
# ✅ Path aliases: @/* (default)
```

Luego instala los componentes UI necesarios:

```bash
npx shadcn@latest add button input card dialog select badge tabs alert
```

**Componentes instalados:**
- `button` - Botones interactivos
- `input` - Campos de formulario
- `card` - Tarjetas/Cards
- `dialog` - Modales/Diálogos
- `select` - Dropdowns
- `badge` - Etiquetas/Badges
- `tabs` - Pestañas
- `alert` - Alertas

---

## ⚙️ PASO 3: Configurar Variables de Entorno (1 min)

```bash
# Copiar el archivo de ejemplo
cp .env.local.example .env.local

# Editar con tu URL del backend
# Windows:
notepad .env.local

# Mac/Linux:
nano .env.local
```

**Contenido del archivo `.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Nota:** Si tu backend corre en otro puerto, ajusta la URL.

---

## 🤖 PASO 4: Generar Cliente API con Orval (2 min)

```bash
npm run generate:api
```

**Qué hace esto:**
1. Lee el archivo `ORVAL.json` (OpenAPI spec del backend)
2. Genera tipos TypeScript automáticamente
3. Crea hooks de React Query para cada endpoint
4. Todo con type-safety completo

**Output esperado:**
```
🍻 Start orval v6.31.0
nexus-pos-api: Cleaning output folder
Running afterAllFilesWrite hook...
🎉 nexus-pos-api - Your OpenAPI spec has been converted!
```

**Archivos generados:**
- `src/api/generated/endpoints.ts` - Hooks de React Query
- `src/api/generated/models/` - Tipos TypeScript

---

## 🚀 PASO 5: Iniciar en Desarrollo (1 min)

```bash
npm run dev
```

**La aplicación estará disponible en:**
```
http://localhost:3000
```

---

## ✅ PASO 6: Verificar Instalación

### 6.1 Login
1. Abre `http://localhost:3000`
2. Deberías ver la página de login automáticamente
3. Credenciales de prueba:
   - Usuario: `admin`
   - Contraseña: `admin123`

### 6.2 Dashboard
1. Después del login, verás el Dashboard
2. Verifica que las métricas se carguen
3. Cambia entre tabs "Hoy" / "Este Mes"

### 6.3 POS (Punto de Venta)
1. Click en "Punto de Venta" en el sidebar
2. Intenta escanear un producto (o buscar por nombre)
3. Agrega items al carrito
4. Procesa una venta de prueba

---

## 🛠️ COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar producción
npm run start

# Linter
npm run lint

# Regenerar API (después de cambios en el backend)
npm run generate:api

# Type checking
npm run type-check
```

---

## 📁 VERIFICAR ESTRUCTURA DE ARCHIVOS

Tu estructura debería verse así:

```
web-portal/
├── .env.local              ✅ Variables de entorno
├── orval.config.ts         ✅ Configuración de Orval
├── src/
│   ├── api/
│   │   ├── custom-instance.ts       ✅
│   │   └── generated/               🤖 Auto-generado
│   │       ├── endpoints.ts
│   │       └── models/
│   ├── app/
│   │   ├── (auth)/login/page.tsx    ✅
│   │   └── (dashboard)/
│   │       ├── layout.tsx           ✅
│   │       ├── dashboard/page.tsx   ✅
│   │       └── pos/page.tsx         ✅
│   ├── components/
│   │   └── ui/                      ✅ Shadcn/UI components
│   ├── lib/
│   │   ├── query-client.ts          ✅
│   │   └── utils.ts                 ✅
│   ├── providers/
│   │   └── app-providers.tsx        ✅
│   └── stores/
│       └── cart-store.ts            ✅
└── package.json                     ✅
```

---

## ⚠️ TROUBLESHOOTING

### Problema: `npm install` falla con error de peer dependencies

**Solución:**
```bash
npm install --legacy-peer-deps
```

### Problema: Shadcn init pregunta por configuración

**Respuestas recomendadas:**
- ✅ TypeScript: Yes
- ✅ Style: Default
- ✅ Base color: Slate
- ✅ CSS variables: Yes
- ✅ Tailwind CSS: Yes (ya está configurado)
- ✅ Import alias: @/*

### Problema: Error "Cannot find module @/components/ui/button"

**Solución:**
```bash
npx shadcn@latest add button
```

Repite para cada componente que falte.

### Problema: API no se genera

**Causas posibles:**
1. El archivo `ORVAL.json` no existe en la raíz del proyecto
2. La ruta en `orval.config.ts` es incorrecta

**Solución:**
```bash
# Verificar que ORVAL.json existe
ls ../ORVAL.json

# Si no existe, cópialo desde el backend
```

### Problema: Backend no responde

**Verificar:**
1. El backend FastAPI está corriendo (`http://localhost:8000`)
2. La URL en `.env.local` es correcta
3. No hay CORS errors (revisa la consola del navegador)

---

## 🎯 PRÓXIMOS PASOS

Una vez que todo funcione:

1. **Explora el código:**
   - `src/app/(dashboard)/pos/page.tsx` - POS completo
   - `src/api/custom-instance.ts` - Interceptores
   - `src/stores/cart-store.ts` - Estado del carrito

2. **Implementa páginas adicionales:**
   - Productos (CRUD)
   - Ventas (listado)
   - Reportes (gráficos)
   - Inventario (alertas)

3. **Personaliza estilos:**
   - Los componentes de Shadcn/UI son 100% personalizables
   - Modifica colores en `tailwind.config.ts`

4. **Agrega tests:**
   - Instala `@testing-library/react`
   - Crea tests para componentes críticos

---

## 📚 RECURSOS

- **Documentación de Orval:** https://orval.dev/
- **React Query:** https://tanstack.com/query/latest
- **Zustand:** https://zustand-demo.pmnd.rs/
- **Shadcn/UI:** https://ui.shadcn.com/
- **Next.js 14:** https://nextjs.org/docs

---

## ✨ RESULTADO ESPERADO

Después de completar todos los pasos, deberías tener:

✅ Aplicación corriendo en `http://localhost:3000`  
✅ Login funcional con JWT  
✅ Dashboard con métricas en tiempo real  
✅ POS completamente operativo  
✅ Código 100% type-safe  
✅ Error handling global  
✅ UI profesional con Shadcn/UI  

---

**🎉 ¡Instalación Completa! Ahora puedes comenzar a desarrollar. 🎉**

Si tienes problemas, revisa el archivo `IMPLEMENTACION_FRONTEND.md` para más detalles técnicos.
