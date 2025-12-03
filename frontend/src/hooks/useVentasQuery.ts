/**
 * Custom Hook para Ventas
 * React Query hooks para gestión de ventas y checkout
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventasService } from '@/services/ventas.service';
import { useToast } from '@/context/ToastContext';
import type { VentaCreate } from '@/types/api';

const QUERY_KEYS = {
  ventas: ['ventas'] as const,
  venta: (id: string) => ['ventas', id] as const,
};

/**
 * Hook para escanear un producto por código
 */
export function useScanProducto(codigo: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ['productos', 'scan', codigo],
    queryFn: () => ventasService.scanProducto(codigo),
    enabled: enabled && !!codigo,
    retry: false, // No reintentar si el producto no existe
    staleTime: 0, // Siempre fresh para obtener stock actualizado
  });
}

/**
 * Mutation para procesar checkout
 */
export function useCheckout() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: VentaCreate) => ventasService.checkout(data),
    onSuccess: (result) => {
      success(`Venta procesada exitosamente. Total: $${result.total.toLocaleString()}`);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ventas });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (err) => {
      error(`Error al procesar venta: ${err.message}`);
    },
  });
}

/**
 * Hook para listar ventas
 */
export function useVentasQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ventas,
    queryFn: () => ventasService.getAll(),
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para obtener una venta específica
 */
export function useVentaQuery(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.venta(id),
    queryFn: () => ventasService.getById(id),
    enabled: !!id,
  });
}
