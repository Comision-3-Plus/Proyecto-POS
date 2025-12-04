/**
 * Servicio de Productos - Inventory Ledger System
 */

import apiClient from './api/apiClient';
import type {
  Product,
  ProductVariantWithStock,
  CreateProductRequest,
  Size,
  Color,
  Location,
  QueryParams,
} from '@/types/api';

const BASE_PATH = '/productos/'; // ⭐ FIX: Barra final para evitar 307 redirect que pierde auth header

export const productosService = {
  /**
   * Lista todos los productos padre
   */
  async getAll(params?: QueryParams): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(BASE_PATH, { params });
    return response.data;
  },

  /**
   * Obtiene un producto por ID con variantes
   */
  async getById(productId: string): Promise<Product> {
    const response = await apiClient.get<Product>(`${BASE_PATH}${productId}`);
    return response.data;
  },

  /**
   * Crea un nuevo producto con variantes
   */
  async create(data: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post<Product>(BASE_PATH, data);
    return response.data;
  },

  /**
   * Obtiene variantes de un producto con stock por ubicación
   */
  async getVariants(productId: string): Promise<ProductVariantWithStock[]> {
    const response = await apiClient.get<ProductVariantWithStock[]>(
      `${BASE_PATH}${productId}/variants`
    );
    return response.data;
  },

  /**
   * Lista talles disponibles
   */
  async getSizes(): Promise<Size[]> {
    const response = await apiClient.get<Size[]>(`${BASE_PATH}sizes`);
    return response.data;
  },

  /**
   * Lista colores disponibles
   */
  async getColors(): Promise<Color[]> {
    const response = await apiClient.get<Color[]>(`${BASE_PATH}colors`);
    return response.data;
  },

  /**
   * Lista ubicaciones (sucursales/depósitos)
   */
  async getLocations(): Promise<Location[]> {
    const response = await apiClient.get<Location[]>(`${BASE_PATH}locations`);
    return response.data;
  },

  /**
   * Sugiere un SKU único basado en el nombre del producto
   */
  async suggestSku(productName: string): Promise<{ suggested_sku: string; product_name: string }> {
    const response = await apiClient.get<{ suggested_sku: string; product_name: string }>(
      `${BASE_PATH}suggest-sku`,
      { params: { product_name: productName } }
    );
    return response.data;
  },
};
