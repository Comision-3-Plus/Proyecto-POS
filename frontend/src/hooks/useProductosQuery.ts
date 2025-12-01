/**
 * Custom Hook para Productos con React Query
 * Cache, invalidación automática, optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService } from '@/services/productos.service';
import { useToast } from '@/context/ToastContext';
import type { Product, CreateProductRequest } from '@/types/api';

const QUERY_KEYS = {
  productos: ['productos'] as const,
  producto: (id: number) => ['productos', id] as const,
  variants: (id: number) => ['productos', id, 'variants'] as const,
  sizes: ['productos', 'sizes'] as const,
  colors: ['productos', 'colors'] as const,
  locations: ['productos', 'locations'] as const,
};

/**
 * Hook para listar todos los productos (con cache)
 */
export function useProductosQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.productos,
    queryFn: () => productosService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener un producto específico
 */
export function useProductoQuery(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.producto(id),
    queryFn: () => productosService.getById(String(id)),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener variantes de un producto
 */
export function useProductVariantsQuery(productId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.variants(productId),
    queryFn: () => productosService.getVariants(String(productId)),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener talles disponibles
 */
export function useSizesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.sizes,
    queryFn: () => productosService.getSizes(),
    staleTime: 1000 * 60 * 30, // 30 minutos (dato relativamente estático)
  });
}

/**
 * Hook para obtener colores disponibles
 */
export function useColorsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.colors,
    queryFn: () => productosService.getColors(),
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Hook para obtener ubicaciones disponibles
 */
export function useLocationsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.locations,
    queryFn: () => productosService.getLocations(),
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Mutation para crear producto con Optimistic Update
 */
export function useCreateProducto() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => productosService.create(data),
    onMutate: async (newProduct) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.productos });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<Product[]>(QUERY_KEYS.productos);

      // Optimistically update to the new value
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(QUERY_KEYS.productos, (old = []) => [
          ...old,
          {
            product_id: String(Date.now()),
            id: Date.now(),
            ...newProduct,
            stock_actual: 0,
            stock_reservado: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as Product,
        ]);
      }

      return { previousProducts };
    },
    onError: (_err, _newProduct, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(QUERY_KEYS.productos, context.previousProducts);
      }
      error('Error al crear producto');
    },
    onSuccess: () => {
      success('Producto creado exitosamente');
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
    },
  });
}

/**
 * Mutation para actualizar producto
 */
export function useUpdateProducto() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation<
    void,
    Error,
    { id: number; data: Partial<Product> },
    { previousProduct?: Product }
  >({
    mutationFn: () =>
      // TODO: Implementar productosService.update
      Promise.reject(new Error('Update not implemented')),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.producto(id) });

      const previousProduct = queryClient.getQueryData<Product>(QUERY_KEYS.producto(id));

      if (previousProduct) {
        queryClient.setQueryData<Product>(QUERY_KEYS.producto(id), {
          ...previousProduct,
          ...data,
        });
      }

      return { previousProduct };
    },
    onError: (_err, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(QUERY_KEYS.producto(variables.id), context.previousProduct);
      }
      error('Error al actualizar producto');
    },
    onSuccess: () => {
      success('Producto actualizado exitosamente');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.producto(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
    },
  });
}

/**
 * Mutation para eliminar producto
 */
export function useDeleteProducto() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation<void, Error, number, { previousProducts?: Product[] }>({
    mutationFn: () =>
      // TODO: Implementar productosService.delete
      Promise.reject(new Error('Delete not implemented')),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.productos });

      const previousProducts = queryClient.getQueryData<Product[]>(QUERY_KEYS.productos);

      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          QUERY_KEYS.productos,
          previousProducts.filter((p) => p.product_id !== String(id))
        );
      }

      return { previousProducts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(QUERY_KEYS.productos, context.previousProducts);
      }
      error('Error al eliminar producto');
    },
    onSuccess: () => {
      success('Producto eliminado exitosamente');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
    },
  });
}
