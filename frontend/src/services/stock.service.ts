/**
 * Stock Service - Gestión de inventario y movimientos
 * Basado en Inventory Ledger System
 */

import apiClient from './api/apiClient';

// Types
export interface InventoryTransaction {
  transaction_id: string;
  variant_id: string;
  location_id: string;
  delta: number;
  reference_type: 'adjustment' | 'sale' | 'return' | 'transfer' | 'purchase';
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string;
}

export interface ProductVariantStock {
  variant_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  size_name: string | null;
  color_name: string | null;
  price: number;
  stock_total: number;
  stock_by_location: {
    location_id: string;
    location_name: string;
    stock: number;
  }[];
}

export interface StockAdjustmentRequest {
  variant_id: string;
  location_id: string;
  delta: number;
  reference_type: 'adjustment';
  notes?: string;
}

export interface StockTransferRequest {
  variant_id: string;
  from_location_id: string;
  to_location_id: string;
  quantity: number;
  notes?: string;
}

export interface Location {
  location_id: string;
  tienda_id: string;
  name: string;
  type: 'store' | 'warehouse' | 'online';
  address: string | null;
  is_active: boolean;
}

class StockService {
  /**
   * Obtener stock de todas las variantes
   */
  async getStockResumen() {
    const { data } = await apiClient.get<ProductVariantStock[]>('/stock/resumen');
    return data;
  }

  /**
   * Obtener stock de una variante específica
   */
  async getStockByVariant(variantId: string) {
    const { data } = await apiClient.get<ProductVariantStock>(`/stock/variant/${variantId}`);
    return data;
  }

  /**
   * Obtener transacciones de inventario (historial)
   */
  async getTransactions(params?: {
    variant_id?: string;
    location_id?: string;
    reference_type?: string;
    limit?: number;
    offset?: number;
  }) {
    const { data } = await apiClient.get<InventoryTransaction[]>('/stock/transactions', { params });
    return data;
  }

  /**
   * Crear ajuste de inventario (entrada/salida manual)
   */
  async createAdjustment(adjustment: StockAdjustmentRequest) {
    const { data } = await apiClient.post<InventoryTransaction>('/stock/adjustment', adjustment);
    return data;
  }

  /**
   * Transferir stock entre ubicaciones
   */
  async transferStock(transfer: StockTransferRequest) {
    const { data } = await apiClient.post<{ from: InventoryTransaction; to: InventoryTransaction }>(
      '/stock/transfer',
      transfer
    );
    return data;
  }

  /**
   * Obtener ubicaciones de la tienda
   */
  async getLocations() {
    const { data } = await apiClient.get<Location[]>('/stock/locations');
    return data;
  }

  /**
   * Productos con bajo stock (alerta)
   */
  async getLowStockProducts(threshold: number = 10) {
    const { data } = await apiClient.get<ProductVariantStock[]>('/stock/low-stock', {
      params: { threshold },
    });
    return data;
  }
}

export const stockService = new StockService();
export default stockService;
