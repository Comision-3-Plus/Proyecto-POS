/**
 * Exportar Service - Exportación de datos a CSV
 */

import apiClient from './api/apiClient';

class ExportarService {
  /**
   * Exportar productos a CSV
   */
  async exportarProductos() {
    const response = await apiClient.get('/exportar/productos/csv', {
      responseType: 'blob',
    });
    
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `productos_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  }

  /**
   * Exportar ventas a CSV
   */
  async exportarVentas(params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const response = await apiClient.get('/exportar/ventas/csv', {
      params,
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ventas_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  }

  /**
   * Exportar reporte de rentabilidad a CSV
   */
  async exportarRentabilidad(params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const response = await apiClient.get('/exportar/reportes/rentabilidad/csv', {
      params,
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rentabilidad_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  }
}

export default new ExportarService();
