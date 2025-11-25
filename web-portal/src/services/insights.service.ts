/**
 * Servicio de insights y alertas
 * Gestión de alertas inteligentes del sistema
 */

import apiClient, { handleApiError } from '@/lib/api-client';
import type { InsightRead, InsightRefreshResponse } from '@/types/api';

const API_V1 = '/api/v1';

export const insightsService = {
  /**
   * Listar insights con filtros
   */
  async list(params?: {
    activos_solo?: boolean;
    nivel_urgencia?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    tipo?: string;
    limit?: number;
  }): Promise<InsightRead[]> {
    try {
      const response = await apiClient.get<InsightRead[]>(`${API_V1}/insights/`, { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Archivar insight (marcar como inactivo)
   */
  async dismiss(id: string): Promise<void> {
    try {
      await apiClient.post(`${API_V1}/insights/${id}/dismiss`);
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Refrescar insights manualmente
   */
  async refresh(force: boolean = false): Promise<InsightRefreshResponse> {
    try {
      const response = await apiClient.post<InsightRefreshResponse>(
        `${API_V1}/insights/refresh`,
        null,
        { params: { force } }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Refrescar insights en background (no bloqueante)
   */
  async refreshBackground(): Promise<{ mensaje: string }> {
    try {
      const response = await apiClient.post(`${API_V1}/insights/background-refresh`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener estadísticas de insights
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const response = await apiClient.get(`${API_V1}/insights/stats`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Limpiar insights
   */
  async clearAll(solo_archivados: boolean = false): Promise<void> {
    try {
      await apiClient.delete(`${API_V1}/insights/clear-all`, {
        params: { solo_archivados },
      });
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default insightsService;
