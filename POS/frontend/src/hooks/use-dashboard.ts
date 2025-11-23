"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardMetrics, Insight } from "@/types";
import { apiClient } from "@/lib/api-client";

// Backend response structure (nested)
interface BackendDashboardResponse {
  ventas: {
    hoy: number;
    ayer: number;
    semana: number;
    mes: number;
    tickets_emitidos: number;
    cambio_diario_porcentaje: number;
    cambio_semanal_porcentaje: number;
    ultimos_7_dias: Array<{ fecha: string; total: number }>;
  };
  inventario: {
    total_productos: number;
    productos_activos: number;
    productos_bajo_stock: number;
    valor_total_inventario: number;
  };
  productos_destacados: Array<{
    id: string;
    nombre: string;
    sku: string;
    stock: number;
    ventas_hoy: number;
  }>;
  alertas_criticas: number;
  ultima_actualizacion: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  insights: Insight[];
}

export function useDashboard() {
  // ⚡ OPTIMIZACIÓN: UN SOLO REQUEST para obtener metrics + insights juntos
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["dashboard", "all"],
    queryFn: async () => {
      // Hacer ambas requests en paralelo (más rápido que secuencial)
      const [backendMetrics, insights] = await Promise.all([
        apiClient.get<BackendDashboardResponse>("/api/v1/dashboard/resumen"),
        apiClient.get<Insight[]>("/api/v1/insights"),
      ]);
      
      // Transform nested backend response to flat frontend structure
      const transformedMetrics: DashboardMetrics = {
        ventas_hoy: backendMetrics.ventas.hoy,
        tickets_emitidos: backendMetrics.ventas.tickets_emitidos,
        productos_bajo_stock: backendMetrics.inventario.productos_bajo_stock,
        ventas_semana: backendMetrics.ventas.ultimos_7_dias,
      };
      
      return { metrics: transformedMetrics, insights } as DashboardData;
    },
    staleTime: 60000, // ⚡ Datos válidos por 60s
    gcTime: 600000, // ⚡ Cache 10 minutos
    refetchInterval: 120000, // ⚡ Refetch cada 2 minutos
    placeholderData: (previousData) => previousData, // ⚡ Mantener datos anteriores
    retry: false, // ⚡ NO reintentar (evita bloqueo)
  });

  return {
    metrics: data?.metrics,
    insights: data?.insights || [],
    isLoading,
    isFetching,
    error,
  };
}

