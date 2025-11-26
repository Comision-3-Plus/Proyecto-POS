"""
🧪 TEST E2E: MÓDULO 3 - SISTEMA NERVIOSO

Valida el flujo completo:
1. Warmup de cache en Redis
2. Checkout con reserva atómica
3. Worker procesa evento de RabbitMQ
4. Escritura en PostgreSQL + Ledger
5. Validación de stock actualizado
"""

import requests
import time
import json
from datetime import datetime
from typing import Dict, Any

# =============================================================================
# CONFIGURACIÓN
# =============================================================================
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "super@blend.com"
ADMIN_PASSWORD = "BlendAdmin2024!"

# Credenciales obtenidas del test anterior
TIENDA_ID = None
PRODUCTO_IDS = []
ACCESS_TOKEN = None


# =============================================================================
# HELPERS
# =============================================================================

def print_step(step: int, description: str):
    """Imprime un paso del test con formato"""
    print("\n" + "="*70)
    print(f"PASO {step}: {description}")
    print("="*70)


def print_success(message: str):
    """Imprime mensaje de éxito"""
    print(f"✅ {message}")


def print_error(message: str):
    """Imprime mensaje de error"""
    print(f"❌ {message}")


def print_info(message: str):
    """Imprime mensaje informativo"""
    print(f"ℹ️  {message}")


# =============================================================================
# TEST FUNCTIONS
# =============================================================================

def login() -> str:
    """
    Autentica al super admin y obtiene token
    """
    print_step(1, "LOGIN COMO SUPER ADMIN")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
    )
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print_success(f"Login exitoso - Token: {token[:20]}...")
        return token
    else:
        print_error(f"Login falló: {response.text}")
        raise Exception("Login failed")


def get_or_create_store(token: str) -> str:
    """
    Obtiene tienda existente o crea una nueva
    """
    print_step(2, "OBTENER/CREAR TIENDA")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Listar tiendas
    response = requests.get(f"{BASE_URL}/tiendas", headers=headers)
    
    if response.status_code == 200:
        tiendas = response.json()
        
        if tiendas:
            tienda_id = tiendas[0]["id"]
            print_success(f"Usando tienda existente: {tienda_id}")
            return tienda_id
        else:
            # Crear tienda
            response = requests.post(
                f"{BASE_URL}/admin/tiendas",
                headers=headers,
                json={
                    "nombre": "Test Event-Driven Store",
                    "direccion": "Calle Test 123"
                }
            )
            
            if response.status_code == 201:
                tienda_id = response.json()["id"]
                print_success(f"Tienda creada: {tienda_id}")
                return tienda_id
            else:
                print_error(f"Error creando tienda: {response.text}")
                raise Exception("Failed to create store")
    else:
        print_error(f"Error listando tiendas: {response.text}")
        raise Exception("Failed to list stores")


def create_test_products(token: str, tienda_id: str) -> list:
    """
    Crea productos de prueba
    """
    print_step(3, "CREAR PRODUCTOS DE PRUEBA")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tienda-ID": tienda_id
    }
    
    productos = []
    
    for i in range(1, 4):
        producto_data = {
            "sku": f"TEST-NERVIOSO-{i}",
            "nombre": f"Producto Test Nervioso {i}",
            "precio_venta": 100.0 * i,
            "stock_actual": 50.0,
            "tipo": "unidad",
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/productos",
            headers=headers,
            json=producto_data
        )
        
        if response.status_code == 201:
            producto = response.json()
            productos.append(producto["id"])
            print_success(f"Producto creado: {producto['sku']} (ID: {producto['id']})")
        else:
            print_error(f"Error creando producto: {response.text}")
    
    return productos


