/**
 * Hooks de React Query para ventas
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { ventasService } from '@/services';
import type {
  VentaCreate,
  VentaResumen,
  VentaRead,
  VentaListRead,
  VentasQueryParams,
  ProductoScanRead,
} from '@/types/api';
import { toast } from 'sonner';

// Query keys
export const ventasKeys = {
  all: ['ventas'] as const,
  lists: () => [...ventasKeys.all, 'list'] as const,
  list: (params?: VentasQueryParams) => [...ventasKeys.lists(), params] as const,
  details: () => [...ventasKeys.all, 'detail'] as const,
  detail: (id: string) => [...ventasKeys.details(), id] as const,
  scan: (codigo: string) => [...ventasKeys.all, 'scan', codigo] as const,
};

/**
 * Hook para listar ventas
 */
export function useVentas(params?: VentasQueryParams): UseQueryResult<VentaListRead[]> {
  return useQuery({
    queryKey: ventasKeys.list(params),
    queryFn: () => ventasService.list(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener detalle de venta
 */
export function useVenta(id: string): UseQueryResult<VentaRead> {
  return useQuery({
    queryKey: ventasKeys.detail(id),
    queryFn: () => ventasService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook para escanear producto
 */
export function useScanProducto(codigo: string): UseQueryResult<ProductoScanRead> {
  return useQuery({
    queryKey: ventasKeys.scan(codigo),
    queryFn: () => ventasService.scanProducto(codigo),
    enabled: !!codigo && codigo.length > 0,
    retry: false,
  });
}

/**
 * Hook para procesar venta (checkout)
 */
export function useCheckout(): UseMutationResult<VentaResumen, Error, VentaCreate> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ventasService.checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ventasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Venta procesada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al procesar venta: ${error.message}`);
    },
  });
}

/**
 * Hook para anular venta
 */
export function useAnularVenta(): UseMutationResult<VentaRead, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ventasService.anular,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ventasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Venta anulada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al anular venta: ${error.message}`);
    },
  });
}
