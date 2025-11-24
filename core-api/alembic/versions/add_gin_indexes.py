"""add_gin_indexes_for_jsonb_queries

Revision ID: add_gin_indexes
Revises: 
Create Date: 2025-11-23 19:45:00

OPTIMIZACIÓN: Índices GIN (Generalized Inverted Index) para búsquedas JSONB
- Mejora búsquedas en campo 'atributos' de O(n) a O(log n)
- Permite queries como: WHERE atributos @> '{"color": "rojo"}'::jsonb
- Soporta operadores: @>, ?, ?&, ?|
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_gin_indexes'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Crea índices GIN en campos JSONB para búsquedas rápidas
    """
    # Índice GIN en 'atributos' de productos (búsqueda por propiedades)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_productos_atributos_gin 
        ON productos USING GIN (atributos jsonb_path_ops);
    """)
    
    # Índice compuesto para búsquedas por tipo + atributos
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_productos_tipo_atributos 
        ON productos(tipo, tienda_id) 
        WHERE is_active = true;
    """)
    
    # Índice para búsqueda por SKU (case-insensitive)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_productos_sku_lower 
        ON productos(LOWER(sku), tienda_id);
    """)
    
    # Índice para productos con stock bajo (para alertas)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_productos_stock_bajo 
        ON productos(tienda_id, stock_actual) 
        WHERE is_active = true AND tipo != 'servicio';
    """)
    
    print("✅ Índices GIN creados exitosamente")


def downgrade() -> None:
    """
    Elimina los índices GIN creados
    """
    op.execute("DROP INDEX IF EXISTS idx_productos_atributos_gin;")
    op.execute("DROP INDEX IF EXISTS idx_productos_tipo_atributos;")
    op.execute("DROP INDEX IF EXISTS idx_productos_sku_lower;")
    op.execute("DROP INDEX IF EXISTS idx_productos_stock_bajo;")
    
    print("⏪ Índices GIN eliminados")
