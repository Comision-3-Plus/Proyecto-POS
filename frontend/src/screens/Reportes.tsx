/**
 * Reportes Screen - Analytics y Estadísticas
 * Conectado a API de reportes
 */

import { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import {
  useTopProductos,
  useTendenciaVentas,
  useExportarReporte,
} from '@/hooks/useReportesQuery';

type PeriodoType = 'hoy' | 'semana' | 'mes';

export default function Reportes() {
  const [periodo, setPeriodo] = useState<PeriodoType>('mes');
  
  // Temporalmente deshabilitado hasta que se actualice la DB
  const { data: topProductos = [], isLoading: loadingProductos } = useTopProductos({ limit: 10 });
  const { data: tendencia = [], isLoading: loadingTendencia } = useTendenciaVentas(30);
  
  // Datos mock mientras se actualiza
  const porCategoria: any[] = [];
  const porMetodoPago: any[] = [];
  const exportMutation = useExportarReporte();

  const handleExport = () => {
    exportMutation.mutate({ tipo: 'ventas', periodo });
  };

  // Calcular totales de tendencia
  const totalVentas = tendencia.reduce((sum, item) => sum + (item.total_ventas || 0), 0);
  const totalTransacciones = tendencia.reduce((sum, item) => sum + (item.cantidad_ventas || 0), 0);
  const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/30 via-white/10 to-gray-100/20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/85 backdrop-blur-2xl shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reportes y Análisis</h2>
              <p className="text-sm text-gray-500 mt-0.5">Insights de ventas y productos</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {(['hoy', 'semana', 'mes'] as PeriodoType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodo(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      periodo === p
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={handleExport} disabled={exportMutation.isPending}>
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalVentas.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Ventas (30 días)</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalTransacciones}</p>
                <p className="text-sm text-gray-500">Transacciones</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${ticketPromedio.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Ticket Promedio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tendencia de Ventas */}
        <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
          <h3 className="text-sm font-semibold mb-4">Tendencia de Ventas (Últimos 30 días)</h3>
          {loadingTendencia ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2">
              {tendencia.slice(-10).map((item) => (
                <div key={item.fecha} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{item.fecha}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{item.cantidad_ventas} ventas</span>
                    <span className="font-semibold text-gray-900">${item.total_ventas.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Productos */}
          <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
            <h3 className="text-sm font-semibold mb-4">Top 10 Productos</h3>
            {loadingProductos ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-2">
                {topProductos.map((producto: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{producto.nombre}</p>
                        <p className="text-xs text-gray-500">SKU: {producto.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${producto.total_recaudado?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{producto.cantidad_vendida} uds</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ventas por Categoría */}
          <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
            <h3 className="text-sm font-semibold mb-4">Ventas por Categoría</h3>
            <div className="space-y-3">
              {porCategoria.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                    <span className="text-sm font-semibold text-gray-900">${cat.total_ventas.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-cyan-500 h-2 rounded-full"
                      style={{ width: `${cat.porcentaje}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{cat.porcentaje.toFixed(1)}% del total</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ventas por Método de Pago */}
        <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
          <h3 className="text-sm font-semibold mb-4">Ventas por Método de Pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {porMetodoPago.map((metodo) => (
              <div key={metodo.metodo_pago} className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">{metodo.metodo_pago}</p>
                <p className="text-2xl font-bold text-gray-900">${metodo.total_ventas.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {metodo.cantidad_transacciones} transacciones · {metodo.porcentaje.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
