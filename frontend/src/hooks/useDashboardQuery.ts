/**
 * Custom Hook: useDashboardQuery
 * React Query hook para obtener datos del dashboard
 */

import { useQuery } from '@tanstack/react-query';
import dashboardService, { DashboardResumen } from '@/services/dashboard.service';

export function useDashboardQuery() {
  return useQuery<DashboardResumen>({
    queryKey: ['dashboard', 'resumen'],
    queryFn: () => dashboardService.getResumen(),
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 60, // Auto-refresh cada 1 minuto
    refetchOnWindowFocus: true,
  });
}

export function useVentasTiempoRealQuery() {
  return useQuery({
    queryKey: ['dashboard', 'ventas-tiempo-real'],
    queryFn: () => dashboardService.getVentasTiempoReal(),
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: 1000 * 30, // Auto-refresh cada 30 segundos
  });
}
