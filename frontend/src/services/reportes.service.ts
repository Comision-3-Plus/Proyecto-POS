/**
 * Reportes Service - Analytics y reportes de ventas
 */

import apiClient from './api/apiClient';

// Types
export interface VentasPorPeriodo {
  fecha: string;
  total_ventas: number;
  cantidad_ventas: number;
  ticket_promedio: number;
}

export interface TopProducto {
  product_id: string;
  product_name: string;
  sku: string;
  cantidad_vendida: number;
  total_vendido: number;
  porcentaje_ventas: number;
}

export interface VentasPorCategoria {
  category: string;
  total_ventas: number;
  cantidad_productos: number;
  porcentaje: number;
}

export interface VentasPorMetodoPago {
  metodo_pago: string;
  total_ventas: number;
  cantidad_transacciones: number;
  porcentaje: number;
}

export interface ReporteVentasDetallado {
  resumen: {
    total_ventas: number;
    cantidad_transacciones: number;
    ticket_promedio: number;
    productos_vendidos: number;
  };
  por_periodo: VentasPorPeriodo[];
  top_productos: TopProducto[];
  por_categoria: VentasPorCategoria[];
  por_metodo_pago: VentasPorMetodoPago[];
}

export interface VentaDetalle {
  venta_id: string;
  fecha: string;
  total: number;
  metodo_pago: string;
  estado: string;
  items: {
    producto: string;
    sku: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
}

export type PeriodoReporte = 'hoy' | 'ayer' | 'semana' | 'mes' | 'custom';

class ReportesService {
  /**
   * Reporte general de ventas por período
   */
  async getReporteVentas(params: {
    periodo?: PeriodoReporte;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) {
    const { data } = await apiClient.get<ReporteVentasDetallado>('/reportes/ventas', { params });
    return data;
  }

  /**
   * Top productos más vendidos
   */
  async getTopProductos(params: {
    periodo?: PeriodoReporte;
    limit?: number;
  }) {
    const { data } = await apiClient.get<TopProducto[]>('/reportes/top-productos', { params });
    return data;
  }

  /**
   * Ventas por categoría
   */
  async getVentasPorCategoria(params: {
    periodo?: PeriodoReporte;
  }) {
    const { data } = await apiClient.get<VentasPorCategoria[]>('/reportes/por-categoria', { params });
    return data;
  }

  /**
   * Ventas por método de pago
   */
  async getVentasPorMetodoPago(params: {
    periodo?: PeriodoReporte;
  }) {
    const { data } = await apiClient.get<VentasPorMetodoPago[]>('/reportes/por-metodo-pago', { params });
    return data;
  }

  /**
   * Tendencia de ventas (últimos N días)
   */
  async getTendenciaVentas(dias: number = 30) {
    const { data } = await apiClient.get<VentasPorPeriodo[]>('/reportes/tendencia', {
      params: { dias },
    });
    return data;
  }

  /**
   * Detalle de ventas individuales
   */
  async getVentasDetalle(params: {
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
    offset?: number;
  }) {
    const { data } = await apiClient.get<VentaDetalle[]>('/reportes/ventas-detalle', { params });
    return data;
  }

  /**
   * Exportar reporte a CSV
   */
  async exportarCSV(params: {
    tipo: 'ventas' | 'productos' | 'inventario';
    periodo?: PeriodoReporte;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) {
    const { data } = await apiClient.get('/reportes/export/csv', {
      params,
      responseType: 'blob',
    });
    
    // Crear descarga automática
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_${params.tipo}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return data;
  }
}

export const reportesService = new ReportesService();
export default reportesService;
