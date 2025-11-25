/**
 * Hooks de React Query para productos
 * Gestión de estado del servidor para productos
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { productosService } from '@/services';
import type {
  ProductoRead,
  ProductoCreate,
  ProductoUpdate,
  ProductosQueryParams,
  ProductosBusquedaParams,
} from '@/types/api';
import { toast } from 'sonner';

// Query keys
export const productosKeys = {
  all: ['productos'] as const,
  lists: () => [...productosKeys.all, 'list'] as const,
  list: (params?: ProductosQueryParams) => [...productosKeys.lists(), params] as const,
  details: () => [...productosKeys.all, 'detail'] as const,
  detail: (id: string) => [...productosKeys.details(), id] as const,
  search: (params: ProductosBusquedaParams) => [...productosKeys.all, 'search', params] as const,
  bySku: (sku: string) => [...productosKeys.all, 'sku', sku] as const,
};

/**
 * Hook para listar productos
 */
export function useProductos(params?: ProductosQueryParams): UseQueryResult<ProductoRead[]> {
  return useQuery({
    queryKey: productosKeys.list(params),
    queryFn: () => productosService.list(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para buscar productos (búsqueda avanzada)
 */
export function useBuscarProductos(params: ProductosBusquedaParams) {
  return useQuery({
    queryKey: productosKeys.search(params),
    queryFn: () => productosService.buscar(params),
    enabled: !!params.q || !!params.tipo || params.precio_min !== undefined,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener un producto por ID
 */
export function useProducto(id: string): UseQueryResult<ProductoRead> {
  return useQuery({
    queryKey: productosKeys.detail(id),
    queryFn: () => productosService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook para obtener producto por SKU
 */
export function useProductoBySku(sku: string) {
  return useQuery({
    queryKey: productosKeys.bySku(sku),
    queryFn: () => productosService.getBySku(sku),
    enabled: !!sku,
  });
}

/**
 * Hook para crear producto
 */
export function useCreateProducto(): UseMutationResult<ProductoRead, Error, ProductoCreate> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productosKeys.lists() });
      toast.success('Producto creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear producto: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar producto
 */
export function useUpdateProducto(): UseMutationResult<ProductoRead, Error, { id: string; data: ProductoUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => productosService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productosKeys.detail(data.id) });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar producto: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar producto
 */
export function useDeleteProducto(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productosKeys.lists() });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar producto: ${error.message}`);
    },
  });
}
