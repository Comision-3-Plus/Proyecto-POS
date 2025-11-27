import httpx
import asyncio

async def test_simple():
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        try:
            # Test health
            r = await client.get("http://localhost:8001/api/v1/health")
            print(f"Health: {r.status_code} - {r.text[:100]}")
            
            # Test register
            r = await client.post("http://localhost:8001/api/v1/auth/register", params={
                "email": "test@test.com",
                "password": "Test123!",
                "nombre": "Test",
                "apellido": "User",
                "tienda_nombre": "Test Store"
            })
            print(f"Register: {r.status_code}")
            print(f"Response: {r.text[:500]}")
            
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(test_simple())
