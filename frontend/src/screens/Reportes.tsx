/**
 * Reportes Screen - Dashboards Analíticos con Recharts
 * Métricas de ventas, gráficos avanzados y exportación
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Button from '@/components/ui/Button';

type Period = 'today' | 'week' | 'month' | 'year';

export default function Reportes() {
  const [period, setPeriod] = useState<Period>('month');

  // Datos para el gráfico de área (evolución de ventas)
  const salesData = [
    { name: 'Ene', ventas: 2400000, clientes: 240, transacciones: 389 },
    { name: 'Feb', ventas: 1980000, clientes: 198, transacciones: 321 },
    { name: 'Mar', ventas: 2800000, clientes: 280, transacciones: 456 },
    { name: 'Abr', ventas: 3200000, clientes: 320, transacciones: 521 },
    { name: 'May', ventas: 2890000, clientes: 289, transacciones: 472 },
    { name: 'Jun', ventas: 3590000, clientes: 359, transacciones: 585 },
    { name: 'Jul', ventas: 4100000, clientes: 410, transacciones: 668 },
    { name: 'Ago', ventas: 3780000, clientes: 378, transacciones: 615 },
    { name: 'Sep', ventas: 4350000, clientes: 435, transacciones: 708 },
    { name: 'Oct', ventas: 4820000, clientes: 482, transacciones: 785 },
    { name: 'Nov', ventas: 5120000, clientes: 512, transacciones: 834 },
    { name: 'Dic', ventas: 5890000, clientes: 589, transacciones: 960 },
  ];

  // Datos para gráfico de barras (top products)
  const topProductsData = [
    { name: 'Laptop Dell XPS', sold: 45, revenue: 56.25 },
    { name: 'iPhone 15 Pro', sold: 38, revenue: 47.5 },
    { name: 'Mouse Logitech', sold: 127, revenue: 1.59 },
    { name: 'Teclado Mecánico', sold: 92, revenue: 2.3 },
    { name: 'Monitor LG 27"', sold: 34, revenue: 10.2 },
  ];

  // Datos para gráfico de pie (canales)
  const channelsData = [
    { name: 'Tienda Física', value: 45, amount: 1080000 },
    { name: 'E-commerce', value: 32, amount: 768000 },
    { name: 'Marketplace', value: 23, amount: 552000 },
  ];

  const COLORS = ['#0ea5e9', '#06b6d4', '#8b5cf6'];

  const stats = [
    {
      label: 'Ventas Totales',
      value: '$2.4M',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'success',
    },
    {
      label: 'Transacciones',
      value: '1,847',
      change: '+8.2%',
      trend: 'up' as const,
      icon: ShoppingBag,
      color: 'primary',
    },
    {
      label: 'Clientes Nuevos',
      value: '284',
      change: '-2.4%',
      trend: 'down' as const,
      icon: Users,
      color: 'warning',
    },
    {
      label: 'Ticket Promedio',
      value: '$1,299',
      change: '+5.1%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'info',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/30 via-white/10 to-gray-100/20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/85 backdrop-blur-2xl shadow-sm shadow-gray-200/20">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                Reportes y Analíticas
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Métricas de rendimiento y análisis de ventas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
              <Button variant="primary" size="sm">
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-white/95 to-gray-50/50 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 mr-3">Período:</span>
          {(['today', 'week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {p === 'today'
                ? 'Hoy'
                : p === 'week'
                ? 'Semana'
                : p === 'month'
                ? 'Mes'
                : 'Año'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stats Grid */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const TrendIcon =
                stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;

              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <TrendIcon
                          className={`w-3.5 h-3.5 ${
                            stat.trend === 'up'
                              ? 'text-success-600'
                              : 'text-danger-600'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            stat.trend === 'up'
                              ? 'text-success-600'
                              : 'text-danger-600'
                          }`}
                        >
                          {stat.change}
                        </span>
                        <span className="text-xs text-gray-400">vs período anterior</span>
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg bg-${stat.color}-50`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products con BarChart */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-2xl shadow-gray-200/30 hover:shadow-2xl hover:shadow-primary-500/10 transition-all">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-gray-900">
                  Productos Más Vendidos
                </h3>
                <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-primary-50 to-cyan-50 border border-primary-200/50">
                  <span className="text-xs font-bold text-primary-700">Top 5</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '11px', fontWeight: 600 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    style={{ fontSize: '11px', fontWeight: 600 }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                    labelStyle={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}
                    formatter={(value: number) => [`$${value}M`, 'Revenue']}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="url(#colorRevenue)" 
                    radius={[0, 8, 8, 0]}
                    animationDuration={1000}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sales by Channel con PieChart */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-2xl shadow-gray-200/30 hover:shadow-2xl hover:shadow-primary-500/10 transition-all">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-gray-900">
                  Ventas por Canal
                </h3>
                <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-success-50 to-emerald-50 border border-success-200/50">
                  <span className="text-xs font-bold text-success-700">100%</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {channelsData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Porcentaje']}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend manual */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {channelsData.map((channel, index) => (
                  <div key={channel.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{channel.value}%</p>
                      <p className="text-[10px] text-gray-500">{channel.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Chart con AreaChart */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 lg:col-span-2 shadow-2xl shadow-gray-200/30 hover:shadow-2xl hover:shadow-primary-500/10 transition-all">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-gray-900">
                  Evolución de Ventas {period === 'year' ? '2024' : ''}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600" />
                    <span className="text-xs font-semibold text-gray-600">Ventas</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600" />
                    <span className="text-xs font-semibold text-gray-600">Transacciones</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart 
                  data={salesData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorTransacciones" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    style={{ fontSize: '11px', fontWeight: 600 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    style={{ fontSize: '11px', fontWeight: 600 }}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                    labelStyle={{ fontWeight: 700, color: '#111827', marginBottom: '8px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'ventas') {
                        return [`$${(value / 1000000).toFixed(2)}M`, 'Ventas'];
                      }
                      return [value, name === 'transacciones' ? 'Transacciones' : name];
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="#0ea5e9" 
                    strokeWidth={3}
                    fill="url(#colorVentas)" 
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="transacciones" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    fill="url(#colorTransacciones)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
