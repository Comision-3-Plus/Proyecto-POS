"""
Redis Lua Scripts - Nexus POS
Scripts atómicos para operaciones críticas de stock

🎯 ¿Por qué Lua en Redis?
- Ejecución ATÓMICA: Nadie se puede meter en el medio
- Velocidad: Se ejecuta EN MEMORIA, dentro de Redis
- Sin Race Conditions: Evita overselling en hot sales
"""

# =====================================================
# SCRIPT 1: RESERVE_STOCK
# El "Patovica" que decide si hay stock o no
# =====================================================

RESERVE_STOCK_SCRIPT = """
-- KEYS[1]: La key del stock (ej: "stock:tienda_uuid:variant_uuid:location_uuid")
-- ARGV[1]: Cantidad a descontar (ej: 1)

local stock_key = KEYS[1]
local qty_required = tonumber(ARGV[1])

-- 1. Ver si existe el stock en caché
local current_stock = tonumber(redis.call('GET', stock_key))

-- Si no existe, devolvemos -2 (Cache Miss)
-- La app debe cargar desde PostgreSQL y reintentar
if current_stock == nil then
    return -2
end

-- 2. Ver si alcanza
if current_stock >= qty_required then
    -- 3. Descontar (DECRBY es atómico)
    local new_stock = redis.call('DECRBY', stock_key, qty_required)
    
    -- 4. Setear TTL de 1 hora (Para que no se quede viejo el cache)
    redis.call('EXPIRE', stock_key, 3600)
    
    return 1  -- Éxito (Stock reservado)
else
    -- Stock insuficiente
    return -1
end
"""


# =====================================================
# SCRIPT 2: ROLLBACK_STOCK
# Si falla la transacción, devolvemos el stock
# =====================================================

ROLLBACK_STOCK_SCRIPT = """
-- KEYS[1]: La key del stock
-- ARGV[1]: Cantidad a devolver (ej: 1)

local stock_key = KEYS[1]
local qty_to_return = tonumber(ARGV[1])

-- Verificar que la key existe
local current_stock = tonumber(redis.call('GET', stock_key))

if current_stock == nil then
    -- Si no existe, crear con la cantidad a devolver
    redis.call('SET', stock_key, qty_to_return)
    redis.call('EXPIRE', stock_key, 3600)
    return 1
end

-- Incrementar el stock
local new_stock = redis.call('INCRBY', stock_key, qty_to_return)
redis.call('EXPIRE', stock_key, 3600)

return new_stock
"""


# =====================================================
# SCRIPT 3: WARMUP_STOCK
# Cargar stock desde PostgreSQL al inicio
# =====================================================

WARMUP_STOCK_SCRIPT = """
-- KEYS[1]: La key del stock
-- ARGV[1]: Stock inicial desde DB

local stock_key = KEYS[1]
local initial_stock = tonumber(ARGV[1])

-- Solo setear si no existe (para no sobrescribir reservas en progreso)
local exists = redis.call('EXISTS', stock_key)

if exists == 0 then
    redis.call('SET', stock_key, initial_stock)
    redis.call('EXPIRE', stock_key, 3600)
    return 1  -- Warmup exitoso
else
    return 0  -- Ya existía, no se sobrescribe
end
"""


# =====================================================
# SCRIPT 4: CHECK_STOCK (Solo lectura)
# Ver stock disponible sin reservar
# =====================================================

CHECK_STOCK_SCRIPT = """
-- KEYS[1]: La key del stock

local stock_key = KEYS[1]
local current_stock = redis.call('GET', stock_key)

if current_stock == nil then
    return -1  -- Cache Miss
else
    return tonumber(current_stock)
end
"""


# =====================================================
# SCRIPT 5: MULTI_RESERVE
# Reservar múltiples variantes en una transacción atómica
# Útil para ventas con varios items
# =====================================================

MULTI_RESERVE_SCRIPT = """
-- KEYS: Array de stock keys
-- ARGV: Array de cantidades (mismo orden que KEYS)

local num_items = #KEYS

-- 1. Primero verificar que TODO tenga stock suficiente
for i = 1, num_items do
    local stock_key = KEYS[i]
    local qty_required = tonumber(ARGV[i])
    local current_stock = tonumber(redis.call('GET', stock_key))
    
    if current_stock == nil then
        return -2  -- Cache Miss en el item i
    end
    
    if current_stock < qty_required then
        return -1  -- Stock insuficiente en el item i
    end
end

-- 2. Si llegamos acá, TODO está OK. Descontar TODO
for i = 1, num_items do
    local stock_key = KEYS[i]
    local qty_required = tonumber(ARGV[i])
    redis.call('DECRBY', stock_key, qty_required)
    redis.call('EXPIRE', stock_key, 3600)
end

return 1  -- Éxito total
"""


# =====================================================
# HELPER: Stock Key Generator
# =====================================================

def generate_stock_key(tienda_id: str, variant_id: str, location_id: str) -> str:
    """
    Genera la key de Redis para el stock de una variante en una ubicación
    
    Formato: stock:{tienda_id}:{variant_id}:{location_id}
    """
    return f"stock:{tienda_id}:{variant_id}:{location_id}"


def generate_reservation_key(transaction_id: str) -> str:
    """
    Genera la key de Redis para una reserva temporal
    
    Formato: reservation:{transaction_id}
    
    Se usa para guardar la reserva por 10 minutos mientras se procesa el pago
    """
    return f"reservation:{transaction_id}"


# =====================================================
# EJEMPLO DE USO
# =====================================================

"""
import redis
from core.redis_scripts import RESERVE_STOCK_SCRIPT, generate_stock_key

# Conexión a Redis
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Generar la key
stock_key = generate_stock_key(
    tienda_id="123e4567-e89b-12d3-a456-426614174000",
    variant_id="456e7890-e12b-34d5-a678-426614174111",
    location_id="789e0123-e45b-67d8-a901-426614174222"
)

# Ejecutar el script
result = r.eval(RESERVE_STOCK_SCRIPT, 1, stock_key, 2)

if result == 1:
    print("✅ Stock reservado exitosamente")
elif result == -1:
    print("❌ Stock insuficiente")
elif result == -2:
    print("⚠️ Cache miss - Cargar desde DB y reintentar")
"""
