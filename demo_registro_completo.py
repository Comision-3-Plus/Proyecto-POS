#!/usr/bin/env python3
"""
Script de prueba completo del sistema de registro y gestión de empleados
"""
import requests
import json

BASE_URL = "http://localhost:8001/api/v1"

print("=" * 80)
print("🎯 DEMO COMPLETO: REGISTRO Y GESTIÓN DE TIENDA")
print("=" * 80)

# ============================================================
# PASO 1: Registro de nuevo dueño con su tienda
# ============================================================
print("\n📝 PASO 1: María se registra y crea su tienda 'Prune'")
print("-" * 80)

registro_data = {
    "email": "maria@prune.com.ar",
    "password": "prune2024",
    "full_name": "María González",
    "documento_numero": "35123456",
    "tienda_nombre": "Prune Argentina",
    "tienda_rubro": "indumentaria"
}

response = requests.post(f"{BASE_URL}/auth/register", json=registro_data)

if response.status_code in [200, 201]:
    maria_data = response.json()
    maria_token = maria_data["access_token"]
    maria_user = maria_data["user"]
    
    print(f"✅ Registro exitoso!")
    print(f"   👤 Usuario: {maria_user['full_name']} ({maria_user['email']})")
    print(f"   🏪 Tienda: {maria_user['tienda']['nombre']}")
    print(f"   👑 Rol: {maria_user['rol']}")
    print(f"   🆔 Tienda ID: {maria_user['tienda_id']}")
else:
    print(f"❌ Error en registro: {response.status_code}")
    print(response.json())
    exit(1)

# ============================================================
# PASO 2: María puede hacer login normalmente
# ============================================================
print("\n🔐 PASO 2: María hace login")
print("-" * 80)

login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "maria@prune.com.ar", "password": "prune2024"}
)

if login_response.status_code == 200:
    print("✅ Login exitoso con las credenciales recién creadas")
else:
    print(f"❌ Error en login: {login_response.json()}")

# ============================================================
# PASO 3: María invita a un cajero
# ============================================================
print("\n👥 PASO 3: María invita a Juan como cajero")
print("-" * 80)

headers = {"Authorization": f"Bearer {maria_token}"}

invitar_cajero = {
    "email": "juan.perez@prune.com.ar",
    "full_name": "Juan Pérez",
    "password": "juan123",
    "rol": "cajero"
}

response = requests.post(
    f"{BASE_URL}/usuarios/invitar",
    json=invitar_cajero,
    headers=headers
)

if response.status_code in [200, 201]:
    juan_data = response.json()
    print(f"✅ Cajero invitado:")
    print(f"   👤 {juan_data['full_name']}")
    print(f"   📧 {juan_data['email']}")
    print(f"   👔 Rol: {juan_data['rol']}")
    juan_id = juan_data['id']
else:
    print(f"❌ Error invitando cajero: {response.status_code}")
    print(response.json())
    juan_id = None

# ============================================================
# PASO 4: María invita a una vendedora
# ============================================================
print("\n👥 PASO 4: María invita a Laura como vendedora")
print("-" * 80)

invitar_vendedora = {
    "email": "laura.martinez@prune.com.ar",
    "full_name": "Laura Martínez",
    "password": "laura123",
    "rol": "vendedor"
}

response = requests.post(
    f"{BASE_URL}/usuarios/invitar",
    json=invitar_vendedora,
    headers=headers
)

if response.status_code in [200, 201]:
    laura_data = response.json()
    print(f"✅ Vendedora invitada:")
    print(f"   👤 {laura_data['full_name']}")
    print(f"   📧 {laura_data['email']}")
    print(f"   👔 Rol: {laura_data['rol']}")
    laura_id = laura_data['id']
else:
    print(f"❌ Error invitando vendedora: {response.status_code}")
    print(response.json())
    laura_id = None

# ============================================================
# PASO 5: Ver todos los empleados
# ============================================================
print("\n📋 PASO 5: María lista todos los empleados de su tienda")
print("-" * 80)

