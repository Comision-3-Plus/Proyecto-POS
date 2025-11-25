/**
 * Servicio de ventas
 * Maneja proceso de checkout, listado y detalle de ventas
 */

import apiClient, { handleApiError } from '@/lib/api-client';
import type {
  VentaCreate,
  VentaResumen,
  VentaRead,
  VentaListRead,
  VentasQueryParams,
  ProductoScanRead,
} from '@/types/api';

const API_V1 = '/api/v1';

export const ventasService = {
  /**
   * Escanear producto por código (optimizado para POS)
   */
  async scanProducto(codigo: string): Promise<ProductoScanRead> {
    try {
      const response = await apiClient.get<ProductoScanRead>(`${API_V1}/ventas/scan/${codigo}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Procesar venta (checkout)
   */
  async checkout(data: VentaCreate): Promise<VentaResumen> {
    try {
      const response = await apiClient.post<VentaResumen>(`${API_V1}/ventas/checkout`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Listar ventas con filtros opcionales
   */
  async list(params?: VentasQueryParams): Promise<VentaListRead[]> {
    try {
      const response = await apiClient.get<VentaListRead[]>(`${API_V1}/ventas/`, { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener detalle de venta por ID
   */
  async getById(id: string): Promise<VentaRead> {
    try {
      const response = await apiClient.get<VentaRead>(`${API_V1}/ventas/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Anular venta (requiere permisos)
   */
  async anular(id: string): Promise<VentaRead> {
    try {
      const response = await apiClient.patch<VentaRead>(`${API_V1}/ventas/${id}/anular`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default ventasService;
