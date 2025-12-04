/**
 * Analytics Service - Análisis retail avanzado
 */

import apiClient from './api/apiClient';

// Types
export interface TopProductoCategoria {
  category: string;
  product_name: string;
  total_vendido: number;
  cantidad_vendida: number;
}

export interface SeasonalityData {
  season: string;
  total_ventas: number;
  productos_vendidos: number;
  productos_disponibles: number;
}

export interface BrandPerformance {
  brand: string;
  total_ventas: number;
  cantidad_vendida: number;
  productos_activos: number;
  margen_promedio: number;
}

export interface SizeDistribution {
  size_name: string;
  cantidad_vendida: number;
  porcentaje: number;
}

export interface ColorPreference {
  color_name: string;
  cantidad_vendida: number;
  porcentaje: number;
  hex_code: string | null;
}

export interface RestockSuggestion {
  variant_id: string;
  product_name: string;
  sku: string;
  size_name: string;
  color_name: string;
  stock_actual: number;
  ventas_ultimos_30_dias: number;
  dias_para_agotarse: number;
  cantidad_sugerida: number;
}

export interface InventoryHealth {
  total_variantes: number;
  variantes_en_stock: number;
  variantes_sin_stock: number;
  variantes_bajo_stock: number;
  porcentaje_salud: number;
}

class AnalyticsService {
  /**
   * Top productos por categoría
   */
  async getTopProductosPorCategoria(params?: {
    limit?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const response = await apiClient.get<TopProductoCategoria[]>(
      '/retail-analytics/top-products-by-category',
      { params }
    );
    return response.data;
  }

  /**
   * Análisis de temporada
   */
  async getSeasonality() {
    const response = await apiClient.get<SeasonalityData[]>(
      '/retail-analytics/seasonality'
    );
    return response.data;
  }

  /**
   * Performance por marca
   */
  async getBrandPerformance(params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const response = await apiClient.get<BrandPerformance[]>(
      '/retail-analytics/brand-performance',
      { params }
    );
    return response.data;
  }

  /**
   * Distribución de talles
   */
  async getSizeDistribution(params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const response = await apiClient.get<SizeDistribution[]>(
      '/retail-analytics/size-distribution',
      { params }
    );
    return response.data;
  }

  /**
   * Preferencias de color
   */
  async getColorPreferences(params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const response = await apiClient.get<ColorPreference[]>(
      '/retail-analytics/color-preferences',
      { params }
    );
    return response.data;
  }

  /**
   * Sugerencias de reposición
   */
  async getRestockSuggestions(params?: {
    threshold_days?: number;
  }) {
    const response = await apiClient.get<RestockSuggestion[]>(
      '/retail-analytics/restock-suggestions',
      { params }
    );
    return response.data;
  }

  /**
   * Salud del inventario
   */
  async getInventoryHealth() {
    const response = await apiClient.get<InventoryHealth>(
      '/retail-analytics/inventory-health'
    );
    return response.data;
  }
}

export default new AnalyticsService();
