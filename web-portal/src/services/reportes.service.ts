/**
 * Servicio de reportes
 * Analytics y reportes de negocio
 */

import apiClient, { handleApiError } from '@/lib/api-client';
import type {
  ResumenVentas,
  ProductoMasVendido,
  RentabilidadProducto,
  VentasPorPeriodo,
} from '@/types/api';

const API_V1 = '/api/v1';

export const reportesService = {
  /**
   * Obtener resumen de ventas para un período
   */
  async getResumenVentas(params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<ResumenVentas> {
    try {
      const response = await apiClient.get<ResumenVentas>(
        `${API_V1}/reportes/ventas/resumen`,
        { params }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener productos más vendidos
   */
  async getProductosMasVendidos(params?: {
    limite?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<ProductoMasVendido[]> {
    try {
      const response = await apiClient.get<ProductoMasVendido[]>(
        `${API_V1}/reportes/productos/mas-vendidos`,
        { params }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Analizar rentabilidad de productos
   */
  async getRentabilidadProductos(params?: {
    limite?: number;
    orden?: 'utilidad' | 'margen' | 'cantidad';
  }): Promise<RentabilidadProducto[]> {
    try {
      const response = await apiClient.get<RentabilidadProducto[]>(
        `${API_V1}/reportes/productos/rentabilidad`,
        { params }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener tendencia de ventas diaria
   */
  async getTendenciaVentasDiaria(params?: {
    dias?: number;
  }): Promise<VentasPorPeriodo[]> {
    try {
      const response = await apiClient.get<VentasPorPeriodo[]>(
        `${API_V1}/reportes/ventas/tendencia-diaria`,
        { params }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default reportesService;
