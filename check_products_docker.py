"""
Script para verificar productos en la base de datos de Docker
"""
import asyncio
import asyncpg
import os

async def check_products():
    # Conectar a la BD de Docker (puerto 5432)
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'postgres'),
        database=os.getenv('POSTGRES_DB', 'nexus_pos')
    )
    
    try:
        print("=" * 80)
        print("VERIFICANDO PRODUCTOS EN BASE DE DATOS DOCKER")
        print("=" * 80)
        
        # Contar productos
        count_products = await conn.fetchval("SELECT COUNT(*) FROM products")
        print(f"\n📦 Total productos: {count_products}")
        
        # Contar variantes
        count_variants = await conn.fetchval("SELECT COUNT(*) FROM product_variants")
        print(f"🏷️  Total variantes: {count_variants}")
        
        # Contar transacciones de inventario
        count_inventory = await conn.fetchval("SELECT COUNT(*) FROM inventory_ledger")
        print(f"📊 Total transacciones inventario: {count_inventory}")
        
        # Mostrar algunos productos con sus variantes y stock
        print("\n" + "=" * 80)
        print("PRODUCTOS CON VARIANTES Y STOCK")
        print("=" * 80)
        
        query = """
        SELECT 
            p.product_id,
            p.name,
            p.base_sku,
            pv.variant_id,
            pv.sku,
            pv.price,
            COALESCE(SUM(il.delta), 0) as stock_total
        FROM products p
        LEFT JOIN product_variants pv ON p.product_id = pv.product_id
        LEFT JOIN inventory_ledger il ON pv.variant_id = il.variant_id
        GROUP BY p.product_id, p.name, p.base_sku, pv.variant_id, pv.sku, pv.price
        ORDER BY p.created_at DESC
        LIMIT 10
        """
        
        rows = await conn.fetch(query)
        
        if not rows:
            print("\n⚠️  No se encontraron productos en la base de datos")
        else:
            for row in rows:
                print(f"\n📦 Producto: {row['name']}")
                print(f"   SKU Base: {row['base_sku']}")
                if row['variant_id']:
                    print(f"   └─ Variante: {row['sku']}")
                    print(f"      Precio: ${row['price']}")
                    print(f"      Stock: {row['stock_total']}")
                else:
                    print(f"   └─ ⚠️ Sin variantes")
        
        # Verificar si hay variantes sin stock
        print("\n" + "=" * 80)
        print("VARIANTES SIN STOCK REGISTRADO")
        print("=" * 80)
        
        query_sin_stock = """
        SELECT 
            p.name,
            pv.sku,
            pv.price
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        LEFT JOIN inventory_ledger il ON pv.variant_id = il.variant_id
        GROUP BY pv.variant_id, p.name, pv.sku, pv.price
        HAVING COALESCE(SUM(il.delta), 0) = 0
        LIMIT 10
        """
        
        rows_sin_stock = await conn.fetch(query_sin_stock)
        
        if rows_sin_stock:
            print(f"\n⚠️  {len(rows_sin_stock)} variantes sin stock:")
            for row in rows_sin_stock:
                print(f"   - {row['name']} ({row['sku']}) - ${row['price']}")
        else:
            print("\n✅ Todas las variantes tienen stock registrado")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_products())
