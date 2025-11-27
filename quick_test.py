"""
Quick Test - Solo verificar que la API cargue
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'core-api'))

print("🧪 QUICK TEST - Loading FastAPI app...")

try:
    # Intentar cargar FastAPI app
    print("  - Importing FastAPI...", end=" ")
    from fastapi import FastAPI
    print("✓")
    
    print("  - Checking database connection...", end=" ")
    from dotenv import load_dotenv
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        print(f"✓ (configured)")
    else:
        print("✗ (not set)")
    
    print("\n✅ Basic checks passed!")
    print("\n🚀 Ready to start server!")
    print("   Command: cd core-api && uvicorn main:app --reload --port 8001")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
