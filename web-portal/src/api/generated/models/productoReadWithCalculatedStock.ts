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
import type { ProductoReadWithCalculatedStockAtributos } from "./productoReadWithCalculatedStockAtributos";
import type { ProductoReadWithCalculatedStockDescripcion } from "./productoReadWithCalculatedStockDescripcion";
import type { ProductoReadWithCalculatedStockStockCalculado } from "./productoReadWithCalculatedStockStockCalculado";

/**
 * Schema extendido que incluye el stock calculado para productos tipo ropa
 */
export interface ProductoReadWithCalculatedStock {
  atributos?: ProductoReadWithCalculatedStockAtributos;
  created_at: string;
  descripcion?: ProductoReadWithCalculatedStockDescripcion;
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
  /** Stock total calculado desde variantes (solo para tipo ropa) */
  stock_calculado?: ProductoReadWithCalculatedStockStockCalculado;
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
