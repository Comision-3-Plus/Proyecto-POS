/**
 * Servicio de Ventas
 */

import apiClient from './api/apiClient';
import type {
  Venta,
  VentaCreate,
  VentaResumen,
  ProductoScan,
  FacturarVentaRequest,
  Factura,
} from '@/types/api';

const BASE_PATH = '/ventas';

export const ventasService = {
  /**
   * Escanear producto por código
   */
  async scanProducto(codigo: string): Promise<ProductoScan> {
    const response = await apiClient.get<ProductoScan>(`${BASE_PATH}/scan/${codigo}`);
    return response.data;
  },

  /**
   * Procesar checkout (venta)
   */
  async checkout(data: VentaCreate): Promise<VentaResumen> {
    const response = await apiClient.post<VentaResumen>(`${BASE_PATH}/checkout`, data);
    return response.data;
  },

  /**
   * Listar ventas
   */
  async getAll(params?: {
    skip?: number;
    limit?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Venta[]> {
    const response = await apiClient.get<Venta[]>(BASE_PATH, { params });
    return response.data;
  },

  /**
   * Obtener detalle de venta
   */
  async getById(ventaId: string): Promise<Venta> {
    const response = await apiClient.get<Venta>(`${BASE_PATH}/${ventaId}`);
    return response.data;
  },

  /**
   * Anular venta
   */
  async anular(ventaId: string): Promise<Venta> {
    const response = await apiClient.patch<Venta>(`${BASE_PATH}/${ventaId}/anular`);
    return response.data;
  },

  /**
   * Facturar venta (AFIP)
   */
  async facturar(ventaId: string, data: FacturarVentaRequest): Promise<Factura> {
    const response = await apiClient.post<Factura>(
      `${BASE_PATH}/${ventaId}/facturar`,
      data
    );
    return response.data;
  },
};
