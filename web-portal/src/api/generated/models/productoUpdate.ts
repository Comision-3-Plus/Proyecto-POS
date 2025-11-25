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
import type { ProductoUpdateAtributos } from "./productoUpdateAtributos";
import type { ProductoUpdateDescripcion } from "./productoUpdateDescripcion";
import type { ProductoUpdateIsActive } from "./productoUpdateIsActive";
import type { ProductoUpdateNombre } from "./productoUpdateNombre";
import type { ProductoUpdatePrecioCosto } from "./productoUpdatePrecioCosto";
import type { ProductoUpdatePrecioVenta } from "./productoUpdatePrecioVenta";
import type { ProductoUpdateSku } from "./productoUpdateSku";
import type { ProductoUpdateStockActual } from "./productoUpdateStockActual";
import type { ProductoUpdateTipo } from "./productoUpdateTipo";
import type { ProductoUpdateUnidadMedida } from "./productoUpdateUnidadMedida";

/**
 * Schema para actualizar un Producto
 */
export interface ProductoUpdate {
  atributos?: ProductoUpdateAtributos;
  descripcion?: ProductoUpdateDescripcion;
  is_active?: ProductoUpdateIsActive;
  nombre?: ProductoUpdateNombre;
  precio_costo?: ProductoUpdatePrecioCosto;
  precio_venta?: ProductoUpdatePrecioVenta;
  sku?: ProductoUpdateSku;
  stock_actual?: ProductoUpdateStockActual;
  tipo?: ProductoUpdateTipo;
  /** UNIDAD, KILO, LITRO, METRO */
  unidad_medida?: ProductoUpdateUnidadMedida;
}
