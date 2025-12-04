/**
 * Analytics Screen - Análisis Retail Avanzado
 * Insights de temporada, marcas, talles y colores
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  Palette,
  Ruler,
  ShoppingBag,
  AlertTriangle,
  BarChart3,
  PieChart,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import { Alert } from '@/components/ui/Alert';
import analyticsService from '@/services/analytics.service';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'temporada' | 'marcas' | 'talles' | 'colores'>('overview');

  // Queries
  const { data: seasonality } = useQuery({
    queryKey: ['analytics', 'seasonality'],
    queryFn: () => analyticsService.getSeasonality(),
  });

  const { data: brandPerformance } = useQuery({
    queryKey: ['analytics', 'brand-performance'],
    queryFn: () => analyticsService.getBrandPerformance(),
  });

  const { data: sizeDistribution } = useQuery({
    queryKey: ['analytics', 'size-distribution'],
    queryFn: () => analyticsService.getSizeDistribution(),
  });

  const { data: colorPreferences } = useQuery({
    queryKey: ['analytics', 'color-preferences'],
    queryFn: () => analyticsService.getColorPreferences(),
  });

  const { data: restockSuggestions } = useQuery({
    queryKey: ['analytics', 'restock-suggestions'],
    queryFn: () => analyticsService.getRestockSuggestions(),
  });

  const { data: inventoryHealth } = useQuery({
    queryKey: ['analytics', 'inventory-health'],
    queryFn: () => analyticsService.getInventoryHealth(),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary-600" />
          Analytics Retail
        </h1>
        <p className="text-gray-600 mt-1">
          Análisis avanzado de ventas por temporada, marcas, talles y colores
        </p>
      </div>

      {/* Inventory Health */}
      {inventoryHealth && (
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Salud del Inventario</h2>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-primary-100 text-sm">Total Variantes</p>
                  <p className="text-3xl font-bold">{inventoryHealth.total_variantes}</p>
                </div>
                <div>
                  <p className="text-primary-100 text-sm">En Stock</p>
                  <p className="text-3xl font-bold text-green-300">
                    {inventoryHealth.variantes_en_stock}
                  </p>
                </div>
                <div>
                  <p className="text-primary-100 text-sm">Sin Stock</p>
                  <p className="text-3xl font-bold text-red-300">
                    {inventoryHealth.variantes_sin_stock}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold">
                {inventoryHealth.porcentaje_salud}%
              </div>
              <p className="text-primary-100 mt-2">Nivel de Salud</p>
            </div>
          </div>
        </div>
      )}

      {/* Restock Suggestions */}
      {restockSuggestions && restockSuggestions.length > 0 && (
        <Alert variant="warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">Sugerencias de Reposición</p>
              <p className="text-sm mt-1">
                {restockSuggestions.length} productos necesitan reposición urgente
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'temporada', label: 'Temporada', icon: Package },
            { id: 'marcas', label: 'Marcas', icon: ShoppingBag },
            { id: 'talles', label: 'Talles', icon: Ruler },
            { id: 'colores', label: 'Colores', icon: Palette },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              restockSuggestions={restockSuggestions}
              inventoryHealth={inventoryHealth}
            />
          )}
          {activeTab === 'temporada' && <TemporadaTab data={seasonality} />}
          {activeTab === 'marcas' && <MarcasTab data={brandPerformance} />}
          {activeTab === 'talles' && <TallesTab data={sizeDistribution} />}
          {activeTab === 'colores' && <ColoresTab data={colorPreferences} />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ restockSuggestions, inventoryHealth }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Estado del Inventario
          </h3>
          {inventoryHealth && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total de Variantes</span>
                <span className="font-medium">{inventoryHealth.total_variantes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">En Stock</span>
                <span className="font-medium text-green-600">
                  {inventoryHealth.variantes_en_stock}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sin Stock</span>
                <span className="font-medium text-red-600">
                  {inventoryHealth.variantes_sin_stock}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock Bajo</span>
                <span className="font-medium text-yellow-600">
                  {inventoryHealth.variantes_bajo_stock}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Productos a Reponer ({restockSuggestions?.length || 0})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {restockSuggestions?.slice(0, 5).map((item: any) => (
              <div key={item.variant_id} className="text-sm">
                <div className="font-medium text-gray-900">{item.product_name}</div>
                <div className="text-gray-600">
                  {item.size_name} - {item.color_name}
                </div>
                <div className="text-red-600">
                  Stock: {item.stock_actual} | Sugerido: {item.cantidad_sugerida}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Temporada Tab
function TemporadaTab({ data }: any) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No hay datos de temporada</div>;
  }

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="season" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Legend />
          <Bar dataKey="total_ventas" fill="#3B82F6" name="Ventas" />
          <Bar dataKey="cantidad_vendida" fill="#10B981" name="Unidades" />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((item: any, index: number) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900">{item.season}</h4>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ventas</span>
                <span className="font-medium">{formatCurrency(item.total_ventas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Productos Vendidos</span>
                <span className="font-medium">{item.productos_vendidos}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Marcas Tab
function MarcasTab({ data }: any) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No hay datos de marcas</div>;
  }

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="brand" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Legend />
          <Bar dataKey="total_ventas" fill="#8B5CF6" name="Ventas" />
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Marca
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Ventas
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Unidades
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Margen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.brand}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatCurrency(item.total_ventas)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {formatNumber(item.cantidad_vendida)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                  {formatPercent(item.margen_promedio / 100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Talles Tab
function TallesTab({ data }: any) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No hay datos de talles</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <ResponsiveContainer width="100%" height={300}>
          <RePieChart>
            <Pie
              data={data}
              dataKey="cantidad_vendida"
              nameKey="size_name"
              cx="50%"
              cy="50%"
              label
            >
              {data.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RePieChart>
        </ResponsiveContainer>

        <div className="space-y-2">
          {data.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium text-gray-900">{item.size_name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatNumber(item.cantidad_vendida)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatPercent(item.porcentaje / 100)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Colores Tab
function ColoresTab({ data }: any) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No hay datos de colores</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item: any, index: number) => (
          <motion.div
            key={index}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: item.hex_code || '#ccc' }}
              />
              <div>
                <h4 className="font-semibold text-gray-900">{item.color_name}</h4>
                <p className="text-sm text-gray-500">{item.hex_code}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unidades Vendidas</span>
                <span className="font-medium">{formatNumber(item.cantidad_vendida)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Porcentaje</span>
                <span className="font-medium text-primary-600">
                  {formatPercent(item.porcentaje / 100)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
