# 🛠️ COMANDOS ÚTILES - NEXUS POS FRONTEND

## 📦 NPM Scripts

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000

# Iniciar con puerto específico
PORT=3001 npm run dev

# Limpiar cache de Next.js y reiniciar
rm -rf .next
npm run dev
```

### Producción
```bash
# Compilar para producción
npm run build

# Ejecutar build de producción
npm run start

# Compilar y ejecutar
npm run build && npm run start
```

### Code Quality
```bash
# Linter
npm run lint

# Fix automático de lint
npm run lint -- --fix

# Type checking (sin compilar)
npm run type-check
```

### API Generation
```bash
# Generar código desde ORVAL.json
npm run generate:api

# Generar y mostrar output detallado
npm run generate:api -- --verbose

# Limpiar código generado anterior
rm -rf src/api/generated
npm run generate:api
```

---

## 🔄 Regeneración de API

### Cuando regenerar:

1. **Después de cambios en el backend:**
```bash
# 1. Obtener nuevo OpenAPI spec
curl http://localhost:8000/openapi.json > ../ORVAL.json

# 2. Regenerar código
npm run generate:api
```

2. **Después de actualizar ORVAL.json manualmente:**
```bash
npm run generate:api
```

3. **Después de cambios en orval.config.ts:**
```bash
npm run generate:api
```

---

## 🎨 Shadcn/UI Components

### Instalar componentes individuales:
```bash
# Button
npx shadcn@latest add button

# Input
npx shadcn@latest add input

# Card
npx shadcn@latest add card

# Dialog
npx shadcn@latest add dialog

# Select
npx shadcn@latest add select

# Badge
npx shadcn@latest add badge

# Tabs
npx shadcn@latest add tabs

# Alert
npx shadcn@latest add alert

# Table
npx shadcn@latest add table

# Form
npx shadcn@latest add form

# Toast (ya incluido con Sonner)
# npx shadcn@latest add toast
```

### Instalar múltiples componentes:
```bash
npx shadcn@latest add button input card dialog select badge tabs alert table form
```

### Listar componentes disponibles:
```bash
npx shadcn@latest
```

---

## 🔍 Debugging

### React Query DevTools
```bash
# Ya incluido en el proyecto
# Abre http://localhost:3000 y mira la esquina inferior derecha
# Click en el icono flotante para abrir DevTools
```

### Zustand DevTools
```bash
# Redux DevTools Extension requerida
# Chrome: https://chrome.google.com/webstore/detail/redux-devtools/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/

# Una vez instalada, abre DevTools del navegador → Redux tab
```

### Next.js Build Analyzer
```bash
# Instalar
npm install -D @next/bundle-analyzer

# Agregar a next.config.ts
# Ver IMPLEMENTATION_FRONTEND.md para configuración

# Ejecutar análisis
ANALYZE=true npm run build
```

---

## 🧹 Limpieza

### Limpiar cache de Next.js:
```bash
rm -rf .next
```

### Limpiar node_modules:
```bash
rm -rf node_modules
npm install
```

### Limpiar código generado:
```bash
rm -rf src/api/generated
npm run generate:api
```

### Limpiar todo:
```bash
rm -rf .next node_modules src/api/generated
npm install
npm run generate:api
```

---

## 📊 Análisis de Bundle

### Ver tamaño del bundle:
```bash
npm run build
# Mira el output en la terminal
```

### Analizar dependencias:
```bash
# Instalar herramienta
npm install -D webpack-bundle-analyzer

# Agregar script en package.json:
# "analyze": "ANALYZE=true next build"

# Ejecutar
npm run analyze
```

---

## 🧪 Testing (cuando se implemente)

```bash
# Instalar Jest y Testing Library
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Ejecutar tests
npm test

# Ejecutar con coverage
npm test -- --coverage

# Ejecutar en watch mode
npm test -- --watch
```

---

## 🔐 Variables de Entorno

### Desarrollo:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Producción:
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.tuproduto.com
```

### Verificar variables:
```bash
# En el navegador, consola:
console.log(process.env.NEXT_PUBLIC_API_URL)
```

---

## 🚀 Deployment

### Vercel (recomendado):
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy a producción
vercel --prod
```

### Build manual:
```bash
# 1. Compilar
npm run build

# 2. El output está en .next/
# 3. Copiar a tu servidor y ejecutar:
npm run start
```

### Docker:
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD ["npm", "start"]
```

```bash
# Build Docker image
docker build -t nexus-pos-frontend .

# Run container
docker run -p 3000:3000 nexus-pos-frontend
```

---

## 🔄 Git Workflow

### Setup inicial:
```bash
git init
git add .
git commit -m "feat: initial frontend setup with Orval + React Query"
```

### Commits convencionales:
```bash
git commit -m "feat: add POS module"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update installation guide"
git commit -m "refactor: improve error handling"
git commit -m "perf: optimize bundle size"
git commit -m "style: format code with prettier"
```

### Branches:
```bash
# Crear feature branch
git checkout -b feature/productos-crud

# Mergear a main
git checkout main
git merge feature/productos-crud
```

---

## 📚 Documentación

### Ver documentación:
```bash
# Abrir en navegador
open IMPLEMENTACION_FRONTEND.md
open INSTALACION_RAPIDA.md
open RESUMEN_EJECUTIVO.md
```

### Generar documentación de código:
```bash
# Instalar TypeDoc
npm install -D typedoc

# Generar docs
npx typedoc src

# Abrir docs/index.html
```

---

## 🐛 Troubleshooting Rápido

### Error: "Module not found: @/components/ui/button"
```bash
npx shadcn@latest add button
```

### Error: "Cannot find module 'sonner'"
```bash
npm install sonner
```

### Error: ORVAL generation fails
```bash
# Verificar que ORVAL.json existe
ls ../ORVAL.json

# Verificar orval.config.ts
cat orval.config.ts
```

### Error: API calls fail with CORS
```bash
# Verificar backend permite CORS
# Verificar NEXT_PUBLIC_API_URL en .env.local
cat .env.local
```

### Error: Build fails in production
```bash
# Limpiar y rebuild
rm -rf .next
npm run build
```

---

## 💡 Tips Útiles

### 1. Desarrollo rápido:
```bash
# Terminal 1: Backend
cd core-api
uvicorn main:app --reload

# Terminal 2: Frontend
cd web-portal
npm run dev

# Terminal 3: Watching de generación (opcional)
cd web-portal
watch -n 30 'npm run generate:api'
```

### 2. Verificar tipos sin compilar:
```bash
npm run type-check
```

### 3. Auto-format al guardar (VS Code):
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### 4. Prettier config:
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## 🎯 Workflows Comunes

### Agregar nuevo endpoint:

1. Actualizar backend y regenerar OpenAPI
2. Copiar nuevo ORVAL.json
3. Regenerar código:
```bash
npm run generate:api
```
4. Usar el nuevo hook en tu componente:
```typescript
import { useGetApiV1NuevoEndpoint } from '@/api/generated/endpoints';

const { data } = useGetApiV1NuevoEndpoint();
```

### Agregar nueva página:

1. Crear archivo:
```bash
mkdir -p src/app/\(dashboard\)/nueva-pagina
touch src/app/\(dashboard\)/nueva-pagina/page.tsx
```

2. Implementar:
```typescript
'use client';

export default function NuevaPaginaPage() {
  return <div>Nueva Página</div>;
}
```

3. Agregar al sidebar en `layout.tsx`

---

**¡Usa estos comandos para desarrollar más rápido! 🚀**
