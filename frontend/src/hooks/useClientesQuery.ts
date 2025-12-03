/**
 * Clientes Query Hooks - React Query para CRM
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clientesService, { ClienteCreate, ClienteUpdate } from '@/services/clientes.service';
import { useToast } from '@/context/ToastContext';

// Query keys
export const clientesKeys = {
  all: ['clientes'] as const,
  list: (params?: any) => [...clientesKeys.all, 'list', params] as const,
  detail: (id: string) => [...clientesKeys.all, 'detail', id] as const,
  top: (limit?: number) => [...clientesKeys.all, 'top', limit] as const,
  search: (query: string) => [...clientesKeys.all, 'search', query] as const,
};

/**
 * Hook: Listar clientes
 */
export function useClientes(params?: {
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: clientesKeys.list(params),
    queryFn: () => clientesService.getClientes(params),
    staleTime: 30_000, // 30 segundos
  });
}

/**
 * Hook: Obtener detalle de un cliente
 */
export function useCliente(clienteId: string, enabled = true) {
  return useQuery({
    queryKey: clientesKeys.detail(clienteId),
    queryFn: () => clientesService.getCliente(clienteId),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Hook: Top clientes
 */
export function useTopClientes(limit = 10) {
  return useQuery({
    queryKey: clientesKeys.top(limit),
    queryFn: () => clientesService.getTopClientes(limit),
    staleTime: 60_000, // 1 minuto
  });
}

/**
 * Hook: Búsqueda rápida de clientes
 */
export function useSearchClientes(query: string, enabled = true) {
  return useQuery({
    queryKey: clientesKeys.search(query),
    queryFn: () => clientesService.searchCliente(query),
    enabled: enabled && query.length >= 2,
    staleTime: 10_000,
  });
}

/**
 * Hook: Crear cliente (mutation)
 */
export function useCreateCliente() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (cliente: ClienteCreate) => clientesService.createCliente(cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.all });
      success('Cliente creado exitosamente');
    },
    onError: (err: any) => {
      error(err.response?.data?.detail || 'Error al crear cliente');
    },
  });
}

/**
 * Hook: Actualizar cliente (mutation)
 */
export function useUpdateCliente() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ clienteId, updates }: { clienteId: string; updates: ClienteUpdate }) =>
      clientesService.updateCliente(clienteId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.detail(variables.clienteId) });
      queryClient.invalidateQueries({ queryKey: clientesKeys.list() });
      success('Cliente actualizado exitosamente');
    },
    onError: (err: any) => {
      error(err.response?.data?.detail || 'Error al actualizar cliente');
    },
  });
}

/**
 * Hook: Desactivar cliente (mutation)
 */
export function useDeactivateCliente() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (clienteId: string) => clientesService.deactivateCliente(clienteId),
    onSuccess: (_, clienteId) => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.detail(clienteId) });
      queryClient.invalidateQueries({ queryKey: clientesKeys.list() });
      success('Cliente desactivado exitosamente');
    },
    onError: (err: any) => {
      error(err.response?.data?.detail || 'Error al desactivar cliente');
    },
  });
}
