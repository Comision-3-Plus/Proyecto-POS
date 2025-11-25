/**
 * Servicio de dashboard
 * Obtiene métricas consolidadas y datos en tiempo real
 */

import apiClient, { handleApiError } from '@/lib/api-client';
import type { DashboardResumen } from '@/types/api';

const API_V1 = '/api/v1';

export const dashboardService = {
  /**
   * Obtener resumen completo del dashboard
   */
  async getResumen(): Promise<DashboardResumen> {
    try {
      const response = await apiClient.get<DashboardResumen>(`${API_V1}/dashboard/resumen`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener ventas en tiempo real (últimas 24 horas)
   */
  async getVentasTiempoReal(): Promise<{
    periodo: string;
    datos: Array<{
      hora: string;
      cantidad_ventas: number;
      total: number;
    }>;
  }> {
    try {
      const response = await apiClient.get(`${API_V1}/dashboard/ventas-tiempo-real`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default dashboardService;
