"""
Script para crear un producto de prueba con variantes y stock
"""
import requests
import json

# Configuración
API_URL = "http://localhost:8001/api/v1"

# Credenciales
EMAIL = "admin@nexuspos.com"
PASSWORD = "admin123"

def main():
    print("=" * 80)
    print("CREANDO PRODUCTO DE PRUEBA CON STOCK")
    print("=" * 80)
    
    # 1. Login
    print("\n1️⃣ Iniciando sesión...")
    login_response = requests.post(
        f"{API_URL}/auth/login",
        json={"email": EMAIL, "password": PASSWORD}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Error en login: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login exitoso")
    
    # 2. Obtener lista de locations
    print("\n2️⃣ Obteniendo locations...")
    locations_response = requests.get(f"{API_URL}/productos/locations", headers=headers)
    
    if locations_response.status_code != 200:
        print(f"❌ Error obteniendo locations: {locations_response.status_code}")
        print(locations_response.text)
        return
    
    locations = locations_response.json()
    if not locations:
        print("❌ No hay locations configuradas")
        return
    
    location_id = locations[0]["location_id"]
    print(f"✅ Location encontrada: {locations[0]['name']} ({location_id})")
    
    # 3. Crear producto con variantes
    print("\n3️⃣ Creando producto...")
    
    producto_data = {
        "name": "Remera Básica Test",
        "base_sku": "REMERA-TEST",
        "description": "Remera básica para prueba",
        "category": "Indumentaria",
        "variants": [
            {
                "size_id": 3,  # M
                "color_id": 1,  # Negro
                "price": 15000.00,
                "barcode": "7891234567890",
                "initial_stock": 50,
                "location_id": location_id
            },
            {
                "size_id": 4,  # L
                "color_id": 1,  # Negro
                "price": 15000.00,
                "barcode": "7891234567891",
                "initial_stock": 30,
                "location_id": location_id
            },
            {
                "size_id": 3,  # M
                "color_id": 2,  # Blanco
                "price": 15000.00,
                "barcode": "7891234567892",
                "initial_stock": 40,
                "location_id": location_id
            }
        ]
    }
    
    create_response = requests.post(
        f"{API_URL}/productos",
        headers=headers,
        json=producto_data
    )
    
    if create_response.status_code != 201:
        print(f"❌ Error creando producto: {create_response.status_code}")
        print(create_response.text)
        return
    
    producto = create_response.json()
    print(f"✅ Producto creado exitosamente!")
    print(f"   ID: {producto['product_id']}")
    print(f"   Nombre: {producto['name']}")
    print(f"   Variantes creadas: {len(producto['variants'])}")
    
    # 4. Verificar stock
    print("\n4️⃣ Verificando stock de variantes...")
    for variant in producto['variants']:
        variant_id = variant['variant_id']
        stock_response = requests.get(
            f"{API_URL}/productos/variants/{variant_id}/stock",
            headers=headers
        )
        
        if stock_response.status_code == 200:
            stock_data = stock_response.json()
            print(f"   ✅ {variant['sku']} - Stock: {stock_data.get('total_stock', 0)}")
        else:
            print(f"   ⚠️  Error verificando stock de {variant['sku']}")
    
    print("\n" + "=" * 80)
    print("✅ PRODUCTO DE PRUEBA CREADO EXITOSAMENTE")
    print("=" * 80)
    print("\nAhora recarga la página de productos en el frontend para ver el resultado.")

if __name__ == "__main__":
    main()
