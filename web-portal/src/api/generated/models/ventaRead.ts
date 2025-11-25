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
import type { DetalleVentaRead } from "./detalleVentaRead";

/**
 * Schema de lectura para una venta completa
Incluye detalles expandidos
 */
export interface VentaRead {
  created_at: string;
  detalles?: DetalleVentaRead[];
  fecha: string;
  id: string;
  metodo_pago: string;
  tienda_id: string;
  total: number;
}
