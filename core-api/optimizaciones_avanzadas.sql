-- =====================================================
-- OPTIMIZACIONES DE BASE DE DATOS - SUPER POS
-- =====================================================
-- Descripción: Índices avanzados y optimizaciones para PostgreSQL
-- Fecha: 2025-11-23
-- Autor: Senior Software Architect

-- =====================================================
-- 1. ÍNDICES GIN PARA BÚSQUEDAS JSONB
-- =====================================================

-- Índice GIN en atributos de productos (búsquedas polimórficas)
-- Permite: SELECT * FROM productos WHERE atributos @> '{"color": "rojo"}'::jsonb
CREATE INDEX IF NOT EXISTS idx_productos_atributos_gin 
ON productos USING GIN (atributos jsonb_path_ops);

-- Índice compuesto para filtrado eficiente
CREATE INDEX IF NOT EXISTS idx_productos_tipo_tienda_activo 
ON productos(tipo, tienda_id, is_active) 
WHERE is_active = true;

-- =====================================================
-- 2. ÍNDICES PARA BÚSQUEDAS CASE-INSENSITIVE
-- =====================================================

-- SKU case-insensitive (permite buscar "ABC123" o "abc123")
CREATE INDEX IF NOT EXISTS idx_productos_sku_lower 
ON productos(LOWER(sku), tienda_id);

-- Nombre de producto case-insensitive
CREATE INDEX IF NOT EXISTS idx_productos_nombre_lower 
ON productos(LOWER(nombre), tienda_id) 
WHERE is_active = true;

-- =====================================================
-- 3. ÍNDICES ESPECIALIZADOS PARA REPORTES
-- =====================================================

-- Ventas por fecha (para reportes de período)
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_tienda 
ON ventas(fecha DESC, tienda_id, status_pago) 
WHERE status_pago != 'anulado';

-- Productos más vendidos (top sellers)
CREATE INDEX IF NOT EXISTS idx_detalles_venta_producto_cantidad 
ON detalles_venta(producto_id, cantidad);

-- Stock bajo (para alertas automáticas)
CREATE INDEX IF NOT EXISTS idx_productos_stock_bajo 
ON productos(tienda_id, stock_actual) 
WHERE is_active = true AND tipo != 'servicio' AND stock_actual < 10;

-- =====================================================
-- 4. ÍNDICES PARA AUTENTICACIÓN Y AUTORIZACIÓN
-- =====================================================

-- Email de usuario (login rápido)
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email)) 
WHERE is_active = true;

-- Usuario por tienda + rol (RBAC)
CREATE INDEX IF NOT EXISTS idx_users_tienda_rol 
ON users(tienda_id, rol) 
WHERE is_active = true;

-- =====================================================
-- 5. ÍNDICES PARCIALES (Filtered Indexes)
-- =====================================================

-- Solo ventas pagadas (excluye pendientes y anuladas)
CREATE INDEX IF NOT EXISTS idx_ventas_pagadas 
ON ventas(tienda_id, fecha DESC, total) 
WHERE status_pago = 'pagado';

-- Solo productos activos con stock (excluye inactivos y sin stock)
CREATE INDEX IF NOT EXISTS idx_productos_disponibles 
ON productos(tienda_id, nombre) 
WHERE is_active = true AND stock_actual > 0;

-- =====================================================
-- 6. ESTADÍSTICAS Y MANTENIMIENTO
-- =====================================================

-- Actualizar estadísticas de la base de datos
ANALYZE productos;
ANALYZE ventas;
ANALYZE detalles_venta;
ANALYZE users;
ANALYZE tiendas;

-- =====================================================
-- 7. VISTAS MATERIALIZADAS (Opcional - Para reportes pesados)
-- =====================================================

-- Vista materializada: Top 10 productos más vendidos por tienda
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_productos_vendidos AS
SELECT 
    p.tienda_id,
    p.id as producto_id,
    p.nombre,
    p.sku,
    SUM(dv.cantidad) as total_vendido,
    SUM(dv.subtotal) as ingresos_totales,
    COUNT(DISTINCT dv.venta_id) as num_ventas
FROM productos p
INNER JOIN detalles_venta dv ON p.id = dv.producto_id
INNER JOIN ventas v ON dv.venta_id = v.id
WHERE v.status_pago = 'pagado'
  AND p.is_active = true
GROUP BY p.tienda_id, p.id, p.nombre, p.sku
ORDER BY total_vendido DESC;

-- Índice en la vista materializada
CREATE INDEX IF NOT EXISTS idx_mv_top_productos_tienda 
ON mv_top_productos_vendidos(tienda_id, total_vendido DESC);

-- Refrescar vista (ejecutar periódicamente con cron)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_productos_vendidos;

-- =====================================================
-- 8. FUNCIÓN PARA BÚSQUEDA FULL-TEXT EN PRODUCTOS
-- =====================================================

-- Agregar columna tsvector para búsqueda full-text
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
    to_tsvector('spanish', 
        coalesce(nombre, '') || ' ' || 
        coalesce(descripcion, '') || ' ' || 
        coalesce(sku, '')
    )
) STORED;

-- Índice GIN para búsqueda full-text
CREATE INDEX IF NOT EXISTS idx_productos_search 
ON productos USING GIN (search_vector);

-- Ejemplo de uso:
-- SELECT * FROM productos 
-- WHERE search_vector @@ to_tsquery('spanish', 'remera & roja');

-- =====================================================
-- 9. CONSTRAINTS ADICIONALES (Integridad de Datos)
-- =====================================================

-- Stock no puede ser negativo (excepto servicios)
ALTER TABLE productos 
ADD CONSTRAINT chk_stock_no_negativo 
CHECK (tipo = 'servicio' OR stock_actual >= 0);

-- Precio de venta debe ser mayor que costo
ALTER TABLE productos 
ADD CONSTRAINT chk_precio_venta_mayor_costo 
CHECK (precio_venta >= precio_costo);

-- Total de venta debe ser positivo
ALTER TABLE ventas 
ADD CONSTRAINT chk_total_positivo 
CHECK (total >= 0);

-- =====================================================
-- 10. PERMISOS (Security - Principio de Menor Privilegio)
-- =====================================================

-- Usuario para la API Python (Read/Write en datos, NO DDL)
-- CREATE USER nexuspos_api WITH PASSWORD 'strong_password_here';

-- Permisos de lectura/escritura en tablas de datos
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexuspos_api;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexuspos_api;

-- Usuario para Worker Go (Read/Write limitado, NO DDL)
-- CREATE USER worker_go WITH PASSWORD 'strong_password_here';

-- Worker solo necesita leer productos y escribir en auditoría
-- GRANT SELECT ON productos, tiendas, ventas, detalles_venta TO worker_go;
-- GRANT INSERT ON stock_alerts_sent TO worker_go; -- Tabla de auditoría (crear si no existe)

-- =====================================================
-- FIN DE OPTIMIZACIONES
-- =====================================================

SELECT 'Optimizaciones aplicadas exitosamente!' as status;
