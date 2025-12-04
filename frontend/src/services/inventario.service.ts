/**
 * Inventario Service - Ajustes y alertas de stock
 */

import apiClient from './api/apiClient';

// Types
export interface AjusteStockRequest {
  producto_id: string;
  cantidad: number;
  tipo_ajuste: 'ENTRADA' | 'SALIDA' | 'CORRECCION';
  motivo: string;
}

export interface ProductoBajoStock {
  producto_id: string;
  nombre: string;
  sku: string;
  stock_actual: number;
  stock_minimo: number;
  diferencia: number;
}

export interface ProductoSinStock {
  producto_id: string;
  nombre: string;
  sku: string;
  precio_venta: number;
  ultima_venta: string | null;
}

export interface EstadisticasInventario {
  total_productos: number;
  valor_total_inventario: number;
  productos_bajo_stock: number;
  productos_sin_stock: number;
  productos_activos: number;
  productos_inactivos: number;
}

class InventarioService {
  /**
   * Ajustar stock manualmente
   */
  async ajustarStock(data: AjusteStockRequest) {
    const response = await apiClient.post('/inventario/ajustar-stock', data);
    return response.data;
  }

  /**
   * Registrar ajuste de inventario (alias para compatibilidad)
   */
  async registrarAjuste(data: any) {
    return this.ajustarStock(data);
  }

  /**
   * Obtener niveles de stock
   */
  async getStockLevels() {
    const response = await apiClient.get('/inventario/stock-levels');
    return response.data;
  }

  /**
   * Obtener movimientos de inventario
   */
  async getMovements(params?: { limit?: number }) {
    const response = await apiClient.get('/inventario/movements', { params });
    return response.data;
  }

  /**
   * Obtener alertas de stock bajo (alias)
   */
  async getLowStockAlerts() {
    return this.getAlertasStockBajo();
  }

  /**
   * Obtener alertas de productos con stock bajo
   */
  async getAlertasStockBajo() {
    const response = await apiClient.get<ProductoBajoStock[]>(
      '/inventario/alertas-stock-bajo'
    );
    return response.data;
  }

  /**
   * Obtener productos sin stock
   */
  async getProductosSinStock() {
    const response = await apiClient.get<ProductoSinStock[]>('/inventario/sin-stock');
    return response.data;
  }

  /**
   * Obtener estadísticas de inventario
   */
  async getEstadisticas() {
    const response = await apiClient.get<EstadisticasInventario>(
      '/inventario/estadisticas'
    );
    return response.data;
  }
}

export default new InventarioService();
