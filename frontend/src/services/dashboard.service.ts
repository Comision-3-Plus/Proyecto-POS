/**
 * Dashboard Service
 * Servicio para obtener métricas y datos del dashboard
 */

import apiClient from './api/apiClient';

export interface MetricaVentas {
  hoy: number;
  ayer: number;
  semana: number;
  mes: number;
  tickets_emitidos: number;
  cambio_diario_porcentaje: number;
  cambio_semanal_porcentaje: number;
  ultimos_7_dias: Array<{
    fecha: string;
    total: number;
  }>;
}

export interface MetricaInventario {
  total_productos: number;
  productos_activos: number;
  productos_bajo_stock: number;
  valor_total_inventario: number;
}

export interface ProductoDestacado {
  id: string;
  nombre: string;
  sku: string;
  stock: number;
  ventas_hoy: number;
}

export interface DashboardResumen {
  ventas: MetricaVentas;
  inventario: MetricaInventario;
  productos_destacados: ProductoDestacado[];
  alertas_criticas: number;
  ultima_actualizacion: string;
}

export interface VentaTiempoReal {
  periodo: string;
  datos: Array<{
    hora: string;
    cantidad_ventas: number;
    total: number;
  }>;
}

const dashboardService = {
  /**
   * Obtener resumen completo del dashboard
   */
  async getResumen(): Promise<DashboardResumen> {
    const response = await apiClient.get<DashboardResumen>('/dashboard/resumen');
    return response.data;
  },

  /**
   * Obtener ventas en tiempo real (últimas 24 horas)
   */
  async getVentasTiempoReal(): Promise<VentaTiempoReal> {
    const response = await apiClient.get<VentaTiempoReal>('/dashboard/ventas-tiempo-real');
    return response.data;
  },
};

export default dashboardService;
