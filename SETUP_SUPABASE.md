# 🚀 Guía de Configuración con Supabase

## 📋 Pre-requisitos

1. Cuenta en Supabase: https://supabase.com
2. Proyecto creado en Supabase
3. (Opcional) Upstash Redis: https://upstash.com
4. (Opcional) CloudAMQP RabbitMQ: https://cloudamqp.com

## 🗄️ Paso 1: Configurar Supabase Database

### 1.1 Crear Proyecto en Supabase
1. Ve a https://app.supabase.com
2. Click en "New Project"
3. Configura:
   - **Name**: nexus-pos
   - **Database Password**: (guarda esta contraseña!)
   - **Region**: Selecciona el más cercano (ej: South America - São Paulo)
4. Click "Create new project" (tarda ~2 minutos)

### 1.2 Obtener Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **Database**
2. Busca la sección **Connection string**
3. Selecciona el modo **Transaction** (pooler)
4. Copia el connection string

Ejemplo:
```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 1.3 Configurar .env

```bash
# Copiar template
cp .env.supabase .env

# Editar y reemplazar:
# - YOUR_PROJECT_REF con tu project ref
# - YOUR_PASSWORD con tu database password
```

Ejemplo de configuración:
```env
DATABASE_URL=postgresql+asyncpg://postgres.abcdefghijklmn:Mi_Password_123@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

## 🔄 Paso 2: Ejecutar Migraciones

### 2.1 Instalar dependencias
```powershell
cd core-api
pip install -r requirements.txt
```

### 2.2 Ejecutar Alembic
```powershell
# Ver migraciones pendientes
alembic history

# Ejecutar todas las migraciones
alembic upgrade head
```

Si hay errores, puedes crear las tablas manualmente desde el SQL Editor de Supabase:

1. Ve a **SQL Editor** en Supabase
2. Ejecuta el contenido de `core-api/alembic/versions/[última_migración].py`

## 🔴 Paso 3: Configurar Redis (Opcional)

### Opción A: Upstash Redis (Recomendado - Gratis)

1. Ve a https://upstash.com
2. Click "Create Database"
3. Selecciona región más cercana
4. Copia el **Redis URL** (formato: `rediss://...`)
5. Pega en `.env`:
```env
REDIS_URL=rediss://default:YOUR_TOKEN@your-region.upstash.io:6379
```

### Opción B: Redis Local (Docker)
```powershell
docker run -d -p 6379:6379 redis:7-alpine
```
```env
REDIS_URL=redis://localhost:6379/0
```

## 🐰 Paso 4: Configurar RabbitMQ (Opcional)

### Opción A: CloudAMQP (Gratis hasta 1M mensajes/mes)

1. Ve a https://www.cloudamqp.com
2. Crea cuenta y nuevo cluster
3. Copia la **AMQP URL**
4. Pega en `.env`:
```env
RABBITMQ_URL=amqps://username:password@instance.cloudamqp.com/vhost
```

### Opción B: RabbitMQ Local (Docker)
```powershell
docker run -d -p 5672:5672 rabbitmq:3.13-management
```
```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
```

## 🚀 Paso 5: Ejecutar la API

```powershell
# Desde la carpeta core-api
cd core-api

# Opción 1: Uvicorn directo
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Opción 2: Script de desarrollo
python run_debug.py
```

La API estará en: **http://localhost:8000**
Documentación: **http://localhost:8000/docs**

## ✅ Paso 6: Verificar Conexión

### Método 1: Health Check
```powershell
curl http://localhost:8000/health
```

Deberías ver:
```json
{"status":"healthy","database":"connected"}
```

### Método 2: Crear Admin y Tienda
```powershell
Invoke-WebRequest -Method POST -Uri "http://localhost:8000/api/v1/auth/register" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "full_name":"Admin Principal",
    "email":"admin@nexuspos.com",
    "documento_numero":"00000000",
    "password":"admin123",
    "tienda_nombre":"Boutique NexusPOS",
    "tienda_rubro":"indumentaria"
  }'
```

## 📊 Verificar Datos en Supabase

1. Ve a **Table Editor** en Supabase
2. Deberías ver las tablas:
   - `tiendas`
   - `users`
   - `locations`
   - `products`
   - `ventas`
   - etc.

3. En la tabla `users` deberías ver tu usuario admin

## 🌐 Desplegar en Producción

### Backend en Railway/Render

1. Conecta tu repo de GitHub
2. Configura variables de entorno (usar `.env.supabase` como referencia)
3. Deploy automático

### Frontend en Vercel

1. Conecta tu repo
2. Build command: `cd frontend && npm run build`
3. Output directory: `frontend/dist`
4. Variables de entorno:
```
VITE_API_URL=https://your-api.railway.app
```

## 🔧 Troubleshooting

### Error: "password authentication failed"
- Verifica que la contraseña en DATABASE_URL sea correcta
- Prueba copiar nuevamente desde Supabase Settings → Database

### Error: "SSL required"
- Asegúrate de usar `postgresql+asyncpg://` (con +asyncpg)
- El pooler de Supabase requiere SSL por defecto

### Error: "relation does not exist"
- Ejecuta las migraciones: `alembic upgrade head`
- O crea las tablas manualmente desde SQL Editor

### Frontend no conecta con API
- Verifica CORS en `.env`: `BACKEND_CORS_ORIGINS=http://localhost:3000`
- En producción, agrega tu dominio de Vercel

## 📚 Recursos Adicionales

- [Supabase Docs](https://supabase.com/docs)
- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [CloudAMQP Docs](https://www.cloudamqp.com/docs/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

## 🎯 Próximos Pasos

1. ✅ Configurar Supabase Database
2. ✅ Ejecutar migraciones
3. ✅ Configurar Redis (opcional)
4. ✅ Configurar RabbitMQ (opcional)
5. ✅ Levantar API local
6. ✅ Verificar con curl/Postman
7. ✅ Conectar frontend
8. 🚀 Deploy a producción

---

**¿Necesitas ayuda?** Revisa los logs con:
```powershell
# Ver logs de la API
tail -f core-api/logs/app.log

# O si usas uvicorn directo, los logs aparecen en consola
```
