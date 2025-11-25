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
import type { ResumenVentasMetodoPagoMasUsado } from "./resumenVentasMetodoPagoMasUsado";
import type { ResumenVentasProductoMasVendido } from "./resumenVentasProductoMasVendido";

/**
 * Schema para resumen de ventas
 */
export interface ResumenVentas {
  metodo_pago_mas_usado?: ResumenVentasMetodoPagoMasUsado;
  monto_total: number;
  periodo_fin: string;
  periodo_inicio: string;
  producto_mas_vendido?: ResumenVentasProductoMasVendido;
  ticket_promedio: number;
  total_ventas: number;
}
