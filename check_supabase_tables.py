import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'core-api'))
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from core.config import settings

async def check_tables():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        """))
        tables = [row[0] for row in result]
        
        print(f"\n✓ Conectado a Supabase")
        print(f"\nTablas encontradas ({len(tables)}):")
        for table in tables:
            print(f"  - {table}")
        
        # Check specific tables
        key_tables = ['tiendas', 'usuarios', 'productos', 'inventario_ledger', 'ventas']
        missing = [t for t in key_tables if t not in tables]
        if missing:
            print(f"\n⚠ Tablas faltantes: {', '.join(missing)}")
        else:
            print(f"\n✓ Todas las tablas clave existen")
            
    await engine.dispose()

asyncio.run(check_tables())
