/**
 * Servicio de Compras y Proveedores
 * Gestiona órdenes de compra, proveedores y recepción de mercadería
 */

import apiClient, { handleApiError } from '@/lib/api-client';
import type {
  Proveedor,
  ProveedorCreate,
  OrdenCompra,
  OrdenCompraCreate,
  RecibirOrdenResponse,
} from '@/types/compras';

const API_V1 = '/api/v1';

export const comprasService = {
  // ==================== PROVEEDORES ====================

  /**
   * Listar todos los proveedores
   */
  async listarProveedores(): Promise<Proveedor[]> {
    try {
      const response = await apiClient.get<Proveedor[]>(`${API_V1}/compras/proveedores`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Crear un nuevo proveedor
   */
  async crearProveedor(data: ProveedorCreate): Promise<Proveedor> {
    try {
      const response = await apiClient.post<Proveedor>(`${API_V1}/compras/proveedores`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ==================== ÓRDENES DE COMPRA ====================

  /**
   * Listar todas las órdenes de compra
   */
  async listarOrdenes(): Promise<OrdenCompra[]> {
    try {
      const response = await apiClient.get<OrdenCompra[]>(`${API_V1}/compras/ordenes`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Crear una nueva orden de compra
   */
  async crearOrden(data: OrdenCompraCreate): Promise<OrdenCompra> {
    try {
      const response = await apiClient.post<OrdenCompra>(`${API_V1}/compras/ordenes`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * 🔥 CRÍTICO: Recibir mercadería (actualiza stock y precios)
   */
  async recibirOrden(ordenId: string): Promise<RecibirOrdenResponse> {
    try {
      const response = await apiClient.post<RecibirOrdenResponse>(
        `${API_V1}/compras/recibir/${ordenId}`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Cancelar una orden de compra
   */
  async cancelarOrden(ordenId: string): Promise<OrdenCompra> {
    try {
      const response = await apiClient.patch<OrdenCompra>(
        `${API_V1}/compras/ordenes/${ordenId}/cancelar`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
