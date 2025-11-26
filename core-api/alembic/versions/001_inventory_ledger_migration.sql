-- =====================================================
-- MÓDULO 1: MIGRACIÓN A INVENTORY LEDGER
-- =====================================================
-- Estrategia: SCORCHED EARTH 🔥
-- Fecha: 2025-11-26
-- Autor: Comisión 3 Plus
-- Descripción: Migración completa a sistema de ledger con variantes

-- =====================================================
-- 0. EXTENSIONES NECESARIAS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. LIMPIAR LA CASA (CUIDADO: ESTO BORRA TODO)
-- =====================================================
-- Solo ejecutar si realmente querés empezar de cero
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- Borrado selectivo de tablas legacy relacionadas con productos
DROP TABLE IF EXISTS detalles_venta CASCADE;
DROP TABLE IF EXISTS detalles_orden CASCADE;
DROP TABLE IF EXISTS inventory_ledger CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS productos CASCADE;  -- Tabla vieja
DROP TABLE IF EXISTS sizes CASCADE;
DROP TABLE IF EXISTS colors CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- =====================================================
-- 2. VALIDAR TABLA TIENDAS (MULTI-TENANT BASE)
-- =====================================================
-- Si no existe, crearla. Si existe, no hacer nada.
CREATE TABLE IF NOT EXISTS tiendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    rubro VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. UBICACIONES (MULTI-SUCURSAL NATIVO)
-- =====================================================
CREATE TABLE locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('STORE', 'WAREHOUSE', 'VIRTUAL')),
    address VARCHAR(200),
    is_default BOOLEAN DEFAULT FALSE,
    external_erp_id VARCHAR(50),  -- Para integración con Lince u otros ERPs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Solo puede haber una ubicación default por tienda
    CONSTRAINT unique_default_location UNIQUE (tienda_id, is_default) 
        WHERE (is_default = TRUE)
);

-- =====================================================
-- 4. DIMENSIONES: TALLES Y COLORES (POR TIENDA)
-- =====================================================

-- Talles (S, M, L, XL, 38, 40, 42, etc.)
CREATE TABLE sizes (
    id SERIAL PRIMARY KEY,
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL,        -- "S", "M", "L", "42"
    sort_order INT NOT NULL DEFAULT 0, -- Para ordenar: S < M < L
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_size_per_tienda UNIQUE(tienda_id, name)
);

-- Colores (Rojo, Azul, Negro, etc.)
CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    hex_code VARCHAR(7),  -- #FF0000 para mostrar en UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_color_per_tienda UNIQUE(tienda_id, name)
);

-- =====================================================
-- 5. PRODUCTOS PADRE (SIN STOCK DIRECTO)
-- =====================================================
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    base_sku VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- El base_sku debe ser único por tienda
    CONSTRAINT unique_base_sku_per_tienda UNIQUE(tienda_id, base_sku)
);

-- =====================================================
-- 6. VARIANTES DE PRODUCTOS (HIJOS CON TALLE/COLOR)
-- =====================================================
CREATE TABLE product_variants (
    variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,  -- Desnormalizado para performance
    
    sku VARCHAR(100) NOT NULL,  -- SKU único generado: BASE-COLOR-TALLE
    size_id INT REFERENCES sizes(id) ON DELETE RESTRICT,
    color_id INT REFERENCES colors(id) ON DELETE RESTRICT,
    
    price DECIMAL(10, 2) NOT NULL,
    barcode VARCHAR(50),  -- Código de barras EAN13
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- EL SKU ES ÚNICO POR TIENDA
    CONSTRAINT unique_sku_per_tienda UNIQUE(tienda_id, sku),
    
    -- Una variante es única por producto + talle + color
    CONSTRAINT unique_variant_combination UNIQUE(product_id, size_id, color_id)
);

