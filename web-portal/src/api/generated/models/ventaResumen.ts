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
 * Schema para mostrar resumen de venta después del checkout
Información condensada para ticket/comprobante
 */
export interface VentaResumen {
  cantidad_items: number;
  fecha: string;
  mensaje?: string;
  metodo_pago: string;
  total: number;
  venta_id: string;
}
