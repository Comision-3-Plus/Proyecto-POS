/**
 * /**
 *  * 🤖 GENERADO AUTOMÁTICAMENTE POR ORVAL
 *  * ⚠️ NO EDITAR MANUALMENTE - Se sobrescribirá en la próxima generación
 *  *
 *  * Endpoint: undefined
 *  * Tag: undefined
 *  * Generado: 2025-11-24T21:12:17.605Z
 *  *\/
 */

/**
 * Schema de lectura para un detalle de venta
Incluye información del producto
 */
export interface DetalleVentaRead {
  cantidad: number;
  id: string;
  precio_unitario: number;
  producto_id: string;
  /** Nombre del producto al momento de la venta */
  producto_nombre: string;
  /** SKU del producto */
  producto_sku: string;
  subtotal: number;
}
