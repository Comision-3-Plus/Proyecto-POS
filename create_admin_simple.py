#!/usr/bin/env python3
"""Script simple para crear usuario admin"""
import requests
import json

# Intentar crear usuario vía endpoint de registro
url = "http://localhost:8001/api/v1/auth/register"
params = {
    "email": "admin@nexuspos.com",
    "password": "admin123",
    "nombre": "Admin",
    "apellido": "System",
    "tienda_nombre": "Demo Store"
}

try:
    response = requests.post(url, params=params)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code in [200, 201]:
        print("\n✅ Usuario creado exitosamente!")
        print("Credenciales:")
        print("  Email: admin@nexuspos.com")
        print("  Password: admin123")
    else:
        print(f"\n❌ Error: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
