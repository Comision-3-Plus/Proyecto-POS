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
 * Schema de entrada para un item de venta
Usado en el proceso de checkout
 */
export interface ItemVentaInput {
  /**
   * Cantidad a vender (puede ser decimal para pesables)
   */
  cantidad: number;
  producto_id: string;
}
