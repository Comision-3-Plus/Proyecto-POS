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

export type BuscarProductosAvanzadoApiV1ProductosBuscarGetParams = {
  /**
   * Búsqueda por nombre o SKU
   */
  q?: string | null;
  /**
   * Filtrar por tipo
   */
  tipo?: string | null;
  precio_min?: number | null;
  precio_max?: number | null;
  stock_min?: number | null;
  solo_activos?: boolean;
  skip?: number;
  limit?: number;
};
