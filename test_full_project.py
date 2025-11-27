"""
Test Script - Verificación del Proyecto Nexus POS
Prueba imports, dependencias y conexiones
"""
import sys
import os

# Agregar core-api al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'core-api'))

print("🧪 NEXUS POS - TEST SUITE")
print("=" * 50)

# =========================================
# 1. TEST DE IMPORTS
# =========================================
print("\n✅ 1. Testing imports...")

try:
    # Core models
    print("  - Testing core models...", end=" ")
    from models import Product, ProductVariant, Venta
    print("✓")
    
    # OMS models
    print("  - Testing OMS models...", end=" ")
    from schemas_models.oms_models import OrdenOmnicanal, LocationCapability
    print("✓")
    
    # Promo models
    print("  - Testing Promo models...", end=" ")
    from schemas_models.promo_models import Promocion, TipoPromo
    print("✓")
    
    # Loyalty models
    print("  - Testing Loyalty models...", end=" ")
    from schemas_models.loyalty_models import CustomerWallet, GiftCard
    print("✓")
    
    # RFID models
    print("  - Testing RFID models...", end=" ")
    from schemas_models.rfid_models import RFIDTag, RFIDScanSession
    print("✓")
    
    # E-commerce models
    print("  - Testing E-commerce models...", end=" ")
    from schemas_models.ecommerce_models import IntegracionEcommerce, APIKey
    print("✓")
    
    # Services
    print("  - Testing services...", end=" ")
    from services.oms_service import SmartRoutingService
    from services.promo_service import PromotionEngine
    from services.loyalty_service import LoyaltyService
    from services.rfid_service import RFIDService
    from services.integration_service import IntegrationService
    print("✓")
    
    # Connectors
    print("  - Testing connectors...", end=" ")
    from core.integrations.base_connector import BaseEcommerceConnector
    from core.integrations.shopify_connector import ShopifyConnector
    from core.integrations.woocommerce_connector import WooCommerceConnector
    print("✓")
    
    print("\n✅ All imports successful!")

except ImportError as e:
    print(f"\n❌ Import error: {e}")
    sys.exit(1)

# =========================================
# 2. TEST DE DEPENDENCIAS
# =========================================
print("\n✅ 2. Testing dependencies...")

dependencies = {
    "fastapi": "FastAPI framework",
    "sqlmodel": "SQLModel ORM",
    "asyncpg": "PostgreSQL async driver",
    "redis": "Redis client",
    "httpx": "HTTP client",
    "cryptography": "Encryption library",
    "pydantic": "Data validation"
}

missing = []
for package, description in dependencies.items():
    try:
        __import__(package)
        print(f"  ✓ {package} ({description})")
    except ImportError:
        print(f"  ✗ {package} ({description}) - MISSING")
        missing.append(package)

if missing:
    print(f"\n⚠️  Missing packages: {', '.join(missing)}")
    print(f"   Run: pip install {' '.join(missing)}")
else:
    print("\n✅ All dependencies installed!")

# =========================================
# 3. TEST DE CONFIGURACIÓN
# =========================================
print("\n✅ 3. Testing configuration...")

from dotenv import load_dotenv
load_dotenv()

required_env = [
    "DATABASE_URL",
    "SECRET_KEY",
    "ALGORITHM"
]

for var in required_env:
    value = os.getenv(var)
    if value:
        print(f"  ✓ {var} configured")
    else:
        print(f"  ✗ {var} NOT SET")

# =========================================
# 4. TEST DE CONEXIÓN A SUPABASE
# =========================================
print("\n✅ 4. Testing Supabase connection...")

try:
    import asyncio
    import asyncpg
    
    async def test_connection():
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("  ✗ DATABASE_URL not set")
            return False
        
        # Agregar statement_cache_size=0 para pooler de Supabase
        try:
            conn = await asyncpg.connect(
                database_url,
                statement_cache_size=0
            )
            version = await conn.fetchval('SELECT version()')
            await conn.close()
            print(f"  ✓ Connected to: {version[:50]}...")
            return True
        except Exception as e:
            print(f"  ✗ Connection failed: {e}")
            return False
    
    connected = asyncio.run(test_connection())
    
except Exception as e:
    print(f"  ✗ Test failed: {e}")
    connected = False

# =========================================
# RESUMEN
# =========================================
print("\n" + "=" * 50)
print("📊 TEST SUMMARY")
print("=" * 50)

if missing:
    print("⚠️  Status: INCOMPLETE - Missing dependencies")
    print(f"   Install: pip install {' '.join(missing)}")
elif not connected:
    print("⚠️  Status: READY - Database connection failed")
    print("   Check DATABASE_URL in .env")
else:
    print("✅ Status: READY TO RUN")
    print("   All systems operational!")

print("\n🚀 To start server:")
print("   cd core-api")
print("   uvicorn main:app --reload --port 8001")
print("=" * 50)
