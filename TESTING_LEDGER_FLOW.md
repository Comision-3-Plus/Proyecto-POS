# 🧪 Testing del Inventory Ledger System - Guía Completa

## 🎯 Objetivo

Este documento describe cómo ejecutar el **Smoke Test E2E** del sistema de Inventory Ledger para validar que:

1. ✅ El auto-provisioning de Location Default funciona
2. ✅ Los talles y colores básicos se crean automáticamente
3. ✅ Los productos con variantes se crean correctamente
4. ✅ El stock inicial se registra en el Ledger
5. ✅ El cálculo de stock desde el Ledger es correcto

---

## 🛠️ PASO 1: Fix del "Zombi Tenant" - COMPLETADO ✅

### Cambios Implementados

Se modificaron los endpoints de creación de tiendas para incluir **auto-provisioning** de recursos básicos:

#### Archivo: `core-api/api/routes/admin.py`

**Endpoints modificados:**
- `POST /admin/tiendas` - Crear tienda individual
- `POST /admin/onboarding` - Crear tienda + usuario dueño

**Auto-provisioning implementado:**

```python
# 1. Location Default
Location(
    tienda_id=nueva_tienda.id,
    name="Depósito Central",
    type="WAREHOUSE",
    is_default=True,
    address=tienda_data.nombre
)

# 2. Talles básicos
sizes_basicos = ["S", "M", "L", "XL"]
for i, s in enumerate(sizes_basicos):
    Size(tienda_id=nueva_tienda.id, name=s, sort_order=i)

# 3. Colores básicos
colores_basicos = [("Negro", "#000000"), ("Blanco", "#FFFFFF")]
for c_name, c_hex in colores_basicos:
    Color(tienda_id=nueva_tienda.id, name=c_name, hex_code=c_hex)
```

**Resultado:** Ahora **NO puede existir una Tienda sin Location Default**. Viola la integridad del negocio.

---

## 📋 PASO 2: Nuevos Endpoints de Catálogos

Se agregaron endpoints para consultar los recursos creados automáticamente:

### `GET /api/v1/productos/sizes`
Lista todos los talles de la tienda ordenados por `sort_order`.

**Response:**
```json
[
  {
    "id": 1,
    "tienda_id": "uuid",
    "name": "S",
    "sort_order": 0,
    "created_at": "2025-11-26T..."
  }
]
```

### `GET /api/v1/productos/colors`
Lista todos los colores de la tienda.

**Response:**
```json
[
  {
    "id": 1,
    "tienda_id": "uuid",
    "name": "Negro",
    "hex_code": "#000000",
    "created_at": "2025-11-26T..."
  }
]
```

### `GET /api/v1/productos/locations`
Lista todas las ubicaciones (sucursales/depósitos) de la tienda.

**Response:**
```json
[
  {
    "location_id": "uuid",
    "name": "Depósito Central",
    "type": "WAREHOUSE",
    "address": "Dirección Principal",
    "is_default": true
  }
]
```

---

## 🚀 PASO 3: Ejecutar el Smoke Test

### Prerrequisitos

1. **Base de datos funcionando**
   ```powershell
   docker-compose up -d postgres
   ```

2. **API corriendo**
   ```powershell
   cd core-api
   uvicorn main:app --reload --port 8000
   ```

3. **Super Admin existente en la BD**

   El test requiere un usuario con rol `super_admin`. Tienes 2 opciones:

   **Opción A: Usar el script de seed (recomendado)**
   ```powershell
   cd core-api
   python scripts/seed_demo_data.py
   ```

   **Opción B: Crear manualmente con SQL**
   ```sql
   -- 1. Crear una tienda para el super admin
   INSERT INTO tiendas (id, nombre, rubro, is_active)
   VALUES ('00000000-0000-0000-0000-000000000001', 'Sistema', 'sistema', true);

   -- 2. Crear el super admin
   INSERT INTO users (id, email, hashed_password, full_name, rol, tienda_id, is_active)
   VALUES (
     '00000000-0000-0000-0000-000000000002',
     'admin@nexuspos.com',
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeJ4W3K6HUYK', -- Password: admin123
     'Super Admin',
     'super_admin',
     '00000000-0000-0000-0000-000000000001',
     true
   );
   ```

### Ejecutar el Test

```powershell
# Desde la raíz del proyecto
python test_flow_ledger.py
```

### Salida Esperada

