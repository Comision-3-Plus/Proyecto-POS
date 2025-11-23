"""
Test simple de autenticación y productos
"""
import requests

# Login
login_response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "pedrito@verduleria.com", "password": "pedrito123"}
)

print(f"Login status: {login_response.status_code}")
print(f"Response: {login_response.json()}")

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print(f"\nToken: {token[:50]}...")
    
    # Test /auth/me
    me_response = requests.get(
        "http://localhost:8000/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"\n/auth/me status: {me_response.status_code}")
    print(f"Response: {me_response.json()}")
    
    # Test /productos
    productos_response = requests.get(
        "http://localhost:8000/api/v1/productos",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"\n/productos status: {productos_response.status_code}")
    print(f"Response: {productos_response.json() if productos_response.status_code == 200 else productos_response.text}")
