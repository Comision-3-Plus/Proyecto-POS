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
import type { MetricaInventario } from "./metricaInventario";
import type { ProductoDestacado } from "./productoDestacado";
import type { MetricaVentas } from "./metricaVentas";

/**
 * Resumen completo del dashboard
 */
export interface DashboardResumen {
  alertas_criticas: number;
  inventario: MetricaInventario;
  productos_destacados: ProductoDestacado[];
  ultima_actualizacion: string;
  ventas: MetricaVentas;
}
