/**
 * 📈 REPORTES Y ANALYTICS - Business Intelligence
 * 
 * Features:
 * - Gráficos interactivos con Recharts
 * - Date range picker para filtros
 * - Top productos más vendidos
 * - Análisis de rentabilidad
 * - Exportación a Excel/CSV
 */

'use client';

import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TrendingUp,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
} from 'lucide-react';
import {
  LineChart as RechartsLine,
  Line,
  BarChart as RechartsBar,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Hooks generados por Orval
import {
  useObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet,
  useObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet,
  useAnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet,
} from '@/api/generated/reportes/reportes';

import { formatCurrency } from '@/lib/utils';

// ==================== COLORS ====================
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

// ==================== SKELETON ====================
function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-lg animate-pulse">
      <BarChart3 className="h-16 w-16 text-slate-300" />
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<'7dias' | '30dias' | '90dias'>('30dias');

  // Calcular días
  const diasPeriodo = periodo === '7dias' ? 7 : periodo === '30dias' ? 30 : 90;

  // ==================== QUERIES ====================
  const {
    data: tendencia,
    isLoading: loadingTendencia,
  } = useObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet(
    { dias: diasPeriodo },
    {
      query: {
        refetchInterval: 300000, // 5 minutos
      },
    }
  );

  const {
    data: topProductos,
    isLoading: loadingTop,
  } = useObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet(
    { limite: 10 },
    {
      query: {
        refetchInterval: 300000,
      },
    }
  );

  const {
    data: rentabilidad,
    isLoading: loadingRentabilidad,
  } = useAnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet(
    {},
    {
      query: {
        refetchInterval: 300000,
      },
    }
  );

  // ==================== HANDLERS ====================
  const handleExportExcel = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/exportar/ventas/excel?dias=${diasPeriodo}`;
    window.open(url, '_blank');
  };

  const handleExportCSV = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/exportar/ventas/csv?dias=${diasPeriodo}`;
    window.open(url, '_blank');
  };

  // ==================== DATA PROCESSING ====================
  const tendenciaData = tendencia?.map((item: any) => ({
    fecha: format(new Date(item.fecha), 'dd/MM', { locale: es }),
    ventas: item.total_ventas,
    costos: item.total_costos,
    ganancia: item.ganancia,
  })) || [];

  const topProductosData = topProductos?.map((item: any) => ({
    nombre: item.nombre_producto.length > 20
      ? item.nombre_producto.substring(0, 20) + '...'
      : item.nombre_producto,
    cantidad: item.cantidad_vendida,
    ingresos: item.ingresos_totales,
  })) || [];

  const rentabilidadData = rentabilidad?.slice(0, 5).map((item: any) => ({
    nombre: item.nombre_producto,
    value: item.margen_porcentaje,
    ganancia: item.ganancia_total,
  })) || [];

  // ==================== STATS ====================
  const stats = {
    totalVentas: tendencia?.reduce((sum: number, item: any) => sum + item.total_ventas, 0) || 0,
    totalGanancia: tendencia?.reduce((sum: number, item: any) => sum + item.ganancia, 0) || 0,
    productosVendidos: topProductos?.reduce((sum: number, item: any) => sum + item.cantidad_vendida, 0) || 0,
    ticketPromedio: tendencia && tendencia.length > 0
      ? tendencia.reduce((sum: number, item: any) => sum + item.total_ventas, 0) / tendencia.length
      : 0,
  };

  // ==================== RENDER ====================
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reportes y Analytics</h1>
          <p className="text-slate-500 mt-1">Análisis completo de tu negocio</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Período */}
          <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7dias">Últimos 7 días</SelectItem>
              <SelectItem value="30dias">Últimos 30 días</SelectItem>
              <SelectItem value="90dias">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Buttons */}
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ventas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalVentas)}</div>
            <p className="text-xs text-slate-500 mt-1">Últimos {diasPeriodo} días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ganancia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalGanancia)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Margen bruto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Productos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productosVendidos}</div>
            <p className="text-xs text-slate-500 mt-1">Unidades totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Ticket Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ticketPromedio)}</div>
            <p className="text-xs text-slate-500 mt-1">Por transacción</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="tendencia" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tendencia" className="gap-2">
            <LineChart className="h-4 w-4" />
            Tendencia
          </TabsTrigger>
          <TabsTrigger value="productos" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Top Productos
          </TabsTrigger>
          <TabsTrigger value="rentabilidad" className="gap-2">
            <PieChart className="h-4 w-4" />
            Rentabilidad
          </TabsTrigger>
        </TabsList>

        {/* Tendencia de Ventas */}
        <TabsContent value="tendencia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Ventas vs Costos - Tendencia Diaria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTendencia ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsLine data={tendenciaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="fecha"
                      stroke="#64748b"
                      fontSize={12}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ventas"
                      name="Ventas"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="costos"
                      name="Costos"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ganancia"
                      name="Ganancia"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </RechartsLine>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Productos */}
        <TabsContent value="productos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top 10 Productos Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTop ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsBar data={topProductosData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="nombre"
                      stroke="#64748b"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any, name: string) =>
                        name === 'ingresos' ? formatCurrency(value) : value
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="cantidad"
                      name="Cantidad Vendida"
                      fill="#6366f1"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="ingresos"
                      name="Ingresos"
                      fill="#10b981"
                      radius={[8, 8, 0, 0]}
                    />
                  </RechartsBar>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rentabilidad */}
        <TabsContent value="rentabilidad">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Margen de Rentabilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRentabilidad ? (
                  <ChartSkeleton />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={rentabilidadData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nombre, value }) => `${nombre}: ${value.toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {rentabilidadData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                    </RechartsPie>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Ranking List */}
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Rentabilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rentabilidadData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <div className="font-medium text-sm">{item.nombre}</div>
                          <div className="text-xs text-slate-500">
                            Ganancia: {formatCurrency(item.ganancia)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {item.value.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
