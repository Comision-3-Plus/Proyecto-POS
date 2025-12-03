"""cleanup_unnecessary_tables_for_retail_and_add_retail_features

Revision ID: d524704d8504
Revises: 8ffa21c359ed
Create Date: 2025-12-02 13:04:17.309982

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'd524704d8504'
down_revision = '8ffa21c359ed'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    FASE 1: LIMPIEZA
    Elimina tablas innecesarias para POS de ropa PyME
    
    FASE 2: MEJORAS RETAIL
    Agrega campos y tablas específicas para retail de ropa
    """
    
    # ================================================================
    # FASE 1: ELIMINAR TABLAS INNECESARIAS
    # ================================================================
    
    # Usar execute para DROP IF EXISTS (más seguro)
    tables_to_drop = [
        # 1. Tablas RFID (no necesario para PyME de ropa)
        'rfid_inventory_discrepancies',
        'rfid_scan_items',
        'rfid_scan_sessions',
        'rfid_readers',
        'rfid_tags',
        # 2. Tablas OMS (overkill para PyME)
        'orden_items',
        'ordenes_omnicanal',
        'location_capabilities',
        'shipping_zones',
        # 3. Tablas Loyalty avanzadas (simplificar a CRM básico)
        'wallet_transactions',
        'customer_wallets',
        'gift_card_uso',
        'gift_cards',
        'loyalty_programs',
        # 4. Tablas Promociones (fase 2, no crítico inicial)
        'promocion_uso',
        'promociones'
    ]
    
    for table_name in tables_to_drop:
        op.execute(f'DROP TABLE IF EXISTS {table_name} CASCADE')
    
    # ================================================================
    # FASE 2: DEPRECAR MODELO PRODUCTO LEGACY
    # ================================================================
    
    # Renombrar tabla productos a productos_legacy
    op.rename_table('productos', 'productos_legacy')
    
    # Agregar campos de migración
    op.add_column('productos_legacy', 
        sa.Column('is_migrated', sa.Boolean, nullable=False, server_default='false')
    )
    op.add_column('productos_legacy', 
        sa.Column('migrated_to_product_id', postgresql.UUID, nullable=True)
    )
    op.add_column('productos_legacy', 
        sa.Column('migration_notes', sa.Text, nullable=True)
    )
    
    # Crear índice para búsqueda de productos no migrados
    op.create_index('ix_productos_legacy_is_migrated', 'productos_legacy', ['is_migrated'])
    
    # ================================================================
    # FASE 3: MEJORAS PARA RETAIL DE ROPA
    # ================================================================
    
    # 3.1 Enriquecer tabla products
    op.add_column('products', 
        sa.Column('season', sa.String(50), nullable=True, comment='Temporada: Verano 2025, Invierno 2024')
    )
    op.add_column('products', 
        sa.Column('brand', sa.String(100), nullable=True, comment='Marca: Nike, Adidas, etc.')
    )
    op.add_column('products', 
        sa.Column('material', sa.String(200), nullable=True, comment='Material: Algodón 100%, Poliéster')
    )
    op.add_column('products', 
        sa.Column('care_instructions', sa.Text, nullable=True, comment='Instrucciones de cuidado')
    )
    op.add_column('products', 
        sa.Column('country_of_origin', sa.String(100), nullable=True, comment='País de origen')
    )
    op.add_column('products', 
        sa.Column('images', postgresql.JSONB, nullable=True, comment='Array de URLs de imágenes')
    )
    op.add_column('products', 
        sa.Column('meta_title', sa.String(200), nullable=True, comment='SEO - Título meta')
    )
    op.add_column('products', 
        sa.Column('meta_description', sa.Text, nullable=True, comment='SEO - Descripción meta')
    )
    op.add_column('products', 
        sa.Column('tags', postgresql.JSONB, nullable=True, comment='Tags para búsqueda: ["verano", "casual"]')
    )
    
    # 3.2 Mejorar tabla sizes
    op.add_column('sizes', 
        sa.Column('category', sa.String(50), nullable=True, comment='Categoría: numeric, alpha, shoe')
    )
    
    # 3.3 Mejorar tabla colors
    op.add_column('colors', 
        sa.Column('sample_image_url', sa.String(500), nullable=True, comment='URL de imagen de muestra del color')
    )
    
    # ================================================================
    # FASE 4: CREAR TABLA DE CATEGORÍAS
    # ================================================================
    
    op.create_table(
        'product_categories',
        sa.Column('id', postgresql.UUID, primary_key=True),
        sa.Column('tienda_id', postgresql.UUID, nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False, comment='Nombre: Remeras, Pantalones'),
        sa.Column('slug', sa.String(100), nullable=False, comment='URL-friendly: remeras, pantalones'),
        sa.Column('parent_id', postgresql.UUID, nullable=True, comment='Categoría padre (jerarquía)'),
        sa.Column('sort_order', sa.Integer, nullable=False, server_default='0', comment='Orden de visualización'),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tienda_id'], ['tiendas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['product_categories.id'], ondelete='SET NULL')
    )
    
    op.create_index('ix_product_categories_tienda_id', 'product_categories', ['tienda_id'])
    op.create_index('ix_product_categories_slug', 'product_categories', ['tienda_id', 'slug'], unique=True)
    op.create_index('ix_product_categories_parent_id', 'product_categories', ['parent_id'])
    
    # Agregar FK de category a products
    op.add_column('products',
        sa.Column('category_id', postgresql.UUID, nullable=True)
    )
    op.create_foreign_key(
        'fk_products_category_id',
        'products', 'product_categories',
        ['category_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_products_category_id', 'products', ['category_id'])
    
    # ================================================================
    # FASE 5: CREAR TABLA DE WEBHOOKS
    # ================================================================
    
    op.create_table(
        'webhooks',
        sa.Column('id', postgresql.UUID, primary_key=True),
        sa.Column('tienda_id', postgresql.UUID, nullable=False, index=True),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('events', postgresql.JSONB, nullable=False, comment='["product.created", "stock.changed"]'),
        sa.Column('secret', sa.String(100), nullable=False, comment='Secret para firmar requests'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('last_triggered', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trigger_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('last_error', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tienda_id'], ['tiendas.id'], ondelete='CASCADE')
    )
    
    op.create_index('ix_webhooks_tienda_id', 'webhooks', ['tienda_id'])
    op.create_index('ix_webhooks_is_active', 'webhooks', ['is_active'])
    
    # ================================================================
    # FASE 6: SIMPLIFICAR TABLA CLIENTES
    # ================================================================
    
    # Eliminar campos innecesarios de clientes (mantener solo lo esencial)
    # Usar ALTER TABLE DROP IF EXISTS para mayor seguridad
    columns_to_drop_from_clientes = [
        'direccion',
        'ciudad', 
        'provincia',
        'codigo_postal',
        'fecha_nacimiento'
    ]
    
    for column_name in columns_to_drop_from_clientes:
        op.execute(f'ALTER TABLE clientes DROP COLUMN IF EXISTS {column_name} CASCADE')


def downgrade() -> None:
    """
    Revertir cambios (para rollback de emergencia)
    """
    
    # Revertir FASE 6: Clientes
    op.add_column('clientes', sa.Column('direccion', sa.String, nullable=True))
    op.add_column('clientes', sa.Column('ciudad', sa.String(100), nullable=True))
    op.add_column('clientes', sa.Column('provincia', sa.String(100), nullable=True))
    op.add_column('clientes', sa.Column('codigo_postal', sa.String(20), nullable=True))
    op.add_column('clientes', sa.Column('fecha_nacimiento', sa.DateTime(timezone=True), nullable=True))
    
    # Revertir FASE 5: Webhooks
    op.drop_table('webhooks')
    
    # Revertir FASE 4: Categorías
    op.drop_index('ix_products_category_id', 'products')
    op.drop_constraint('fk_products_category_id', 'products', type_='foreignkey')
    op.drop_column('products', 'category_id')
    op.drop_table('product_categories')
    
    # Revertir FASE 3: Mejoras retail
    op.drop_column('colors', 'sample_image_url')
    op.drop_column('sizes', 'category')
    
    op.drop_column('products', 'tags')
    op.drop_column('products', 'meta_description')
    op.drop_column('products', 'meta_title')
    op.drop_column('products', 'images')
    op.drop_column('products', 'country_of_origin')
    op.drop_column('products', 'care_instructions')
    op.drop_column('products', 'material')
    op.drop_column('products', 'brand')
    op.drop_column('products', 'season')
    
    # Revertir FASE 2: Productos legacy
    op.drop_index('ix_productos_legacy_is_migrated', 'productos_legacy')
    op.drop_column('productos_legacy', 'migration_notes')
    op.drop_column('productos_legacy', 'migrated_to_product_id')
    op.drop_column('productos_legacy', 'is_migrated')
    op.rename_table('productos_legacy', 'productos')
    
    # Revertir FASE 1: Recrear tablas (muy complejo, mejor tener backup)
    # NO RECOMENDADO - Hacer backup antes de aplicar upgrade
    pass
