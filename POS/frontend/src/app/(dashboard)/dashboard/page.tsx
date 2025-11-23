"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, AlertTriangle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import dynamic from "next/dynamic";

// ⚡ LAZY LOAD: Recharts es pesado (100kb+), cargarlo solo cuando se necesita
const LazyChart = dynamic(
  () => import("@/components/dashboard/sales-chart"),
  { 
    loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />,
    ssr: false // No renderizar en servidor (charts son solo cliente)
  }
);

export default function DashboardPage() {
  const { metrics, insights, isLoading, isFetching } = useDashboard();

  // ⚡ OPTIMIZACIÓN: Solo mostrar skeleton si NO hay datos en cache (primera carga)
  // Si hay datos, renderizar inmediatamente aunque esté fetching
  const shouldShowSkeleton = isLoading && !metrics;

  if (shouldShowSkeleton) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Resumen de tu tienda</p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
            Actualizando...
          </div>
        )}
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ventas de Hoy
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(metrics?.ventas_hoy || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              +12% vs. ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tickets Emitidos
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.tickets_emitidos || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stock Bajo
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.productos_bajo_stock || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Productos con menos de 10 unidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ventas Últimos 7 Días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <LazyChart data={metrics?.ventas_semana || []} />
          </div>
        </CardContent>
      </Card>

      {/* Insights de IA */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Insights & Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay insights disponibles
              </p>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${
                    insight.nivel_urgencia === "CRITICA"
                      ? "bg-red-50 border-red-200"
                      : insight.nivel_urgencia === "ALTA"
                      ? "bg-amber-50 border-amber-200"
                      : insight.nivel_urgencia === "MEDIA"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <p className="text-sm font-medium">{insight.mensaje}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(insight.created_at).toLocaleDateString("es-AR", {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
