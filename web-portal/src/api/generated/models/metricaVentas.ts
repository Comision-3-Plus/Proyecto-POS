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
import type { MetricaVentasUltimos7DiasItem } from "./metricaVentasUltimos7DiasItem";

/**
 * Métrica de ventas
 */
export interface MetricaVentas {
  ayer: number;
  cambio_diario_porcentaje: number;
  cambio_semanal_porcentaje: number;
  hoy: number;
  mes: number;
  semana: number;
  tickets_emitidos: number;
  ultimos_7_dias: MetricaVentasUltimos7DiasItem[];
}
