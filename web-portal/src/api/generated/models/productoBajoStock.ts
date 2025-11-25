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
 * Producto con stock bajo
 */
export interface ProductoBajoStock {
  debe_reabastecer?: boolean;
  id: string;
  nombre: string;
  sku: string;
  stock_actual: number;
  stock_minimo?: number;
}
