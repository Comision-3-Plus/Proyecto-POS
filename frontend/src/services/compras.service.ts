/**
 * Compras Service - Gestión de proveedores y órdenes de compra
 */

import apiClient from './api/apiClient';

// Types
export interface Proveedor {
  id: string;
  razon_social: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  is_active: boolean;
  created_at: string;
  tienda_id: string;
}

export interface ProveedorCreate {
  razon_social: string;
  cuit: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export interface DetalleOrden {
  id?: string;
  producto_id: string;
  cantidad: number;
  precio_costo_unitario: number;
  subtotal?: number;
}

export interface OrdenCompra {
  id: string;
  proveedor_id: string;
  proveedor_razon_social: string;
  fecha_emision: string;
  estado: 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';
  total: number;
  observaciones: string | null;
  created_at: string;
  detalles: DetalleOrden[];
}

export interface OrdenCompraCreate {
  proveedor_id: string;
  observaciones?: string;
  detalles: DetalleOrden[];
}

export interface RecibirOrdenResponse {
  orden_id: string;
  estado: string;
  productos_actualizados: number;
  mensaje: string;
}

class ComprasService {
  /**
   * Listar proveedores
   */
  async getProveedores() {
    const response = await apiClient.get<Proveedor[]>('/compras/proveedores');
    return response.data;
  }

  /**
   * Crear proveedor
   */
  async createProveedor(data: ProveedorCreate) {
    const response = await apiClient.post<Proveedor>('/compras/proveedores', data);
    return response.data;
  }

  /**
   * Listar órdenes de compra
   */
  async getOrdenes(params?: {
    estado?: 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';
    proveedor_id?: string;
  }) {
    const response = await apiClient.get<OrdenCompra[]>('/compras/ordenes', { params });
    return response.data;
  }

  /**
   * Crear orden de compra
   */
  async createOrden(data: OrdenCompraCreate) {
    const response = await apiClient.post<OrdenCompra>('/compras/ordenes', data);
    return response.data;
  }

  /**
   * Recibir orden de compra (actualiza inventario)
   */
  async recibirOrden(ordenId: string) {
    const response = await apiClient.post<RecibirOrdenResponse>(
      `/compras/recibir/${ordenId}`
    );
    return response.data;
  }

  /**
   * Cancelar orden de compra
   */
  async cancelarOrden(ordenId: string) {
    const response = await apiClient.patch<OrdenCompra>(
      `/compras/ordenes/${ordenId}/cancelar`
    );
    return response.data;
  }
}

export default new ComprasService();
