"""
Test del flujo completo: Login -> Obtener Productos
"""
import requests
import json

# Base URL del backend
BASE_URL = "http://localhost:8001/api/v1"

print("=" * 60)
print("TEST FLUJO COMPLETO: Login + Productos")
print("=" * 60)

# 1. Login
print("\n1. LOGIN")
print("-" * 60)
login_payload = {
    "email": "admin@nexuspos.com",
    "password": "admin123"
}

try:
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json=login_payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        access_token = login_data.get("access_token")
        user_data = login_data.get("user")
        
        print(f"✓ Login exitoso")
        print(f"  Token: {access_token[:50]}...")
        print(f"  Usuario: {user_data.get('full_name')}")
        print(f"  Email: {user_data.get('email')}")
        print(f"  Rol: {user_data.get('rol')}")
        print(f"  Tienda ID: {user_data.get('tienda_id')}")
        
        # 2. Obtener productos
        print("\n2. OBTENER PRODUCTOS")
        print("-" * 60)
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        productos_response = requests.get(
            f"{BASE_URL}/productos?limit=5",
            headers=headers
        )
        
        print(f"Status: {productos_response.status_code}")
        
        if productos_response.status_code == 200:
            productos = productos_response.json()
            print(f"✓ Productos obtenidos: {len(productos)} productos")
            
            if productos:
                print(f"\nPrimer producto:")
                primer = productos[0]
                print(f"  ID: {primer.get('product_id')}")
                print(f"  Nombre: {primer.get('name')}")
                print(f"  SKU: {primer.get('base_sku')}")
                print(f"  Categoría: {primer.get('category')}")
                print(f"  Variantes: {primer.get('variants_count')}")
                print(f"  Activo: {primer.get('is_active')}")
            else:
                print("  No hay productos en la base de datos")
        else:
            print(f"✗ Error al obtener productos")
            print(f"  Response: {productos_response.text}")
    else:
        print(f"✗ Error en login")
        print(f"  Response: {login_response.text}")
        
except Exception as e:
    print(f"✗ Excepción: {str(e)}")

print("\n" + "=" * 60)
print("FIN DEL TEST")
print("=" * 60)
