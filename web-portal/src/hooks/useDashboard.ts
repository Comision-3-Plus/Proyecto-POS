/**
 * Hooks de React Query para dashboard
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { dashboardService } from '@/services';
import type { DashboardResumen } from '@/types/api';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  resumen: () => [...dashboardKeys.all, 'resumen'] as const,
  tiempoReal: () => [...dashboardKeys.all, 'tiempo-real'] as const,
};

/**
 * Hook para obtener resumen del dashboard
 */
export function useDashboard(): UseQueryResult<DashboardResumen> {
  return useQuery({
    queryKey: dashboardKeys.resumen(),
    queryFn: () => dashboardService.getResumen(),
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 60 * 5, // Refetch cada 5 minutos
  });
}

/**
 * Hook para ventas en tiempo real
 */
export function useVentasTiempoReal() {
  return useQuery({
    queryKey: dashboardKeys.tiempoReal(),
    queryFn: () => dashboardService.getVentasTiempoReal(),
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: 1000 * 60, // Refetch cada minuto
  });
}
