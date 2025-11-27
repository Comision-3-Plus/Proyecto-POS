import asyncio
import asyncpg
import sys

async def test_supabase_connection():
    """Test connection to Supabase database"""
    
    # Connection strings
    pooler_url = "postgresql://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
    direct_url = "postgresql://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
    
    print("🔍 Testing Supabase Database Connection...\n")
    
    # Test 1: Transaction Pooler (Port 6543)
    print("📡 Test 1: Transaction Pooler (Port 6543)")
    print("-" * 50)
    try:
        # IMPORTANT: statement_cache_size=0 required for Supabase pooler
        conn = await asyncpg.connect(
            pooler_url, 
            ssl='require',
            statement_cache_size=0  # Required for PgBouncer transaction mode
        )
        version = await conn.fetchval('SELECT version();')
        current_db = await conn.fetchval('SELECT current_database();')
        current_user = await conn.fetchval('SELECT current_user;')
        
        print("✅ Connection successful!")
        print(f"   Database: {current_db}")
        print(f"   User: {current_user}")
        print(f"   PostgreSQL: {version.split(',')[0]}")
        
        # Test query
        tables = await conn.fetch("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            LIMIT 5;
        """)
        print(f"   Tables found: {len(tables)}")
        if tables:
            print(f"   Sample tables: {', '.join([t['tablename'] for t in tables[:3]])}")
        
        await conn.close()
        print()
    except Exception as e:
        print(f"❌ Connection failed: {e}\n")
        return False
    
    # Test 2: Direct Connection (Port 5432)
    print("📡 Test 2: Direct Connection (Port 5432)")
    print("-" * 50)
    try:
        conn = await asyncpg.connect(direct_url, ssl='require')
        version = await conn.fetchval('SELECT version();')
        
        print("✅ Connection successful!")
        print(f"   PostgreSQL: {version.split(',')[0]}")
        
        await conn.close()
        print()
    except Exception as e:
        print(f"❌ Connection failed: {e}\n")
        return False
    
    print("=" * 50)
    print("✅ ALL TESTS PASSED - Supabase is ready!")
    print("=" * 50)
    return True

if __name__ == "__main__":
    result = asyncio.run(test_supabase_connection())
    sys.exit(0 if result else 1)
