"""
Debug de autenticación - Verificar token JWT
"""
import requests
import jose.jwt as jwt
import json

# 1. Login
login_resp = requests.post(
    "http://localhost:8001/api/v1/auth/login",
    json={"email": "admin@nexuspos.com", "password": "admin123"}
)

if login_resp.status_code != 200:
    print(f"❌ Login falló: {login_resp.status_code}")
    print(login_resp.text)
    exit(1)

token = login_resp.json()["access_token"]
print("✓ Login exitoso")
print(f"Token: {token[:50]}...")

# 2. Decodificar token (sin verificar firma para ver el payload)
try:
    decoded = jwt.decode(token, options={"verify_signature": False})
    print("\n📋 Payload del token:")
    print(json.dumps(decoded, indent=2))
except Exception as e:
    print(f"❌ Error decod ificando token: {e}")

# 3. Intentar acceder a /productos
headers = {"Authorization": f"Bearer {token}"}
prod_resp = requests.get("http://localhost:8001/api/v1/productos?limit=1", headers=headers)

print(f"\n🌐 Request a /productos:")
print(f"Status: {prod_resp.status_code}")
print(f"Response: {prod_resp.text[:500]}")

if prod_resp.status_code == 200:
    print("✓ Productos obtenidos correctamente")
    prods = prod_resp.json()
    if prods:
        print(f"\nPrimer producto: {prods[0]['name']}")
