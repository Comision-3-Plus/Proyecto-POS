-- ⚡ OPTIMIZACIONES DE BASE DE DATOS PARA NEXUS POS ⚡
-- Indices compuestos para queries más frecuentes y mejor performance

-- === PRODUCTOS ===
-- Query común: WHERE tienda_id = X AND is_active = true (listado de productos activos)
CREATE INDEX IF NOT EXISTS idx_productos_tienda_activo 
ON productos(tienda_id, is_active) 
WHERE is_active = true;

-- Query común: WHERE tienda_id = X AND sku ILIKE '%search%' (búsqueda por SKU)
CREATE INDEX IF NOT EXISTS idx_productos_tienda_sku 
ON productos(tienda_id, sku);

-- Query común: WHERE tienda_id = X AND tipo = 'general' (filtro por tipo)
CREATE INDEX IF NOT EXISTS idx_productos_tienda_tipo 
ON productos(tienda_id, tipo);


-- === VENTAS ===
-- Query común: WHERE tienda_id = X AND fecha >= Y ORDER BY fecha DESC (ventas recientes)
CREATE INDEX IF NOT EXISTS idx_ventas_tienda_fecha 
ON ventas(tienda_id, fecha DESC);

-- Query común: WHERE tienda_id = X AND status_pago = 'pagado' AND fecha >= Y (dashboard)
CREATE INDEX IF NOT EXISTS idx_ventas_tienda_status_fecha 
ON ventas(tienda_id, status_pago, fecha DESC) 
WHERE status_pago = 'pagado';

-- Query común: WHERE tienda_id = X AND metodo_pago = 'mercadopago' (reportes)
CREATE INDEX IF NOT EXISTS idx_ventas_tienda_metodo 
ON ventas(tienda_id, metodo_pago);


-- === DETALLES_VENTA ===
-- Query común: WHERE venta_id = X (obtener items de una venta)
-- Ya existe índice en venta_id, pero agregar uno compuesto con producto_id
CREATE INDEX IF NOT EXISTS idx_detalles_venta_producto 
ON detalles_venta(venta_id, producto_id);


-- === INSIGHTS ===
-- Query común: WHERE tienda_id = X AND dismissed = false ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_insights_tienda_dismissed_fecha 
ON insights(tienda_id, dismissed, created_at DESC) 
WHERE dismissed = false;


-- === ANÁLISIS DE PERFORMANCE ===
-- Ver tamaño de tablas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;


-- Ver índices existentes y su uso
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;


-- Ver queries lentas (ejecutar EXPLAIN ANALYZE en queries problemáticas)
-- Ejemplo: EXPLAIN ANALYZE SELECT * FROM productos WHERE tienda_id = '...' AND is_active = true;