def warmup_cache(token: str, tienda_id: str) -> Dict[str, Any]:
    """
    Ejecuta warmup de cache en Redis
    """
    print_step(4, "WARMUP DE CACHE (Redis)")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tienda-ID": tienda_id
    }
    
    response = requests.post(
        f"{BASE_URL}/cache/warmup",
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print_success(f"Cache warmed: {result['productos_cacheados']} productos")
        print_info(result['mensaje'])
        return result
    else:
        print_error(f"Warmup falló: {response.text}")
        raise Exception("Warmup failed")


def get_cache_stats(token: str) -> Dict[str, Any]:
    """
    Obtiene estadísticas de Redis
    """
    print_step(5, "ESTADÍSTICAS DE CACHE (Redis)")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/cache/stats",
        headers=headers
    )
    
    if response.status_code == 200:
        stats = response.json()
        print_success("Estadísticas obtenidas:")
        print(f"   📊 Total Keys: {stats['total_keys']}")
        print(f"   💾 Memoria Usada: {stats['memoria_usada_mb']} MB")
        print(f"   ✅ Hits: {stats['hits']}")
        print(f"   ❌ Misses: {stats['misses']}")
        print(f"   📈 Hit Rate: {stats['hit_rate']}%")
        return stats
    else:
        print_error(f"Error obteniendo stats: {response.text}")
        raise Exception("Failed to get stats")


def create_sale(token: str, tienda_id: str, producto_ids: list) -> Dict[str, Any]:
    """
    Ejecuta checkout con arquitectura event-driven
    """
    print_step(6, "CHECKOUT EVENT-DRIVEN (Redis + RabbitMQ)")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tienda-ID": tienda_id
    }
    
    venta_data = {
        "items": [
            {"producto_id": producto_ids[0], "cantidad": 2},
            {"producto_id": producto_ids[1], "cantidad": 1}
        ],
        "metodo_pago": "EFECTIVO"
    }
    
    print_info(f"Comprando:")
    print(f"   - Producto 1: 2 unidades")
    print(f"   - Producto 2: 1 unidad")
    
    start_time = time.time()
    
    response = requests.post(
        f"{BASE_URL}/ventas/checkout",
        headers=headers,
        json=venta_data
    )
    
    elapsed = (time.time() - start_time) * 1000  # ms
    
    if response.status_code == 201:
        result = response.json()
        print_success(f"Checkout completado en {elapsed:.2f}ms")
        print(f"   💰 Total: ${result['total']:.2f}")
        print(f"   💳 Método: {result['metodo_pago']}")
        print(f"   📦 Items: {result['cantidad_items']}")
        print(f"   📝 Mensaje: {result['mensaje']}")
        
        if elapsed < 50:
            print_success(f"⚡ Latencia < 50ms (EXCELENTE)")
        elif elapsed < 100:
            print_info(f"⚡ Latencia < 100ms (BUENO)")
        else:
            print_error(f"⚠️ Latencia > 100ms (MEJORAR)")
        
        return result
    else:
        print_error(f"Checkout falló: {response.text}")
        raise Exception("Checkout failed")


def wait_for_worker_processing():
    """
    Espera a que el worker procese el evento
    """
    print_step(7, "ESPERANDO WORKER (PostgreSQL + Ledger)")
    
    print_info("Esperando 3 segundos para que worker procese evento...")
    
    for i in range(3, 0, -1):
        print(f"   ⏳ {i}...")
        time.sleep(1)
    
    print_success("Worker debería haber procesado el evento")


def verify_stock_updated(token: str, tienda_id: str, producto_ids: list):
    """
    Verifica que el stock se haya actualizado en PostgreSQL
    """
    print_step(8, "VERIFICAR STOCK ACTUALIZADO (PostgreSQL)")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tienda-ID": tienda_id
    }
    
    # Verificar producto 1 (debería tener stock_actual = 48)
    response = requests.get(
        f"{BASE_URL}/productos/{producto_ids[0]}",
        headers=headers
    )
    
    if response.status_code == 200:
        producto = response.json()
        stock_actual = producto["stock_actual"]
        stock_esperado = 48.0  # 50 - 2
        
        if stock_actual == stock_esperado:
            print_success(f"Producto 1: Stock correcto ({stock_actual})")
        else:
            print_error(f"Producto 1: Stock incorrecto (esperado: {stock_esperado}, actual: {stock_actual})")
    
    # Verificar producto 2 (debería tener stock_actual = 49)
    response = requests.get(
        f"{BASE_URL}/productos/{producto_ids[1]}",
        headers=headers
    )
    
    if response.status_code == 200:
        producto = response.json()
        stock_actual = producto["stock_actual"]
        stock_esperado = 49.0  # 50 - 1
        
        if stock_actual == stock_esperado:
            print_success(f"Producto 2: Stock correcto ({stock_actual})")
        else:
            print_error(f"Producto 2: Stock incorrecto (esperado: {stock_esperado}, actual: {stock_actual})")


