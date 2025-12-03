"""
Migración: Agregar índices de performance para búsquedas rápidas
Fecha: 2025-12-03
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'add_search_indexes'
down_revision = None  # Cambiar por la última migración
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Agregar índices de performance"""
    
    # ===== PRODUCTS =====
    # Índice para búsquedas por nombre
    op.create_index(
        'ix_products_name_search',
        'products',
        ['name'],
        postgresql_using='gin',
        postgresql_ops={'name': 'gin_trgm_ops'}
    )
    
    # Índice compuesto para base_sku activos
    op.create_index(
        'ix_products_base_sku_active',
        'products',
        ['base_sku', 'is_active']
    )
    
    # Índice para búsquedas por categoría en productos activos
    op.create_index(
        'ix_products_category_active',
        'products',
        ['category', 'is_active']
    )
    
    # ===== PRODUCT_VARIANTS =====
    # Índice para búsqueda por SKU (único + activo)
    op.create_index(
        'ix_variants_sku_active',
        'product_variants',
        ['sku', 'is_active'],
        unique=False
    )
    
    # Índice para búsqueda por código de barras
    op.create_index(
        'ix_variants_barcode',
        'product_variants',
        ['barcode'],
        unique=False,
        postgresql_where=sa.text('barcode IS NOT NULL')
    )
    
    # Índice compuesto para búsquedas de producto + activo
    op.create_index(
        'ix_variants_product_active',
        'product_variants',
        ['product_id', 'is_active']
    )
    
    # ===== INVENTORY_LEDGER =====
    # Índice compuesto para calcular stock por variante
    op.create_index(
        'ix_ledger_variant_location',
        'inventory_ledger',
        ['variant_id', 'location_id']
    )
    
    # Índice para búsquedas por fecha de transacción
    op.create_index(
        'ix_ledger_timestamp',
        'inventory_ledger',
        ['timestamp']
    )
    
    # Índice compuesto para reportes por tienda
    op.create_index(
        'ix_ledger_tienda_timestamp',
        'inventory_ledger',
        ['tienda_id', 'timestamp']
    )
    
    # ===== CLIENTES =====
    # Índice para búsqueda por nombre/apellido (texto completo)
    op.create_index(
        'ix_clientes_nombre_search',
        'clientes',
        ['nombre', 'apellido'],
        postgresql_using='gin',
        postgresql_ops={'nombre': 'gin_trgm_ops', 'apellido': 'gin_trgm_ops'}
    )
    
    # Índice para búsqueda por email
    op.create_index(
        'ix_clientes_email',
        'clientes',
        ['email'],
        unique=False
    )
    
    # Índice para documento (DNI/CUIT)
    op.create_index(
        'ix_clientes_documento',
        'clientes',
        ['documento_numero'],
        unique=False,
        postgresql_where=sa.text('documento_numero IS NOT NULL')
    )
    
    # ===== VENTAS =====
    # Índice compuesto para reportes por tienda y fecha
    op.create_index(
        'ix_ventas_tienda_fecha',
        'ventas',
        ['tienda_id', 'fecha', 'status_pago']
    )
    
    # Índice para búsquedas por cliente
    op.create_index(
        'ix_ventas_cliente',
        'ventas',
        ['cliente_id'],
        postgresql_where=sa.text('cliente_id IS NOT NULL')
    )


def downgrade() -> None:
    """Eliminar índices"""
    
    # Ventas
    op.drop_index('ix_ventas_cliente', table_name='ventas')
    op.drop_index('ix_ventas_tienda_fecha', table_name='ventas')
    
    # Clientes
    op.drop_index('ix_clientes_documento', table_name='clientes')
    op.drop_index('ix_clientes_email', table_name='clientes')
    op.drop_index('ix_clientes_nombre_search', table_name='clientes')
    
    # Inventory Ledger
    op.drop_index('ix_ledger_tienda_timestamp', table_name='inventory_ledger')
    op.drop_index('ix_ledger_timestamp', table_name='inventory_ledger')
    op.drop_index('ix_ledger_variant_location', table_name='inventory_ledger')
    
    # Product Variants
    op.drop_index('ix_variants_product_active', table_name='product_variants')
    op.drop_index('ix_variants_barcode', table_name='product_variants')
    op.drop_index('ix_variants_sku_active', table_name='product_variants')
    
    # Products
    op.drop_index('ix_products_category_active', table_name='products')
    op.drop_index('ix_products_base_sku_active', table_name='products')
    op.drop_index('ix_products_name_search', table_name='products')
