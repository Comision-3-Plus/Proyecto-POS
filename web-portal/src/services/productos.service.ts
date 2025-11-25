/**
 * Servicio de productos
 * CRUD completo de productos
 */

import apiClient, { handleApiError } from '@/lib/api-client';
import type {
  ProductoCreate,
  ProductoUpdate,
  ProductoRead,
  ProductoScanRead,
  ProductosQueryParams,
  ProductosBusquedaParams,
} from '@/types/api';

const API_V1 = '/api/v1';

export const productosService = {
  /**
   * Listar productos con filtros opcionales
   */
  async list(params?: ProductosQueryParams): Promise<ProductoRead[]> {
    try {
      const response = await apiClient.get<ProductoRead[]>(`${API_V1}/productos/`, { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Búsqueda avanzada de productos
   */
  async buscar(params: ProductosBusquedaParams): Promise<{
    items: ProductoRead[];
    total: number;
    skip: number;
    limit: number;
    has_more: boolean;
  }> {
    try {
      const response = await apiClient.get(`${API_V1}/productos/buscar`, { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener producto por ID
   */
  async getById(id: string): Promise<ProductoRead> {
    try {
      const response = await apiClient.get<ProductoRead>(`${API_V1}/productos/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Buscar producto por SKU
   */
  async getBySku(sku: string): Promise<ProductoRead> {
    try {
      const response = await apiClient.get<ProductoRead>(`${API_V1}/productos/sku/${sku}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Crear nuevo producto
   */
  async create(data: ProductoCreate): Promise<ProductoRead> {
    try {
      const response = await apiClient.post<ProductoRead>(`${API_V1}/productos/`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Actualizar producto existente
   */
  async update(id: string, data: ProductoUpdate): Promise<ProductoRead> {
    try {
      const response = await apiClient.patch<ProductoRead>(`${API_V1}/productos/${id}`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Eliminar producto (soft delete)
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`${API_V1}/productos/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default productosService;
