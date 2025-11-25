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

export type ListarInsightsApiV1InsightsGetParams = {
  /**
   * Mostrar solo insights activos
   */
  activos_solo?: boolean;
  /**
   * Filtrar por urgencia: BAJA, MEDIA, ALTA, CRITICA
   */
  nivel_urgencia?: string;
  /**
   * Filtrar por tipo: STOCK_BAJO, VENTAS_DIARIAS, etc.
   */
  tipo?: string;
  limit?: number;
};
