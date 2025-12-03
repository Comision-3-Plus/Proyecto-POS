/**
 * Dashboard Screen - Ultra Profesional & Moderno
 * Overview completo del sistema con métricas avanzadas
 */

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Plus,
  Zap,
  ShoppingBag,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { Alert } from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';

interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: typeof TrendingUp;
  description: string;
  color: 'primary' | 'success' | 'warning' | 'accent';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

const quickActions = [
  { label: 'Nueva Venta', icon: ShoppingCart, color: 'bg-primary-500', href: '/ventas' },
  { label: 'Nuevo Producto', icon: Package, color: 'bg-accent-500', href: '/productos' },
  { label: 'Ver Reportes', icon: Activity, color: 'bg-success-500', href: '/reportes' },
  { label: 'Gestionar Stock', icon: TrendingUp, color: 'bg-warning-500', href: '/stock' },
];

const recentActivity = [
  {
    id: 1,
    type: 'sale' as const,
    description: 'Venta completada',
    amount: 'Procesando...',
    time: 'En tiempo real',
    customer: null,
  },
];

export default function Dashboard() {
  const { data: dashboardData, isLoading, error, refetch } = useDashboardQuery();

  // Mostrar spinner mientras carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-600 mt-4">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si falla
  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Alert variant="danger" className="max-w-md">
          <p className="font-bold">Error al cargar dashboard</p>
          <p className="text-sm mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
          <Button variant="primary" size="sm" onClick={() => refetch()} className="mt-3">
            Reintentar
          </Button>
        </Alert>
      </div>
    );
  }

  // Preparar stats con datos reales
  const stats: StatCard[] = [
    {
      label: 'Ventas del Día',
      value: `$${dashboardData.ventas.hoy.toLocaleString()}`,
      change: `${dashboardData.ventas.cambio_diario_porcentaje > 0 ? '+' : ''}${dashboardData.ventas.cambio_diario_porcentaje.toFixed(1)}%`,
      trend: dashboardData.ventas.cambio_diario_porcentaje >= 0 ? 'up' : 'down',
      icon: DollarSign,
      description: `vs ayer $${dashboardData.ventas.ayer.toLocaleString()}`,
      color: 'success',
    },
    {
      label: 'Transacciones',
      value: dashboardData.ventas.tickets_emitidos.toString(),
      change: `${dashboardData.ventas.cambio_diario_porcentaje > 0 ? '+' : ''}${Math.abs(dashboardData.ventas.cambio_diario_porcentaje).toFixed(1)}%`,
      trend: dashboardData.ventas.cambio_diario_porcentaje >= 0 ? 'up' : 'down',
      icon: ShoppingBag,
      description: `${dashboardData.ventas.tickets_emitidos > 0 ? (dashboardData.ventas.hoy / dashboardData.ventas.tickets_emitidos).toFixed(0) : '0'} promedio/ticket`,
      color: 'primary',
    },
    {
      label: 'Ticket Promedio',
      value: `$${dashboardData.ventas.tickets_emitidos > 0 ? (dashboardData.ventas.hoy / dashboardData.ventas.tickets_emitidos).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}`,
      change: `${dashboardData.ventas.cambio_semanal_porcentaje > 0 ? '+' : ''}${dashboardData.ventas.cambio_semanal_porcentaje.toFixed(1)}%`,
      trend: dashboardData.ventas.cambio_semanal_porcentaje >= 0 ? 'up' : 'down',
      icon: TrendingUp,
      description: 'Esta semana',
      color: 'accent',
    },
    {
      label: 'Productos Activos',
      value: dashboardData.inventario.productos_activos.toString(),
      change: `${dashboardData.inventario.productos_bajo_stock} bajo stock`,
      trend: 'up',
      icon: Package,
      description: `Total: ${dashboardData.inventario.total_productos}`,
      color: 'warning',
    },
  ];

  // Datos para sparklines de últimos 7 días
  const salesData = dashboardData.ventas.ultimos_7_dias.map((d, i) => ({
    time: i + 1,
    value: d.total,
  }));

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50/30 via-white/10 to-gray-100/20">
      {/* Header */}
      <div className="border-b border-gray-200/50 bg-white/85 backdrop-blur-2xl sticky top-0 z-10 shadow-sm shadow-gray-200/20">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-gray-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Overview del sistema • Última actualización: hace 2 min
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                <Download className="w-3.5 h-3.5" />
                Exportar
              </Button>
              <Button variant="primary" size="sm">
                <Plus className="w-3.5 h-3.5" />
                Nueva Venta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Stats Grid con Sparklines */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => {
              const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
              const colorClasses = {
                primary: 'from-primary-500 to-primary-600',
                success: 'from-success-500 to-success-600',
                warning: 'from-warning-500 to-warning-600',
                accent: 'from-accent-500 to-accent-600',
              };
              
              // Usar datos reales de sparkline
              const sparklineData = index === 0 ? salesData : 
                                   index === 1 ? salesData.map(d => ({ value: Math.max(1, Math.floor(d.value / 2000)) })) :
                                   index === 2 ? salesData.map(d => ({ value: Math.max(1000, d.value / (dashboardData.ventas.tickets_emitidos || 1)) })) :
                                   salesData.map(d => ({ value: Math.max(10, Math.floor(d.value / 1000)) }));
              
              const sparklineColor = stat.color === 'success' ? '#10b981' :
                                    stat.color === 'primary' ? '#0ea5e9' :
                                    stat.color === 'accent' ? '#8b5cf6' :
                                    '#f59e0b';

              return (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 hover:shadow-2xl hover:shadow-gray-300/40 transition-all duration-500 group cursor-pointer"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[stat.color]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]} shadow-lg shadow-${stat.color}-500/30`}>
                        <stat.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                        stat.trend === 'up' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
                      }`}>
                        <TrendIcon className="w-3.5 h-3.5" strokeWidth={3} />
                        <span className="text-xs font-bold">{stat.change}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-black text-gray-900 tracking-tight">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        {stat.description}
                      </p>
                    </div>
                    
                    {/* Sparkline */}
                    <div className="mt-4 h-12 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={sparklineColor}
                            strokeWidth={2.5}
                            dot={false}
                            animationDuration={1000}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions - Rediseñado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-xl shadow-gray-200/30 hover:shadow-2xl transition-all duration-500"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
                  <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Acciones Rápidas</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, i) => (
                  <motion.button
                    key={action.label}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="group relative overflow-hidden flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200/50 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-accent-50/0 group-hover:from-primary-50/50 group-hover:to-accent-50/30 transition-all duration-500" />
                    <div className={`relative z-10 p-3 rounded-xl ${action.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="relative z-10 text-xs font-bold text-gray-700 group-hover:text-gray-900 text-center transition-colors">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* AFIP Status / Alertas - Rediseñado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-xl shadow-gray-200/30 hover:shadow-2xl transition-all duration-500"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl ${dashboardData.alertas_criticas > 0 ? 'bg-gradient-to-br from-warning-500 to-orange-600 shadow-lg shadow-warning-500/30' : 'bg-gradient-to-br from-success-500 to-emerald-600 shadow-lg shadow-success-500/30'}`}>
                  <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Estado del Sistema</h3>
              </div>
              <div className="space-y-4">
                {dashboardData.alertas_criticas > 0 ? (
                  <div className="relative overflow-hidden flex items-center gap-4 p-4 bg-gradient-to-br from-warning-50 via-orange-50 to-yellow-50 rounded-xl border border-warning-200 shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-warning-400/10 to-orange-400/10 animate-pulse" />
                    <div className="relative z-10 p-2.5 rounded-xl bg-gradient-to-br from-warning-500 to-orange-600 shadow-lg">
                      <AlertCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10 flex-1">
                      <p className="text-sm font-bold text-warning-900">
                        {dashboardData.alertas_criticas} Alerta{dashboardData.alertas_criticas !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-warning-700 mt-0.5">
                        Productos con stock crítico
                      </p>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning-500 animate-ping absolute" />
                      <div className="w-3 h-3 rounded-full bg-warning-500" />
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden flex items-center gap-4 p-4 bg-gradient-to-br from-success-50 via-emerald-50 to-green-50 rounded-xl border border-success-200 shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-success-400/10 to-emerald-400/10 animate-pulse" />
                    <div className="relative z-10 p-2.5 rounded-xl bg-gradient-to-br from-success-500 to-emerald-600 shadow-lg">
                      <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10 flex-1">
                      <p className="text-sm font-bold text-success-900">Operativo</p>
                      <p className="text-xs text-success-700 mt-0.5">
                        Sistema funcionando correctamente
                      </p>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success-500 animate-ping absolute" />
                      <div className="w-3 h-3 rounded-full bg-success-500" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Productos activos</span>
                    <span className="font-semibold text-gray-900">{dashboardData.inventario.productos_activos}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Valor inventario</span>
                    <span className="font-semibold text-gray-900">
                      ${dashboardData.inventario.valor_total_inventario.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Ventas del mes</span>
                    <span className="font-semibold text-gray-900">
                      ${dashboardData.ventas.mes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top Products - Rediseñado con datos reales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-xl shadow-gray-200/30 hover:shadow-2xl transition-all duration-500"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent-500 to-cyan-600 shadow-lg shadow-accent-500/30">
                  <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Top Productos</h3>
              </div>
              <div className="space-y-3">
                {dashboardData.productos_destacados.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay ventas registradas hoy
                  </p>
                ) : (
                  dashboardData.productos_destacados.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                      whileHover={{ x: 4, scale: 1.02 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 border border-gray-200/50 hover:border-gray-300 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex-shrink-0 relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                          <span className="text-sm font-black text-gray-700">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-success-500 shadow-lg">
                          <ArrowUpRight className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                          {product.nombre}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {product.ventas_hoy} vendidos • Stock: {product.stock}
                        </p>
                      </div>
                      <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-success-50 border border-success-200">
                        <span className="text-xs font-bold text-success-700">Top {index + 1}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity - Rediseñado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-xl shadow-gray-200/30 hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
                  <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Actividad Reciente</h3>
              </div>
              <button className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 hover:border-primary-300 transition-all duration-300">
                Ver todo
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
              </button>
            </div>
            <div className="relative space-y-4">
              {/* Timeline line */}
              <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-200 via-gray-100 to-transparent" />
              
              {recentActivity.map((activity, index) => {
                const activityConfig = {
                  sale: {
                    icon: ShoppingCart,
                    gradient: 'from-success-500 to-emerald-600',
                    bg: 'bg-success-50',
                    border: 'border-success-200',
                  },
                  product: {
                    icon: AlertCircle,
                    gradient: 'from-warning-500 to-orange-600',
                    bg: 'bg-warning-50',
                    border: 'border-warning-200',
                  },
                  order: {
                    icon: Package,
                    gradient: 'from-primary-500 to-primary-600',
                    bg: 'bg-primary-50',
                    border: 'border-primary-200',
                  },
                };

                const config = activityConfig[activity.type];

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="relative flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300 cursor-pointer group"
                  >
                    <div className={`relative z-10 p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <config.icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {activity.description}
                        </p>
                        <span className="flex-shrink-0 text-sm font-black text-gray-900 px-2.5 py-1 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                          {activity.amount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.customer && (
                          <span className="text-xs font-medium text-gray-600">
                            {activity.customer}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-medium text-gray-400">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
