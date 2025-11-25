/**
 * Hooks de React Query para Compras y Proveedores
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { comprasService } from '@/services/compras.service';
import type {
  Proveedor,
  ProveedorCreate,
  OrdenCompra,
  OrdenCompraCreate,
  RecibirOrdenResponse,
} from '@/types/compras';
import { toast } from 'sonner';

// Query keys
export const comprasKeys = {
  all: ['compras'] as const,
  proveedores: () => [...comprasKeys.all, 'proveedores'] as const,
  ordenes: () => [...comprasKeys.all, 'ordenes'] as const,
};

// ==================== PROVEEDORES ====================

/**
 * Hook para listar proveedores
 */
export function useProveedores(): UseQueryResult<Proveedor[]> {
  return useQuery({
    queryKey: comprasKeys.proveedores(),
    queryFn: () => comprasService.listarProveedores(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para crear un proveedor
 */
export function useCrearProveedor(): UseMutationResult<Proveedor, Error, ProveedorCreate> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProveedorCreate) => comprasService.crearProveedor(data),
    onSuccess: (data: Proveedor) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.proveedores() });
      toast.success('Proveedor creado correctamente', {
        description: data.razon_social,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear proveedor', {
        description: error.message,
      });
    },
  });
}

// ==================== ÓRDENES DE COMPRA ====================

/**
 * Hook para listar órdenes de compra
 */
export function useOrdenes(): UseQueryResult<OrdenCompra[]> {
  return useQuery({
    queryKey: comprasKeys.ordenes(),
    queryFn: () => comprasService.listarOrdenes(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para crear una orden de compra
 */
export function useCrearOrden(): UseMutationResult<OrdenCompra, Error, OrdenCompraCreate> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrdenCompraCreate) => comprasService.crearOrden(data),
    onSuccess: (data: OrdenCompra) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.ordenes() });
      toast.success('Orden de compra creada', {
        description: `Total: $${data.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear orden', {
        description: error.message,
      });
    },
  });
}

/**
 * 🔥 Hook CRÍTICO para recibir mercadería
 */
export function useRecibirOrden(): UseMutationResult<RecibirOrdenResponse, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ordenId: string) => comprasService.recibirOrden(ordenId),
    onSuccess: (data: RecibirOrdenResponse) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: comprasKeys.ordenes() });
      queryClient.invalidateQueries({ queryKey: ['productos'] }); // Stock actualizado
      
      toast.success('Stock actualizado correctamente', {
        description: data.mensaje,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al recibir mercadería', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook para cancelar una orden
 */
export function useCancelarOrden(): UseMutationResult<OrdenCompra, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ordenId: string) => comprasService.cancelarOrden(ordenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.ordenes() });
      toast.success('Orden cancelada correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al cancelar orden', {
        description: error.message,
      });
    },
  });
}
