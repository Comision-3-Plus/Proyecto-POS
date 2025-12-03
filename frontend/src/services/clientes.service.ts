/**
 * Clientes Service - Gestión de clientes y CRM
 */

import apiClient from './api/apiClient';

// Types
export interface Cliente {
  cliente_id: string;
  tienda_id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  documento_tipo: 'dni' | 'passport' | 'other' | null;
  documento_numero: string | null;
  fecha_nacimiento: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  notas: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClienteCreate {
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  documento_tipo?: 'dni' | 'passport' | 'other';
  documento_numero?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
  notas?: string;
}

export interface ClienteUpdate extends Partial<ClienteCreate> {
  is_active?: boolean;
}

export interface ClienteStats {
  total_compras: number;
  total_gastado: number;
  ticket_promedio: number;
  ultima_compra: string | null;
  primera_compra: string | null;
}

export interface ClienteDetalle extends Cliente {
  stats: ClienteStats;
  ultimas_compras: {
    venta_id: string;
    fecha: string;
    total: number;
    items_count: number;
  }[];
}

class ClientesService {
  /**
   * Listar clientes con paginación y búsqueda
   */
  async getClientes(params?: {
    search?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const { data } = await apiClient.get<Cliente[]>('/clientes', { params });
    return data;
  }

  /**
   * Obtener detalle de un cliente
   */
  async getCliente(clienteId: string) {
    const { data } = await apiClient.get<ClienteDetalle>(`/clientes/${clienteId}`);
    return data;
  }

  /**
   * Crear nuevo cliente
   */
  async createCliente(cliente: ClienteCreate) {
    const { data } = await apiClient.post<Cliente>('/clientes', cliente);
    return data;
  }

  /**
   * Actualizar cliente existente
   */
  async updateCliente(clienteId: string, updates: ClienteUpdate) {
    const { data } = await apiClient.put<Cliente>(`/clientes/${clienteId}`, updates);
    return data;
  }

  /**
   * Desactivar cliente (soft delete)
   */
  async deactivateCliente(clienteId: string) {
    const { data } = await apiClient.patch<Cliente>(`/clientes/${clienteId}/deactivate`);
    return data;
  }

  /**
   * Top clientes por compras
   */
  async getTopClientes(limit = 10) {
    const { data } = await apiClient.get<(Cliente & ClienteStats)[]>('/clientes/top', {
      params: { limit },
    });
    return data;
  }

  /**
   * Búsqueda rápida de cliente (por nombre, email, teléfono, documento)
   */
  async searchCliente(query: string) {
    const { data } = await apiClient.get<Cliente[]>('/clientes/search', {
      params: { q: query },
    });
    return data;
  }
}

export const clientesService = new ClientesService();
export default clientesService;
