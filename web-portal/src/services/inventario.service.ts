/**
 * Servicio de inventario
 * Gestión de stock, alertas y ajustes
 */

import apiClient, { handleApiError } from '@/lib/api-client';
import type { AjusteStockRequest, ProductoBajoStock } from '@/types/api';

const API_V1 = '/api/v1';

export const inventarioService = {
  /**
   * Ajustar stock manualmente
   */
  async ajustarStock(data: AjusteStockRequest): Promise<{
    success: boolean;
    producto_id: string;
    stock_anterior: number;
    stock_nuevo: number;
    diferencia: number;
    mensaje: string;
  }> {
    try {
      const response = await apiClient.post(`${API_V1}/inventario/ajustar-stock`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener productos con stock bajo
   */
  async getAlertasStockBajo(umbral: number = 10): Promise<ProductoBajoStock[]> {
    try {
      const response = await apiClient.get<ProductoBajoStock[]>(
        `${API_V1}/inventario/alertas-stock-bajo`,
        { params: { umbral } }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener productos sin stock
   */
  async getProductosSinStock(): Promise<{
    total: number;
    productos: Array<{
      id: string;
      sku: string;
      nombre: string;
      ultima_venta: string | null;
    }>;
  }> {
    try {
      const response = await apiClient.get(`${API_V1}/inventario/sin-stock`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener estadísticas del inventario
   */
  async getEstadisticas(): Promise<{
    total_productos: number;
    productos_sin_stock: number;
    productos_bajo_stock: number;
    porcentaje_sin_stock: number;
    valor_inventario_costo: number;
    valor_inventario_venta: number;
    utilidad_potencial: number;
  }> {
    try {
      const response = await apiClient.get(`${API_V1}/inventario/estadisticas`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default inventarioService;
