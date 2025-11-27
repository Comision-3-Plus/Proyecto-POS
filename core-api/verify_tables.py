"""
Script para verificar que todas las tablas se crearon correctamente en Supabase
"""
import asyncio
import asyncpg
from typing import List, Dict

async def verify_tables():
    """Verificar todas las tablas creadas en Supabase"""
    
    # URL de conexión directa (puerto 5432)
    direct_url = "postgresql://postgres.vnliytzpgsdkuhbcrrku:Blendsoft1!1@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
    
    print("🔍 VERIFICACIÓN DE TABLAS EN SUPABASE")
    print("=" * 80)
    
    try:
        conn = await asyncpg.connect(direct_url, ssl='require')
        
        # Obtener todas las tablas
        tables = await conn.fetch("""
            SELECT 
                tablename,
                schemaname
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """)
        
        print(f"\n✅ Total de tablas encontradas: {len(tables)}\n")
        
        # Tablas esperadas del sistema
        expected_tables = [
            'tiendas',
            'users',
            'clientes',
            'productos',
            'ventas',
            'detalles_venta',
            'insights',
            'sesiones_caja',
            'movimientos_caja',
            'proveedores',
            'ordenes_compra',
            'detalles_orden',
            'facturas',
            'sizes',
            'colors',
            'locations',
            'products',
            'product_variants',
            'inventory_ledger',
            'audit_logs',
            'permission_audits',
            'alembic_version'
        ]
        
        found_tables = [t['tablename'] for t in tables]
        
        # Verificar cada tabla esperada
        print("📋 VERIFICACIÓN DE TABLAS CORE:\n")
        missing_tables = []
        
        for table_name in expected_tables:
            if table_name in found_tables:
                # Contar registros
                count = await conn.fetchval(f'SELECT COUNT(*) FROM "{table_name}"')
                status = "✅"
                print(f"{status} {table_name:<25} ({count} registros)")
            else:
                missing_tables.append(table_name)
                print(f"❌ {table_name:<25} (NO ENCONTRADA)")
        
        # Tablas extras (no esperadas)
        extra_tables = [t for t in found_tables if t not in expected_tables]
        if extra_tables:
            print(f"\n📦 TABLAS ADICIONALES ({len(extra_tables)}):\n")
            for table_name in extra_tables:
                count = await conn.fetchval(f'SELECT COUNT(*) FROM "{table_name}"')
                print(f"   • {table_name:<25} ({count} registros)")
        
        # Verificar estructura de tablas clave
        print("\n" + "=" * 80)
        print("🔧 VERIFICACIÓN DE ESTRUCTURA DE TABLAS CLAVE:\n")
        
        key_tables = ['tiendas', 'products', 'product_variants', 'inventory_ledger']
        
        for table_name in key_tables:
            if table_name in found_tables:
                columns = await conn.fetch(f"""
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable
                    FROM information_schema.columns
                    WHERE table_name = '{table_name}'
                    AND table_schema = 'public'
                    ORDER BY ordinal_position;
                """)
                
                print(f"📄 {table_name.upper()}:")
                for col in columns:
                    nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                    print(f"   • {col['column_name']:<30} {col['data_type']:<20} {nullable}")
                print()
        
        # Verificar índices
        print("=" * 80)
        print("🗂️  VERIFICACIÓN DE ÍNDICES:\n")
        
        indexes = await conn.fetch("""
            SELECT 
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename IN ('products', 'product_variants', 'inventory_ledger', 'ventas')
            ORDER BY tablename, indexname;
        """)
        
        current_table = None
        for idx in indexes:
            if idx['tablename'] != current_table:
                current_table = idx['tablename']
                print(f"\n📊 {current_table.upper()}:")
            print(f"   • {idx['indexname']}")
        
        # Verificar foreign keys
        print("\n" + "=" * 80)
        print("🔗 VERIFICACIÓN DE FOREIGN KEYS:\n")
        
        fkeys = await conn.fetch("""
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.column_name;
        """)
        
        current_table = None
        for fk in fkeys:
            if fk['table_name'] != current_table:
                current_table = fk['table_name']
                print(f"\n🔗 {current_table.upper()}:")
            print(f"   • {fk['column_name']:<30} → {fk['foreign_table_name']}.{fk['foreign_column_name']}")
        
        # Resumen final
        print("\n" + "=" * 80)
        print("📊 RESUMEN FINAL:")
        print("=" * 80)
        print(f"✅ Tablas encontradas: {len(found_tables)}")
        print(f"✅ Tablas esperadas: {len(expected_tables)}")
        
        if missing_tables:
            print(f"❌ Tablas faltantes: {len(missing_tables)}")
            for table in missing_tables:
                print(f"   • {table}")
        else:
            print("✅ Todas las tablas core están presentes")
        
        if extra_tables:
            print(f"📦 Tablas adicionales: {len(extra_tables)}")
        
        print(f"🗂️  Índices totales: {len(indexes)}")
        print(f"🔗 Foreign keys: {len(fkeys)}")
        
        # Verificar versión de Alembic
        alembic_version = await conn.fetchval('SELECT version_num FROM alembic_version')
        print(f"📌 Versión de Alembic: {alembic_version}")
        
        print("\n" + "=" * 80)
        print("✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE!")
        print("=" * 80)
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante la verificación: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(verify_tables())
    exit(0 if result else 1)
