# Instrucciones para crear super admin y tienda demo

## Opción 1: SQL Manual (usando Adminer en http://localhost:8080)

### 1. Crear Super Admin

```sql
-- 1. Primero crear la tienda
INSERT INTO tiendas (id, nombre, rubro, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Boutique NexusPOS',
  'indumentaria',
  true,
  NOW()
) RETURNING id;

-- 2. Crear el super admin (usar el UUID devuelto arriba como tienda_id)
INSERT INTO users (
  id,
  email,
  hashed_password,
  full_name,
  documento_tipo,
  documento_numero,
  rol,
  tienda_id,
  is_active,
  created_at
)
VALUES (
  gen_random_uuid(),
  'admin@nexuspos.com',
  -- Password: admin123 (hash bcrypt)
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Jw45m3aYCYUPL6Lmq',
  'Super Admin',
  'DNI',
  '00000000',
  'admin',
  '<REEMPLAZAR_CON_UUID_DE_TIENDA>',
  true,
  NOW()
);
```

## Opción 2: Usando curl para registrar tienda

```powershell
# Probar endpoint de registro (crea usuario + tienda automáticamente)
curl -X POST http://localhost:8001/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "full_name": "Juan Pérez",
    "email": "juan@test.com",
    "dni": "12345678",
    "password": "password123",
    "tienda_nombre": "Mi Tienda de Prueba",
    "tienda_rubro": "indumentaria"
  }'
```

## Opción 3: Desde el frontend

1. Abrir http://localhost:3000/register
2. Completar el formulario:
   - Nombre: Tu Nombre
   - Email: tu@email.com
   - DNI: 12345678
   - Contraseña: minimo8caracteres
   - Nombre de tienda: Mi Negocio
   - Rubro: indumentaria
3. Click en "Crear Mi Tienda"
4. Serás redirigido al dashboard automáticamente

## Login

Después de crear el admin o registrarte, puedes iniciar sesión en:
- http://localhost:3000/login

Credenciales admin (si lo creaste manualmente):
- Email: admin@nexuspos.com
- Password: admin123

O usa las credenciales que registraste en el formulario.
