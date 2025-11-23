"""add unidad_medida to producto

Revision ID: 8f3d4c2a1b9e
Revises: 849d2968c4fe
Create Date: 2025-11-20 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8f3d4c2a1b9e'
down_revision = '849d2968c4fe'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Agregar columna unidad_medida a productos
    op.add_column('productos', sa.Column('unidad_medida', sa.String(length=20), nullable=False, server_default='UNIDAD'))
    
    # Actualizar productos existentes según el rubro de la tienda
    # Las verdulerías y carnicerías usan KILO por defecto
    op.execute("""
        UPDATE productos p
        SET unidad_medida = 'KILO'
        FROM tiendas t
        WHERE p.tienda_id = t.id 
        AND t.rubro IN ('VERDULERIA', 'CARNICERIA', 'PANADERIA')
    """)


def downgrade() -> None:
    op.drop_column('productos', 'unidad_medida')
