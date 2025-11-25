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
 * Schema minimalista para el endpoint de escaneo
Solo datos esenciales para velocidad máxima
 */
export interface ProductoScanRead {
  id: string;
  nombre: string;
  precio_venta: number;
  sku: string;
  stock_actual: number;
  /** Indicador rápido de disponibilidad */
  tiene_stock: boolean;
  tipo: string;
}