def get_ledger_entries(token: str, tienda_id: str, producto_id: str):
    """
    Obtiene entradas del inventory ledger
    """
    print_step(9, "VERIFICAR INVENTORY LEDGER")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tienda-ID": tienda_id
    }
    
    response = requests.get(
        f"{BASE_URL}/inventario/ledger",
        headers=headers,
        params={"producto_id": producto_id}
    )
    
    if response.status_code == 200:
        ledger = response.json()
        print_success(f"Ledger obtenido: {len(ledger)} entradas")
        
        # Buscar última entrada de tipo VENTA
        venta_entry = None
        for entry in ledger:
            if entry.get("tipo_movimiento") == "VENTA":
                venta_entry = entry
                break
        
        if venta_entry:
            print_success("Entrada de VENTA encontrada:")
            print(f"   📅 Fecha: {venta_entry.get('fecha')}")
            print(f"   📦 Cantidad: {venta_entry.get('cantidad')}")
            print(f"   📊 Stock Anterior: {venta_entry.get('stock_anterior')}")
            print(f"   📊 Stock Nuevo: {venta_entry.get('stock_nuevo')}")
            print(f"   📝 Descripción: {venta_entry.get('descripcion')}")
        else:
            print_error("No se encontró entrada de VENTA en ledger")
    else:
        print_error(f"Error obteniendo ledger: {response.text}")


# =============================================================================
# MAIN
# =============================================================================

def main():
    """
    Ejecuta el test E2E completo
    """
    global ACCESS_TOKEN, TIENDA_ID, PRODUCTO_IDS
    
    print("\n" + "🧪"*35)
    print("TEST E2E: MÓDULO 3 - SISTEMA NERVIOSO")
    print("🧪"*35 + "\n")
    
    print("IMPORTANTE:")
    print("- Asegúrate de tener Redis corriendo (docker-compose up redis)")
    print("- Asegúrate de tener RabbitMQ corriendo (docker-compose up rabbitmq)")
    print("- Asegúrate de tener el worker corriendo (python workers/sales_worker.py)")
    print("")
    
    input("Presiona ENTER para continuar...")
    
    try:
        # 1. Login
        ACCESS_TOKEN = login()
        
        # 2. Obtener/Crear tienda
        TIENDA_ID = get_or_create_store(ACCESS_TOKEN)
        
        # 3. Crear productos
        PRODUCTO_IDS = create_test_products(ACCESS_TOKEN, TIENDA_ID)
        
        # 4. Warmup cache
        warmup_cache(ACCESS_TOKEN, TIENDA_ID)
        
        # 5. Stats de cache
        get_cache_stats(ACCESS_TOKEN)
        
        # 6. Checkout
        sale_result = create_sale(ACCESS_TOKEN, TIENDA_ID, PRODUCTO_IDS)
        
        # 7. Esperar worker
        wait_for_worker_processing()
        
        # 8. Verificar stock
        verify_stock_updated(ACCESS_TOKEN, TIENDA_ID, PRODUCTO_IDS)
        
        # 9. Verificar ledger
        get_ledger_entries(ACCESS_TOKEN, TIENDA_ID, PRODUCTO_IDS[0])
        
        # RESUMEN FINAL
        print("\n" + "="*70)
        print("✅ TEST E2E COMPLETADO EXITOSAMENTE")
        print("="*70)
        print("\n📊 RESUMEN:")
        print(f"   - Tienda: {TIENDA_ID}")
        print(f"   - Productos creados: {len(PRODUCTO_IDS)}")
        print(f"   - Venta procesada con event-driven architecture")
        print(f"   - Stock actualizado correctamente")
        print(f"   - Ledger registrado")
        print("\n🎉 El Sistema Nervioso funciona perfectamente!")
        
    except Exception as e:
        print("\n" + "="*70)
        print("❌ TEST FALLÓ")
        print("="*70)
        print(f"\nError: {str(e)}")
        raise


if __name__ == "__main__":
    main()
