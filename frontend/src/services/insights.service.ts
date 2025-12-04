/**
 * Insights Service - Alertas y recomendaciones inteligentes
 */

import apiClient from './api/apiClient';

// Types
export interface Insight {
  id: string;
  tipo: string;
  mensaje: string;
  nivel_urgencia: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  is_active: boolean;
  extra_data: Record<string, any>;
  created_at: string;
  tienda_id: string;
}

export interface InsightRefreshResponse {
  insights_generados: number;
  tipos_generados: string[];
  mensaje: string;
}

export interface InsightStats {
  total_activos: number;
  por_urgencia: Record<string, number>;
  por_tipo: Record<string, number>;
  ultima_actualizacion: string;
}

class InsightsService {
  /**
   * Listar insights activos
   */
  async getInsights(params?: {
    nivel_urgencia?: string;
    tipo?: string;
    is_active?: boolean;
  }) {
    const response = await apiClient.get<Insight[]>('/insights/', { params });
    return response.data;
  }

  /**
   * Descartar/archivar insight
   */
  async dismissInsight(insightId: string) {
    const response = await apiClient.post(`/insights/${insightId}/dismiss`);
    return response.data;
  }

  /**
   * Refrescar insights (regenerar)
   */
  async refreshInsights() {
    const response = await apiClient.post<InsightRefreshResponse>('/insights/refresh');
    return response.data;
  }

  /**
   * Refrescar insights en background
   */
  async backgroundRefresh() {
    const response = await apiClient.post('/insights/background-refresh');
    return response.data;
  }

  /**
   * Obtener estadísticas de insights
   */
  async getStats() {
    const response = await apiClient.get<InsightStats>('/insights/stats');
    return response.data;
  }

  /**
   * Limpiar todos los insights
   */
  async clearAll() {
    const response = await apiClient.delete('/insights/clear-all');
    return response.data;
  }
}

export default new InsightsService();
