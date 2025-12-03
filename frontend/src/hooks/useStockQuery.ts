/**
 * Stock Query Hooks - React Query para gestión de inventario
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import stockService, { 
  StockAdjustmentRequest, 
  StockTransferRequest 
} from '@/services/stock.service';
import { useToast } from '@/context/ToastContext';

// Query keys
export const stockKeys = {
  all: ['stock'] as const,
  resumen: () => [...stockKeys.all, 'resumen'] as const,
  variant: (variantId: string) => [...stockKeys.all, 'variant', variantId] as const,
  transactions: (filters?: any) => [...stockKeys.all, 'transactions', filters] as const,
  locations: () => [...stockKeys.all, 'locations'] as const,
  lowStock: (threshold?: number) => [...stockKeys.all, 'low-stock', threshold] as const,
};

/**
 * Hook: Obtener resumen de stock de todos los productos
 */
export function useStockResumen() {
  return useQuery({
    queryKey: stockKeys.resumen(),
    queryFn: () => stockService.getStockResumen(),
    staleTime: 30_000, // 30 segundos
  });
}

/**
 * Hook: Obtener stock de una variante específica
 */
export function useStockByVariant(variantId: string, enabled = true) {
  return useQuery({
    queryKey: stockKeys.variant(variantId),
    queryFn: () => stockService.getStockByVariant(variantId),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Hook: Obtener historial de transacciones de inventario
 */
export function useTransactions(filters?: {
  variant_id?: string;
  location_id?: string;
  reference_type?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: stockKeys.transactions(filters),
    queryFn: () => stockService.getTransactions(filters),
    staleTime: 10_000, // 10 segundos para transacciones
  });
}

/**
 * Hook: Obtener ubicaciones disponibles
 */
export function useLocations() {
  return useQuery({
    queryKey: stockKeys.locations(),
    queryFn: () => stockService.getLocations(),
    staleTime: 5 * 60_000, // 5 minutos (no cambian frecuentemente)
  });
}

/**
 * Hook: Obtener productos con bajo stock
 */
export function useLowStockProducts(threshold = 10) {
  return useQuery({
    queryKey: stockKeys.lowStock(threshold),
    queryFn: () => stockService.getLowStockProducts(threshold),
    staleTime: 60_000, // 1 minuto
  });
}

/**
 * Hook: Crear ajuste de inventario (mutation)
 */
export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (adjustment: StockAdjustmentRequest) =>
      stockService.createAdjustment(adjustment),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: stockKeys.resumen() });
      queryClient.invalidateQueries({ queryKey: stockKeys.variant(variables.variant_id) });
      queryClient.invalidateQueries({ queryKey: stockKeys.transactions() });
      success('Ajuste de inventario creado exitosamente');
    },
    onError: (err: any) => {
      error(err.response?.data?.detail || 'Error al crear ajuste de inventario');
    },
  });
}

/**
 * Hook: Transferir stock entre ubicaciones (mutation)
 */
export function useTransferStock() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (transfer: StockTransferRequest) =>
      stockService.transferStock(transfer),
    onSuccess: (_, variables) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: stockKeys.resumen() });
      queryClient.invalidateQueries({ queryKey: stockKeys.variant(variables.variant_id) });
      queryClient.invalidateQueries({ queryKey: stockKeys.transactions() });
      success('Transferencia de stock completada');
    },
    onError: (err: any) => {
      error(err.response?.data?.detail || 'Error al transferir stock');
    },
  });
}
