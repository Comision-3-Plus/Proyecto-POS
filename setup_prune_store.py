#!/usr/bin/env python3
"""
Script para crear la tienda PRUNE completa con productos
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8001/api/v1"

# 1. Login como super admin
print("=" * 80)
print("🔐 LOGIN COMO SUPER ADMIN")
print("=" * 80)

login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "admin@nexuspos.com", "password": "admin123"}
)

if login_response.status_code != 200:
    print(f"❌ Error en login: {login_response.json()}")
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"✅ Login exitoso! Token obtenido")

# 2. Crear tienda PRUNE con usuario dueño
print("\n" + "=" * 80)
print("🏪 CREANDO TIENDA PRUNE")
print("=" * 80)

onboarding_data = {
    "nombre_tienda": "Prune Argentina",
    "rubro": "indumentaria",
    "email": "admin@prune.com.ar",
    "password": "prune123",
    "nombre_completo": "María González",
    "rol": "owner"
}

onboarding_response = requests.post(
    f"{BASE_URL}/admin/onboarding",
    json=onboarding_data,
    headers=headers
)

if onboarding_response.status_code != 200:
    print(f"❌ Error creando tienda: {onboarding_response.json()}")
    exit(1)

prune_data = onboarding_response.json()
tienda_id = prune_data["tienda"]["id"]
print(f"✅ Tienda creada: {prune_data['tienda']['nombre']}")
print(f"   ID: {tienda_id}")
print(f"✅ Usuario creado: {prune_data['usuario']['email']}")

# 3. Login como usuario de Prune para crear productos
print("\n" + "=" * 80)
print("🔐 LOGIN COMO USUARIO PRUNE")
print("=" * 80)

prune_login = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "admin@prune.com.ar", "password": "prune123"}
)

if prune_login.status_code != 200:
    print(f"❌ Error en login Prune: {prune_login.json()}")
    exit(1)

prune_token = prune_login.json()["access_token"]
prune_headers = {"Authorization": f"Bearer {prune_token}"}
print(f"✅ Login exitoso como {prune_login.json()['user']['full_name']}")

# 4. Obtener colores y talles creados automáticamente
print("\n" + "=" * 80)
print("🎨 OBTENIENDO COLORES Y TALLES")
print("=" * 80)

# Obtener colores
colors_response = requests.get(f"{BASE_URL}/productos/colors", headers=prune_headers)
colors = colors_response.json() if colors_response.status_code == 200 else []
print(f"✅ Colores disponibles: {len(colors)}")
for c in colors:
    print(f"   - {c['name']} ({c['hex_code']})")

# Obtener talles
sizes_response = requests.get(f"{BASE_URL}/productos/sizes", headers=prune_headers)
sizes = sizes_response.json() if sizes_response.status_code == 200 else []
print(f"✅ Talles disponibles: {len(sizes)}")
for s in sizes:
    print(f"   - {s['name']}")

# 5. Obtener ubicación default
locations_response = requests.get(f"{BASE_URL}/inventario/locations", headers=prune_headers)
locations = locations_response.json() if locations_response.status_code == 200 else []
default_location = next((loc for loc in locations if loc.get('is_default')), locations[0] if locations else None)

if default_location:
    print(f"✅ Ubicación default: {default_location['name']}")
    location_id = default_location['location_id']
else:
    print("⚠️  No hay ubicación default, creando una...")
    # Crear ubicación si no existe
    location_data = {
        "name": "Local Prune Centro",
        "type": "STORE",
        "address": "Av. Santa Fe 1234, CABA",
        "is_default": True
    }
    location_response = requests.post(
        f"{BASE_URL}/inventario/locations",
        json=location_data,
        headers=prune_headers
    )
    if location_response.status_code in [200, 201]:
        location_id = location_response.json()["location_id"]
        print(f"✅ Ubicación creada: {location_id}")
    else:
        print(f"❌ Error creando ubicación: {location_response.json()}")
        exit(1)

# 6. Crear productos de Prune
print("\n" + "=" * 80)
print("👕 CREANDO PRODUCTOS PRUNE")
print("=" * 80)

productos = [
    {
        "name": "Remera Básica Oversize",
        "base_sku": "PRUNE-REM-001",
        "description": "Remera de algodón 100% oversize, estilo urbano",
        "category": "remeras",
        "price": 15990.0
    },
    {
        "name": "Pantalón Cargo Mujer",
        "base_sku": "PRUNE-PANT-001",
        "description": "Pantalón cargo con bolsillos laterales, fit relajado",
        "category": "pantalones",
        "price": 29990.0
    },
    {
        "name": "Buzo Hoodie Premium",
        "base_sku": "PRUNE-BUZO-001",
        "description": "Buzo con capucha, frisa premium 100% algodón",
        "category": "buzos",
        "price": 35990.0
    },
    {
        "name": "Vestido Midi Flores",
        "base_sku": "PRUNE-VEST-001",
        "description": "Vestido midi estampado floral, tela viscosa",
        "category": "vestidos",
        "price": 32990.0
    },
    {
        "name": "Campera Denim",
        "base_sku": "PRUNE-CAMP-001",
        "description": "Campera de jean clásica, fit regular",
        "category": "camperas",
        "price": 45990.0
    }
]

productos_creados = []

for producto_data in productos:
    print(f"\n📦 Creando: {producto_data['name']}...")
    
    # Crear producto padre
    product_response = requests.post(
        f"{BASE_URL}/productos",
        json=producto_data,
        headers=prune_headers
    )
    
    if product_response.status_code not in [200, 201]:
        print(f"   ❌ Error: {product_response.json()}")
        continue
    
    product = product_response.json()
    product_id = product["product_id"]
    print(f"   ✅ Producto creado: {product_id}")
    
    # Crear variantes (combinaciones de talle y color)
    variantes_creadas = 0
    for size in sizes[:3]:  # S, M, L
        for color in colors[:2]:  # Negro, Blanco
            variant_data = {
                "product_id": product_id,
                "sku": f"{producto_data['base_sku']}-{color['name'][:3].upper()}-{size['name']}",
                "size_id": size["id"],
                "color_id": color["id"],
                "price": producto_data["price"],
                "barcode": f"777{len(productos_creados):03d}{variantes_creadas:03d}",
                "is_active": True
            }
            
            variant_response = requests.post(
                f"{BASE_URL}/productos/variants",
                json=variant_data,
                headers=prune_headers
            )
            
            if variant_response.status_code in [200, 201]:
                variant = variant_response.json()
                variant_id = variant["variant_id"]
                
                # Agregar stock inicial
                stock_data = {
                    "variant_id": variant_id,
                    "location_id": location_id,
                    "delta": 25.0,  # 25 unidades por variante
                    "transaction_type": "INITIAL_STOCK",
                    "reference_doc": "INIT-PRUNE-001",
                    "notes": f"Stock inicial {producto_data['name']} - {color['name']} {size['name']}"
                }
                
                stock_response = requests.post(
                    f"{BASE_URL}/inventario/ledger",
                    json=stock_data,
                    headers=prune_headers
                )
                
                if stock_response.status_code in [200, 201]:
                    variantes_creadas += 1
                else:
                    print(f"      ⚠️  Error agregando stock: {stock_response.status_code}")
            else:
                print(f"      ⚠️  Error creando variante: {variant_response.status_code}")
    
    print(f"   ✅ {variantes_creadas} variantes creadas con stock")
    productos_creados.append(product)

# 7. Resumen final
print("\n" + "=" * 80)
print("📊 RESUMEN FINAL")
print("=" * 80)
print(f"✅ Tienda: Prune Argentina")
print(f"   ID: {tienda_id}")
print(f"   Rubro: Indumentaria")
print(f"\n✅ Usuario Dueño:")
print(f"   Email: admin@prune.com.ar")
print(f"   Password: prune123")
print(f"   Nombre: María González")
print(f"\n✅ Productos creados: {len(productos_creados)}")
for p in productos_creados:
    print(f"   - {p['name']} (${p['price']:,.0f})")
print(f"\n✅ Total variantes: {len(productos_creados) * 6} (3 talles × 2 colores)")
print(f"✅ Stock total: {len(productos_creados) * 6 * 25} unidades")
print(f"\n🎯 PRÓXIMOS PASOS:")
print(f"   1. Login en el frontend con: admin@prune.com.ar / prune123")
print(f"   2. Explorar productos creados")
print(f"   3. Realizar ventas de prueba")
print("=" * 80)
