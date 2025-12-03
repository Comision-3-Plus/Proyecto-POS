"""retail_features_safe

Revision ID: 794d75ec6fed
Revises: 8ffa21c359ed
Create Date: 2025-12-02 13:20:15.116793

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '794d75ec6fed'
down_revision = '8ffa21c359ed'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Migración SAFE para retail - detecta existencia antes de operar
    """
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # ================================================================
    # FASE 1: ELIMINAR TABLAS INNECESARIAS
    # ================================================================
    tables_to_drop = [
        'rfid_inventory_discrepancies', 'rfid_scan_items', 'rfid_scan_sessions',
        'rfid_readers', 'rfid_tags', 'orden_items', 'ordenes_omnicanal',
        'location_capabilities', 'shipping_zones', 'wallet_transactions',
        'customer_wallets', 'gift_card_uso', 'gift_cards', 'loyalty_programs',
        'promocion_uso', 'promociones'
    ]
    
    for table_name in tables_to_drop:
        if table_name in inspector.get_table_names():
            op.execute(f'DROP TABLE {table_name} CASCADE')
    
    # ================================================================
    # FASE 2: DEPRECAR PRODUCTOS LEGACY
    # ================================================================
    if 'productos' in inspector.get_table_names() and 'productos_legacy' not in inspector.get_table_names():
        op.rename_table('productos', 'productos_legacy')
        
        # Agregar campos de migración
        columns_legacy = [c['name'] for c in inspector.get_columns('productos_legacy')]
        
        if 'is_migrated' not in columns_legacy:
            op.add_column('productos_legacy', 
                sa.Column('is_migrated', sa.Boolean, nullable=False, server_default='false')
            )
        
        if 'migrated_to_product_id' not in columns_legacy:
            op.add_column('productos_legacy', 
                sa.Column('migrated_to_product_id', postgresql.UUID, nullable=True)
            )
        
        if 'migration_notes' not in columns_legacy:
            op.add_column('productos_legacy', 
                sa.Column('migration_notes', sa.Text, nullable=True)
            )
        
        # Crear índice
        indexes = [idx['name'] for idx in inspector.get_indexes('productos_legacy')]
        if 'ix_productos_legacy_is_migrated' not in indexes:
            op.create_index('ix_productos_legacy_is_migrated', 'productos_legacy', ['is_migrated'])
    
    # ================================================================
    # FASE 3: ENRIQUECER TABLA PRODUCTS
    # ================================================================
    if 'products' in inspector.get_table_names():
        product_columns = [c['name'] for c in inspector.get_columns('products')]
        
        retail_fields = {
            'season': sa.String(50),
            'brand': sa.String(100),
            'material': sa.String(200),
            'care_instructions': sa.Text,
            'country_of_origin': sa.String(100),
            'images': postgresql.JSONB,
            'meta_title': sa.String(200),
            'meta_description': sa.Text,
            'tags': postgresql.JSONB
        }
        
        for field_name, field_type in retail_fields.items():
            if field_name not in product_columns:
                op.add_column('products', sa.Column(field_name, field_type, nullable=True))
    
    # ================================================================
    # FASE 4: MEJORAR SIZES Y COLORS
    # ================================================================
    if 'sizes' in inspector.get_table_names():
        size_columns = [c['name'] for c in inspector.get_columns('sizes')]
        if 'category' not in size_columns:
            op.add_column('sizes', sa.Column('category', sa.String(50), nullable=True))
    
    if 'colors' in inspector.get_table_names():
        color_columns = [c['name'] for c in inspector.get_columns('colors')]
        if 'sample_image_url' not in color_columns:
            op.add_column('colors', sa.Column('sample_image_url', sa.String(500), nullable=True))
    
    # ================================================================
    # FASE 5: CREAR TABLA PRODUCT_CATEGORIES
    # ================================================================
    if 'product_categories' not in inspector.get_table_names():
        op.create_table(
            'product_categories',
            sa.Column('id', postgresql.UUID, primary_key=True),
            sa.Column('tienda_id', postgresql.UUID, nullable=False),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('slug', sa.String(100), nullable=False),
            sa.Column('parent_id', postgresql.UUID, nullable=True),
            sa.Column('sort_order', sa.Integer, nullable=False, server_default='0'),
            sa.Column('description', sa.Text, nullable=True),
            sa.Column('image_url', sa.String(500), nullable=True),
            sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(['tienda_id'], ['tiendas.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['parent_id'], ['product_categories.id'], ondelete='SET NULL')
        )
        
        op.create_index('ix_product_categories_tienda_id', 'product_categories', ['tienda_id'])
        op.create_index('ix_product_categories_slug', 'product_categories', ['tienda_id', 'slug'], unique=True)
        op.create_index('ix_product_categories_parent_id', 'product_categories', ['parent_id'])
    
    # Agregar FK category_id a products
    if 'products' in inspector.get_table_names():
        product_columns = [c['name'] for c in inspector.get_columns('products')]
        if 'category_id' not in product_columns:
            op.add_column('products', sa.Column('category_id', postgresql.UUID, nullable=True))
            op.create_foreign_key(
                'fk_products_category_id',
                'products', 'product_categories',
                ['category_id'], ['id'],
                ondelete='SET NULL'
            )
            op.create_index('ix_products_category_id', 'products', ['category_id'])
    
    # ================================================================
    # FASE 6: CREAR TABLA WEBHOOKS
    # ================================================================
    if 'webhooks' not in inspector.get_table_names():
        op.create_table(
            'webhooks',
            sa.Column('id', postgresql.UUID, primary_key=True),
            sa.Column('tienda_id', postgresql.UUID, nullable=False),
            sa.Column('url', sa.String(500), nullable=False),
            sa.Column('events', postgresql.JSONB, nullable=False),
            sa.Column('secret', sa.String(100), nullable=False),
            sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
            sa.Column('last_triggered', sa.DateTime(timezone=True), nullable=True),
            sa.Column('trigger_count', sa.Integer, nullable=False, server_default='0'),
            sa.Column('last_error', sa.Text, nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(['tienda_id'], ['tiendas.id'], ondelete='CASCADE')
        )
        
        op.create_index('ix_webhooks_tienda_id', 'webhooks', ['tienda_id'])
        op.create_index('ix_webhooks_is_active', 'webhooks', ['is_active'])
    
    # ================================================================
    # FASE 7: SIMPLIFICAR CLIENTES
    # ================================================================
    if 'clientes' in inspector.get_table_names():
        cliente_columns = [c['name'] for c in inspector.get_columns('clientes')]
        columns_to_drop = ['direccion', 'ciudad', 'provincia', 'codigo_postal', 'fecha_nacimiento']
        
        for col in columns_to_drop:
            if col in cliente_columns:
                op.drop_column('clientes', col)


def downgrade() -> None:
    """
    Rollback de cambios
    """
    # Revertir simplificación de clientes
    op.add_column('clientes', sa.Column('direccion', sa.String, nullable=True))
    op.add_column('clientes', sa.Column('ciudad', sa.String(100), nullable=True))
    op.add_column('clientes', sa.Column('provincia', sa.String(100), nullable=True))
    op.add_column('clientes', sa.Column('codigo_postal', sa.String(20), nullable=True))
    op.add_column('clientes', sa.Column('fecha_nacimiento', sa.DateTime(timezone=True), nullable=True))
    
    # Eliminar tabla webhooks
    op.drop_table('webhooks')
    
    # Eliminar categorías
    op.drop_index('ix_products_category_id', 'products')
    op.drop_constraint('fk_products_category_id', 'products', type_='foreignkey')
    op.drop_column('products', 'category_id')
    op.drop_table('product_categories')
    
    # Revertir mejoras colors/sizes
    op.drop_column('colors', 'sample_image_url')
    op.drop_column('sizes', 'category')
    
    # Revertir mejoras products
    retail_fields = ['tags', 'meta_description', 'meta_title', 'images', 
                     'country_of_origin', 'care_instructions', 'material', 'brand', 'season']
    for field in retail_fields:
        op.drop_column('products', field)
    
    # Revertir productos legacy
    op.drop_index('ix_productos_legacy_is_migrated', 'productos_legacy')
    op.drop_column('productos_legacy', 'migration_notes')
    op.drop_column('productos_legacy', 'migrated_to_product_id')
    op.drop_column('productos_legacy', 'is_migrated')
    op.rename_table('productos_legacy', 'productos')