-- =====================================================
-- 7. EL LIBRO MAYOR (INVENTORY LEDGER)
-- =====================================================
-- ACÁ ESTÁ LA MAGIA: NUNCA HACEMOS UPDATE, SOLO INSERT
CREATE TABLE inventory_ledger (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,  -- CRÍTICO para particionamiento
    variant_id UUID NOT NULL REFERENCES product_variants(variant_id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    
    delta DECIMAL(12, 4) NOT NULL,  -- +10 (Compra), -1 (Venta), +2 (Ajuste)
    
    transaction_type VARCHAR(50) NOT NULL,  -- 'SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'INITIAL_STOCK', 'TRANSFER'
    reference_doc VARCHAR(100),  -- ID de Ticket, Orden de Compra, etc.
    notes TEXT,  -- Notas adicionales
    
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,  -- ID del usuario que hizo el movimiento
    
    -- Validación: delta no puede ser 0
    CONSTRAINT delta_not_zero CHECK (delta != 0)
);

-- =====================================================
-- 8. ÍNDICES DE GUERRA (PERFORMANCE CRÍTICA)
-- =====================================================

-- Productos por tienda
CREATE INDEX idx_products_tienda ON products(tienda_id) WHERE is_active = TRUE;
CREATE INDEX idx_products_base_sku ON products(tienda_id, base_sku);

-- Variantes: lookup rápido por SKU
CREATE INDEX idx_variants_lookup ON product_variants(tienda_id, sku) WHERE is_active = TRUE;
CREATE INDEX idx_variants_by_product ON product_variants(product_id) WHERE is_active = TRUE;
CREATE INDEX idx_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;

-- Ledger: cálculo de stock ultra-rápido
CREATE INDEX idx_ledger_balance ON inventory_ledger(tienda_id, location_id, variant_id);
CREATE INDEX idx_ledger_by_variant ON inventory_ledger(variant_id, occurred_at DESC);
CREATE INDEX idx_ledger_by_location ON inventory_ledger(location_id, occurred_at DESC);
CREATE INDEX idx_ledger_by_type ON inventory_ledger(transaction_type, occurred_at DESC);

-- Ubicaciones
CREATE INDEX idx_locations_tienda ON locations(tienda_id) WHERE is_default = TRUE;

-- Dimensiones
CREATE INDEX idx_sizes_tienda ON sizes(tienda_id, sort_order);
CREATE INDEX idx_colors_tienda ON colors(tienda_id, name);

-- =====================================================
-- 9. FUNCIÓN: CALCULAR STOCK ACTUAL POR UBICACIÓN
-- =====================================================
CREATE OR REPLACE FUNCTION get_stock_balance(
    p_variant_id UUID,
    p_location_id UUID
) RETURNS DECIMAL(12, 4) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(delta) 
         FROM inventory_ledger 
         WHERE variant_id = p_variant_id 
           AND location_id = p_location_id),
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 10. FUNCIÓN: CALCULAR STOCK TOTAL DE UNA VARIANTE
-- =====================================================
CREATE OR REPLACE FUNCTION get_total_stock(
    p_variant_id UUID
) RETURNS DECIMAL(12, 4) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(delta) 
         FROM inventory_ledger 
         WHERE variant_id = p_variant_id),
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 11. TRIGGER: AUTO-TIMESTAMP EN UPDATES
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 12. DATOS DE SEED: TALLES Y COLORES COMUNES
-- =====================================================
-- Nota: Estos se crearán por tienda cuando se cree la primera
-- Por ahora dejamos las tablas vacías

-- =====================================================
-- 13. VALIDACIONES Y CONSTRAINTS ADICIONALES
-- =====================================================

-- Precio debe ser positivo
ALTER TABLE product_variants
ADD CONSTRAINT price_positive CHECK (price >= 0);

-- Solo puede haber un location default por tienda (ya definido arriba)
-- Solo deltas != 0 en ledger (ya definido arriba)

-- =====================================================
-- 14. COMENTARIOS EN TABLAS (DOCUMENTACIÓN)
-- =====================================================
COMMENT ON TABLE products IS 'Productos padre sin stock directo. El stock se calcula desde inventory_ledger a través de las variantes.';
COMMENT ON TABLE product_variants IS 'Variantes de productos con combinación única de talle/color. Cada variante tiene su propio SKU.';
COMMENT ON TABLE inventory_ledger IS 'Libro mayor de inventario. APPEND-ONLY: nunca se actualiza, solo se insertan transacciones. El stock actual es SUM(delta).';
COMMENT ON TABLE locations IS 'Ubicaciones físicas (tiendas, depósitos). Soporta multi-sucursal desde día 0.';
COMMENT ON TABLE sizes IS 'Catálogo de talles por tienda (S, M, L, XL, 38, 40, etc.)';
COMMENT ON TABLE colors IS 'Catálogo de colores por tienda con código hex para visualización.';

COMMENT ON COLUMN inventory_ledger.delta IS 'Cantidad que cambia el stock: +N para entradas (compras, devoluciones), -N para salidas (ventas, ajustes negativos)';
COMMENT ON COLUMN inventory_ledger.transaction_type IS 'Tipo de transacción: SALE, PURCHASE, RETURN, ADJUSTMENT, INITIAL_STOCK, TRANSFER';
COMMENT ON COLUMN product_variants.sku IS 'SKU único generado automáticamente: {base_sku}-{color}-{size}';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

SELECT 'Migración a Inventory Ledger completada exitosamente! 🚀' as status;