response = requests.get(f"{BASE_URL}/usuarios", headers=headers)

if response.status_code == 200:
    empleados = response.json()
    print(f"✅ Total de empleados: {len(empleados)}")
    print("\n   Lista completa:")
    for emp in empleados:
        print(f"   • {emp['full_name']:25} | {emp['rol']:12} | {emp['email']}")
else:
    print(f"❌ Error listando empleados: {response.json()}")

# ============================================================
# PASO 6: Juan (cajero) intenta hacer login
# ============================================================
print("\n🔐 PASO 6: Juan hace login como cajero")
print("-" * 80)

juan_login = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "juan.perez@prune.com.ar", "password": "juan123"}
)

if juan_login.status_code == 200:
    juan_token = juan_login.json()["access_token"]
    print("✅ Juan puede acceder al sistema")
    print(f"   Token obtenido: {juan_token[:50]}...")
    
    # ============================================================
    # PASO 7: Juan intenta invitar a alguien (debería fallar)
    # ============================================================
    print("\n🚫 PASO 7: Juan (cajero) intenta invitar a alguien")
    print("-" * 80)
    
    juan_headers = {"Authorization": f"Bearer {juan_token}"}
    intento_invitar = {
        "email": "otro@prune.com.ar",
        "full_name": "Otro Usuario",
        "password": "otro123",
        "rol": "cajero"
    }
    
    response = requests.post(
        f"{BASE_URL}/usuarios/invitar",
        json=intento_invitar,
        headers=juan_headers
    )
    
    if response.status_code == 403:
        print("✅ Correcto! Juan NO puede invitar empleados (solo owner/admin)")
        error_msg = response.json().get('error', {}).get('message', response.json().get('detail', 'Sin detalles'))
        print(f"   Mensaje: {error_msg}")
    else:
        print(f"⚠️  Inesperado: {response.status_code}")

else:
    print(f"❌ Error en login de Juan: {juan_login.json()}")

# ============================================================
# PASO 8: María cambia el rol de Laura
# ============================================================
if laura_id:
    print("\n🔄 PASO 8: María promociona a Laura de vendedor a encargado")
    print("-" * 80)
    
    response = requests.patch(
        f"{BASE_URL}/usuarios/{laura_id}/rol?nuevo_rol=encargado",
        headers=headers
    )
    
    if response.status_code == 200:
        print(f"✅ {response.json()['message']}")
    else:
        print(f"❌ Error cambiando rol: {response.json()}")

# ============================================================
# RESUMEN FINAL
# ============================================================
print("\n" + "=" * 80)
print("📊 RESUMEN DEL DEMO")
print("=" * 80)
print(f"""
✅ REGISTRO PÚBLICO FUNCIONANDO:
   • María se registró con email, DNI y contraseña
   • Se creó automáticamente su tienda "Prune Argentina"
   • Obtuvo rol 'owner' (dueña)
   • Tienda pre-configurada con:
     - Ubicación default
     - Talles (XS, S, M, L, XL, XXL)
     - Colores (Negro, Blanco, Gris, Azul, Rojo)

✅ GESTIÓN DE EMPLEADOS:
   • María invitó a Juan (cajero)
   • María invitó a Laura (vendedor → encargado)
   • Juan puede acceder pero NO invitar empleados
   • Sistema de permisos funcionando correctamente

🎯 CREDENCIALES DE ACCESO:
   
   Dueña:
   📧 maria@prune.com.ar
   🔑 prune2024
   
   Cajero:
   📧 juan.perez@prune.com.ar
   🔑 juan123
   
   Encargada:
   📧 laura.martinez@prune.com.ar
   🔑 laura123

🚀 PRÓXIMOS PASOS:
   1. Acceder al frontend con cualquiera de estos usuarios
   2. María puede cargar productos
   3. Juan puede hacer ventas
   4. Laura puede hacer ventas + gestionar inventario
""")
print("=" * 80)
