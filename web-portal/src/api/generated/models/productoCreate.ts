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
import type { ProductoCreateAtributos } from "./productoCreateAtributos";
import type { ProductoCreateDescripcion } from "./productoCreateDescripcion";

/**
 * Schema para crear un Producto
Incluye validadores personalizados según el tipo
 */
export interface ProductoCreate {
  atributos?: ProductoCreateAtributos;
  descripcion?: ProductoCreateDescripcion;
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
  /** @minimum 0 */
  stock_actual?: number;
  /**
   * @minLength 1
   * @maxLength 50
   */
  tipo: string;
  /** UNIDAD, KILO, LITRO, METRO */
  unidad_medida?: string;
}