```
============================================================
🔥 SMOKE TEST - INVENTORY LEDGER SYSTEM 🔥
============================================================

🔐 PASO 1: Crear Super Admin para autenticación
------------------------------------------------------------
Intentando login como: admin@nexuspos.com
✅ Login exitoso - Token obtenido

🏪 PASO 2: Crear Tienda de Prueba (con auto-provisioning)
------------------------------------------------------------
Creando tienda: Test Clothing Co. abc123
✅ Tienda creada: 123e4567-e89b-12d3-a456-426614174000
  Nombre: Test Clothing Co. abc123
  Rubro: ropa

🔍 PASO 3: Verificar Auto-Provisioning de Recursos
------------------------------------------------------------
Creando usuario admin para la tienda...
✅ Usuario admin creado: admin.xyz789@test.com
Login con el usuario de la tienda...
✅ Login exitoso con usuario de tienda

Verificando Location Default...
Verificando Sizes básicos...
Verificando Colors básicos...
✅ Auto-provisioning verificado (Location, Sizes, Colors)

📦 PASO 4: Crear Producto con Variantes y Stock Inicial
------------------------------------------------------------
Creando producto: Remera Oversize Acid
  Base SKU: REM-ACID-a1b2
  Variantes: 3
✅ Producto creado: 456e7890-e12b-34d5-a678-426614174111
  Variantes creadas: 3
  Transacciones de inventario: 3

Variantes creadas:
  1. SKU: REM-ACID-A1B2-NEGRO-S
     Talle: S | Color: Negro
     Precio: $25000.0
     Stock Total: 10
  2. SKU: REM-ACID-A1B2-NEGRO-M
     Talle: M | Color: Negro
     Precio: $25000.0
     Stock Total: 5
  3. SKU: REM-ACID-A1B2-BLANCO-L
     Talle: L | Color: Blanco
     Precio: $26000.0
     Stock Total: 8

🔥 PASO 5: Validar Cálculo de Stock desde el Ledger
------------------------------------------------------------
Consultando stock de variante: REM-ACID-A1B2-NEGRO-S
  Variant ID: 789e0123-e45b-67d8-a901-426614174222
  Stock esperado: 10

Stock calculado desde el Ledger:
  SKU: REM-ACID-A1B2-NEGRO-S
  Producto: Remera Oversize Acid
  Total: 10

Stock por ubicación:
    - Depósito Central (WAREHOUSE): 10

✅ ✅ STOCK CORRECTO: 10 (esperado: 10)

📊 PASO 6: Validar Stock de Todas las Variantes
------------------------------------------------------------
✅ REM-ACID-A1B2-NEGRO-S: 10 ✓
✅ REM-ACID-A1B2-NEGRO-M: 5 ✓
✅ REM-ACID-A1B2-BLANCO-L: 8 ✓

============================================================
🎉 ¡TODOS LOS TESTS PASARON! 🎉
============================================================

✅ Sistema de Inventory Ledger funcionando correctamente
✅ Auto-provisioning de Location Default: OK
✅ Creación de productos con variantes: OK
✅ Transacciones de stock inicial en Ledger: OK
✅ Cálculo de stock desde Ledger: OK

🔥 SISTEMA LISTO PARA LA GUERRA! 🔥
```

---

## ❌ Troubleshooting

### Error: Super Admin no existe

```
❌ Super Admin no existe o credenciales incorrectas
Por favor, crea un super_admin manualmente con:
  Email: admin@nexuspos.com
  Password: admin123
  Rol: super_admin
```

**Solución:** Ejecutar el script de seed o crear el usuario manualmente (ver Prerrequisitos).

---

### Error: Size/Color no encontrado

```
❌ Error creando producto
Status Code: 404
Response: {"detail": "Talle con ID 1 no encontrado"}
```

**Posible Causa:** El auto-provisioning no funcionó correctamente.

**Solución:**
1. Verificar que los endpoints modificados se ejecutaron correctamente
2. Consultar manualmente los IDs:
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/productos/sizes
   curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/productos/colors
   ```
3. Ajustar los IDs en el script de test si es necesario

---

### Error: Location Default no existe

```
❌ Error: La tienda no tiene una ubicación default configurada
```

**Causa:** El auto-provisioning de Location falló.

**Solución:**
1. Verificar que el código de `admin.py` se guardó correctamente
2. Reiniciar el servidor de la API
3. Verificar logs del servidor para ver errores de creación

---

## 🔧 Próximos Pasos

Una vez que el test pase correctamente:

1. ✅ El Módulo 1 (Inventory Ledger) está validado
2. ✅ Puedes proceder al Módulo 2 (Facturación AFIP)
3. ✅ El sistema está listo para producción en cuanto a inventario

---

## 📝 Notas Técnicas

### Arquitectura del Test

El test sigue el patrón **Arrange-Act-Assert**:

1. **Arrange**: Crear super admin, tienda, usuario
2. **Act**: Crear producto con variantes y stock
3. **Assert**: Validar stock calculado desde ledger

### Transaccionalidad

El test valida que todo el flujo sea **ACID**:
- Si falla la creación de Location, se revierte la Tienda
- Si falla una variante, se revierten todas
- Si falla el ledger, se revierte el producto completo

### Idempotencia

El test NO es idempotente por diseño:
- Cada ejecución crea una nueva tienda con UUID único
- Esto permite múltiples ejecuciones sin conflictos
- Limpia la base de datos manualmente si es necesario

---

## 🎓 Aprendizajes

### ❌ Antes (Sin Auto-Provisioning)

```python
# Usuario crea tienda
POST /tiendas {"nombre": "Mi Tienda"}

# Usuario intenta crear producto
POST /productos {...}
❌ ERROR: "La tienda no tiene ubicación default"

# Usuario debe crear location manualmente
POST /locations {...}
```

### ✅ Ahora (Con Auto-Provisioning)

```python
# Usuario crea tienda
POST /tiendas {"nombre": "Mi Tienda"}
# ✅ Auto-crea: Location, Sizes, Colors

# Usuario crea producto directamente
POST /productos {...}
# ✅ Funciona de inmediato
```

---

## 🔥 Conclusión

Con este fix implementado:

- ✅ **NO más "zombi tenants"** - Todas las tiendas tienen Location Default
- ✅ **NO más pantallas en blanco** - Talles y colores ya existen
- ✅ **Mejor UX** - El usuario puede crear productos inmediatamente
- ✅ **Integridad garantizada** - La lógica está en el servicio, no en triggers

**¡SISTEMA LISTO PARA LA GUERRA! 🔥**
