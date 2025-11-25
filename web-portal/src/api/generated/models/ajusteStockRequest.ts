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
 * Request para ajuste manual de stock
 */
export interface AjusteStockRequest {
  /**
   * Nueva cantidad de stock
   * @minimum 0
   */
  cantidad_nueva: number;
  /**
   * @minLength 3
   * @maxLength 500
   */
  motivo: string;
  producto_id: string;
}
