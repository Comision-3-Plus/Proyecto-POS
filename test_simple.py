"""
TEST SIMPLIFICADO - Solo endpoints existentes
"""
import httpx
import asyncio

BASE_URL = "http://localhost:8001/api/v1"

async def test_simple():
    print("🧪 TEST SIMPLIFICADO DE NEXUS POS")
    print("=" * 60)
    
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        
        # 1. Health Check
        print("\n1. Health Check...")
        try:
            r = await client.get(f"{BASE_URL}/health")
            if r.status_code == 200:
                print(f"   ✓ Servidor activo: {r.json()}")
            else:
                print(f"   ✗ Error: {r.status_code}")
                return
        except Exception as e:
            print(f"   ✗ No se pudo conectar: {e}")
            return
        
        # 2. Cache stats
        print("\n2. Cache Stats...")
        try:
            r = await client.get(f"{BASE_URL}/cache/stats")
            print(f"   Status: {r.status_code}")
            if r.status_code == 200:
                print(f"   ✓ Cache: {r.json()}")
        except Exception as e:
            print(f"   Info: {e}")
        
        # 3. Docs availability
        print("\n3. Documentation...")
        try:
            r = await client.get("http://localhost:8001/docs")
            if r.status_code == 200:
                print(f"   ✓ Swagger UI disponible en http://localhost:8001/docs")
            else:
                print(f"   Status: {r.status_code}")
        except Exception as e:
            print(f"   Info: {e}")
        
        print("\n" + "=" * 60)
        print("✅ SERVIDOR FUNCIONANDO CORRECTAMENTE")
        print("=" * 60)
        print("\n📋 ENDPOINTS DISPONIBLES:")
        print("   - GET  http://localhost:8001/docs - Documentación interactiva")
        print("   - GET  http://localhost:8001/api/v1/health - Health check")
        print("   - GET  http://localhost:8001/api/v1/cache/stats - Cache statistics")  
        print("\n💡 PRÓXIMOS PASOS:")
        print("   1. Crear tablas en Supabase con migraciones de Alembic")
        print("   2. Configurar usuario inicial")
        print("   3. Probartest completo")
        print()

asyncio.run(test_simple())
