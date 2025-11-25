/**
 * 📊 DASHBOARD PAGE - Vista Principal
 * 
 * Muestra métricas clave del negocio:
 * - Resumen del día/mes
 * - Ventas en tiempo real
 * - Gráficos y estadísticas
 * - Alertas e insights
 */

'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 🤖 Hooks generados por Orval
import {
  useGetApiV1DashboardResumen,
  useGetApiV1DashboardVentasTiempoReal,
  useGetApiV1Insights,
} from '@/api/generated/endpoints';

import { formatCurrency, formatNumber, calculatePercentageChange } from '@/lib/utils';

// ==================== METRIC CARD COMPONENT ====================

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}

function MetricCard({ title, value, change, icon: Icon, subtitle }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
        {change !== undefined && (
          <div className="flex items-center text-xs mt-2">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-1">vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== MAIN COMPONENT ====================

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<'hoy' | 'mes'>('hoy');

  // ==================== QUERIES ====================

  /**
   * 📊 Resumen de métricas
   */
  const {
    data: resumen,
    isLoading: isLoadingResumen,
    refetch: refetchResumen,
  } = useGetApiV1DashboardResumen(
    { periodo },
    {
      query: {
        refetchInterval: 60000, // Refetch cada 60 segundos
      },
    }
  );

  /**
   * ⚡ Ventas en tiempo real
   */
  const {
    data: ventasTiempoReal,
    isLoading: isLoadingTiempoReal,
  } = useGetApiV1DashboardVentasTiempoReal(
    { limite: 10 },
    {
      query: {
        refetchInterval: 10000, // Refetch cada 10 segundos
      },
    }
  );

  /**
   * 💡 Insights y alertas
   */
  const {
    data: insights,
    isLoading: isLoadingInsights,
  } = useGetApiV1Insights(
    { archivado: false },
    {
      query: {
        refetchInterval: 300000, // Refetch cada 5 minutos
      },
    }
  );

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    refetchResumen();
  };

  // ==================== RENDER ====================

  if (isLoadingResumen) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCcw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Vista general de tu negocio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
            <TabsList>
              <TabsTrigger value="hoy">Hoy</TabsTrigger>
              <TabsTrigger value="mes">Este Mes</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Insights/Alertas */}
      {insights && insights.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              Alertas e Insights ({insights.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg"
                >
                  <Badge
                    variant={
                      insight.urgencia === 'alta'
                        ? 'destructive'
                        : insight.urgencia === 'media'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {insight.urgencia}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{insight.titulo}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {insight.descripcion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ventas Totales"
          value={formatCurrency(resumen?.total_ventas || 0)}
          change={resumen?.cambio_ventas}
          icon={DollarSign}
          subtitle={`${resumen?.cantidad_ventas || 0} transacciones`}
        />
        <MetricCard
          title="Ticket Promedio"
          value={formatCurrency(resumen?.ticket_promedio || 0)}
          change={resumen?.cambio_ticket}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Productos Vendidos"
          value={formatNumber(resumen?.productos_vendidos || 0)}
          change={resumen?.cambio_productos}
          icon={Package}
        />
        <MetricCard
          title="Ganancia Bruta"
          value={formatCurrency(resumen?.ganancia_bruta || 0)}
          change={resumen?.cambio_ganancia}
          icon={TrendingUp}
        />
      </div>

      {/* Ventas en Tiempo Real */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCcw className="h-5 w-5 mr-2 text-green-600" />
            Ventas en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTiempoReal ? (
            <div className="text-center py-8 text-gray-500">
              Cargando ventas...
            </div>
          ) : ventasTiempoReal && ventasTiempoReal.length > 0 ? (
            <div className="space-y-3">
              {ventasTiempoReal.map((venta) => (
                <div
                  key={venta.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {venta.metodo_pago}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(venta.fecha).toLocaleTimeString('es-AR')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {venta.items.length} producto{venta.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatCurrency(venta.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay ventas recientes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribución por método de pago */}
      {resumen?.ventas_por_metodo && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(resumen.ventas_por_metodo).map(([metodo, datos]: any) => (
                <div key={metodo} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{metodo}</span>
                    <span className="text-gray-600">
                      {formatCurrency(datos.total)} ({datos.cantidad} ventas)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${(datos.total / (resumen.total_ventas || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
