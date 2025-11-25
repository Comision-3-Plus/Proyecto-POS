# Dependencias a instalar

## Paso 1: Instalar dependencias principales
```bash
cd web-portal
npm install @tanstack/react-query @tanstack/react-query-devtools axios zod react-hook-form @hookform/resolvers sonner lucide-react
```

## Paso 2: Instalar shadcn/ui
```bash
npx shadcn-ui@latest init
```

Cuando pregunte, seleccionar:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes

## Paso 3: Agregar componentes de shadcn/ui
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add card
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add tabs
```

## Paso 4: Instalar Orval (generación de cliente API)
```bash
npm install -D orval
```

## Paso 5: Configurar variables de entorno
```bash
cp .env.local.example .env.local
```

Editar `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="Nexus POS"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## Paso 6: Generar cliente API con Orval
```bash
npm run generate:api
```

## Resumen de dependencias instaladas

### Principales:
- `@tanstack/react-query` - Estado del servidor
- `@tanstack/react-query-devtools` - DevTools de React Query
- `axios` - Cliente HTTP
- `zod` - Validación de esquemas
- `react-hook-form` - Gestión de formularios
- `@hookform/resolvers` - Resolvers para react-hook-form
- `sonner` - Notificaciones toast
- `lucide-react` - Iconos

### shadcn/ui components:
- button, input, form, table, badge, select, textarea
- dialog, dropdown-menu, card, alert, tabs

### Dev dependencies:
- `orval` - Generación de cliente API desde OpenAPI
