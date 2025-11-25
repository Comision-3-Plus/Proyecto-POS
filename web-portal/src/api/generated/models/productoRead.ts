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
import type { ProductoReadAtributos } from "./productoReadAtributos";
import type { ProductoReadDescripcion } from "./productoReadDescripcion";

/**
 * Schema de respuesta de Producto
 */
export interface ProductoRead {
  atributos?: ProductoReadAtributos;
  created_at: string;
  descripcion?: ProductoReadDescripcion;
  id: string;
  is_active: boolean;
  /**
   * @minLength 1
   * @maxLength 255
   */
  nombre: string;
  /**
   * Debe ser mayor o igual a 0
   * @minimum 0
   */
  precio_costo: number;
  /**
   * Debe ser mayor a 0
   */
  precio_venta: number;
  /**
   * @minLength 1
   * @maxLength 100
   */
  sku: string;
  stock_actual: number;
  tienda_id: string;
  /**
   * @minLength 1
   * @maxLength 50
   */
  tipo: string;
  /** UNIDAD, KILO, LITRO, METRO */
  unidad_medida?: string;
  updated_at: string;
}
