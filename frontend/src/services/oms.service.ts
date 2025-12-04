/**
 * Servicio de OMS - Order Management System
 */

import apiClient from './api/apiClient';

const BASE_PATH = '/oms/';

export interface OrdenOmnicanal {
  id: string;
  numero_orden: string;
  canal: string;
  plataforma?: string;
  external_order_id?: string;
  cliente_id?: string;
  shipping_address: Record<string, any>;
  shipping_method: string;
  subtotal: number;
  descuentos: number;
  envio: number;
  total: number;
  fulfillment_status: string;
  fulfillment_location_id?: string;
  created_at: string;
  assigned_at?: string;
  routing_decision?: Record<string, any>;
}

export interface CreateOrdenRequest {
  canal: string;
  plataforma?: string;
  external_order_id?: string;
  cliente_id?: string;
  shipping_address: Record<string, any>;
  shipping_method?: string;
  items: Array<{
    variant_id: string;
    cantidad: number;
    precio_unitario: number;
  }>;
  subtotal: number;
  descuentos?: number;
  envio?: number;
  total: number;
}

export interface RoutingDecision {
  orden_id: string;
  numero_orden: string;
  status: string;
  routing_decision: Record<string, any>;
}

export interface RoutingAnalytics {
  periodo_dias: number;
  total_ordenes: number;
  asignadas_automaticamente: number;
  tasa_asignacion_auto: number;
  ubicacion_mas_usada?: [string, number];
  distribucion_ubicaciones: Record<string, number>;
}

const omsService = {
  /**
   * Lista órdenes pendientes de asignación
   */
  async getPendingOrders(): Promise<{ count: number; ordenes: OrdenOmnicanal[] }> {
    const response = await apiClient.get<{ count: number; ordenes: OrdenOmnicanal[] }>(
      `${BASE_PATH}ordenes/pending`
    );
    return response.data;
  },

  /**
   * Crea una nueva orden omnicanal
   */
  async createOrden(data: CreateOrdenRequest): Promise<any> {
    const response = await apiClient.post(`${BASE_PATH}ordenes`, data);
    return response.data;
  },

  /**
   * Obtiene la decisión de routing de una orden
   */
  async getRoutingDecision(ordenId: string): Promise<RoutingDecision> {
    const response = await apiClient.get<RoutingDecision>(
      `${BASE_PATH}ordenes/${ordenId}/routing`
    );
    return response.data;
  },

  /**
   * Re-ejecuta el algoritmo de routing
   */
  async reRouteOrder(ordenId: string): Promise<any> {
    const response = await apiClient.post(`${BASE_PATH}ordenes/${ordenId}/re-route`);
    return response.data;
  },

  /**
   * Obtiene analytics del sistema de routing
   */
  async getRoutingAnalytics(dias: number = 30): Promise<RoutingAnalytics> {
    const response = await apiClient.get<RoutingAnalytics>(
      `${BASE_PATH}analytics/routing`,
      { params: { dias } }
    );
    return response.data;
  },
};

export default omsService;
