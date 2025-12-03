/**
 * Reportes Query Hooks - React Query para analytics
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import reportesService, { PeriodoReporte } from '@/services/reportes.service';
import { useToast } from '@/context/ToastContext';

// Query keys
export const reportesKeys = {
  all: ['reportes'] as const,
  ventas: (params?: any) => [...reportesKeys.all, 'ventas', params] as const,
  topProductos: (params?: any) => [...reportesKeys.all, 'top-productos', params] as const,
  porCategoria: (params?: any) => [...reportesKeys.all, 'por-categoria', params] as const,
  porMetodoPago: (params?: any) => [...reportesKeys.all, 'por-metodo-pago', params] as const,
  tendencia: (dias?: number) => [...reportesKeys.all, 'tendencia', dias] as const,
  ventasDetalle: (params?: any) => [...reportesKeys.all, 'ventas-detalle', params] as const,
};

/**
 * Hook: Reporte general de ventas
 */
export function useReporteVentas(params: {
  periodo?: PeriodoReporte;
  fecha_inicio?: string;
  fecha_fin?: string;
} = {}) {
  return useQuery({
    queryKey: reportesKeys.ventas(params),
    queryFn: () => reportesService.getReporteVentas(params),
    staleTime: 60_000, // 1 minuto
  });
}

/**
 * Hook: Top productos más vendidos
 */
export function useTopProductos(params: {
  periodo?: PeriodoReporte;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: reportesKeys.topProductos(params),
    queryFn: () => reportesService.getTopProductos(params),
    staleTime: 60_000,
  });
}

/**
 * Hook: Ventas por categoría
 */
export function useVentasPorCategoria(params: {
  periodo?: PeriodoReporte;
} = {}) {
  return useQuery({
    queryKey: reportesKeys.porCategoria(params),
    queryFn: () => reportesService.getVentasPorCategoria(params),
    staleTime: 60_000,
  });
}

/**
 * Hook: Ventas por método de pago
 */
export function useVentasPorMetodoPago(params: {
  periodo?: PeriodoReporte;
} = {}) {
  return useQuery({
    queryKey: reportesKeys.porMetodoPago(params),
    queryFn: () => reportesService.getVentasPorMetodoPago(params),
    staleTime: 60_000,
  });
}

/**
 * Hook: Tendencia de ventas
 */
export function useTendenciaVentas(dias = 30) {
  return useQuery({
    queryKey: reportesKeys.tendencia(dias),
    queryFn: () => reportesService.getTendenciaVentas(dias),
    staleTime: 60_000,
  });
}

/**
 * Hook: Detalle de ventas individuales
 */
export function useVentasDetalle(params: {
  fecha_inicio?: string;
  fecha_fin?: string;
  limit?: number;
  offset?: number;
} = {}) {
  return useQuery({
    queryKey: reportesKeys.ventasDetalle(params),
    queryFn: () => reportesService.getVentasDetalle(params),
    staleTime: 30_000,
  });
}

/**
 * Hook: Exportar reporte (mutation)
 */
export function useExportarReporte() {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (params: {
      tipo: 'ventas' | 'productos' | 'inventario';
      periodo?: PeriodoReporte;
      fecha_inicio?: string;
      fecha_fin?: string;
    }) => reportesService.exportarCSV(params),
    onSuccess: () => {
      success('Reporte exportado exitosamente');
    },
    onError: (err: any) => {
      error(err.response?.data?.detail || 'Error al exportar reporte');
    },
  });
}
