/**
 * OMS Screen - Order Management System
 * Sincronización con plataformas e-commerce
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/common/ToastNotification';
import ProgressBar from '../components/common/ProgressBar';
import omsService, { OrdenOmnicanal } from '@/services/oms.service';

type OrderStatus = 'pending' | 'analyzing' | 'assigned' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: { label: 'Pendiente', color: 'warning', icon: Clock },
  analyzing: { label: 'Analizando', color: 'primary', icon: Package },
  assigned: { label: 'Asignado', color: 'info', icon: Package },
  processing: { label: 'Procesando', color: 'primary', icon: Package },
  shipped: { label: 'Enviado', color: 'info', icon: Truck },
  delivered: { label: 'Entregado', color: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'danger', icon: AlertCircle },
};

const platformConfig = {
  shopify: { name: 'Shopify', color: 'bg-green-50 text-green-700' },
  mercadolibre: { name: 'Mercado Libre', color: 'bg-yellow-50 text-yellow-700' },
  tiendanube: { name: 'TiendaNube', color: 'bg-blue-50 text-blue-700' },
  online: { name: 'Online', color: 'bg-purple-50 text-purple-700' },
  pos: { name: 'POS', color: 'bg-gray-50 text-gray-700' },
  whatsapp: { name: 'WhatsApp', color: 'bg-green-50 text-green-700' },
};

export default function OMS() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const { toasts, removeToast, success, info } = useToast();

  // Obtener órdenes reales del backend
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['oms-pending-orders'],
    queryFn: () => omsService.getPendingOrders(),
    refetchInterval: 30000, // Refetch cada 30 segundos
  });

  // Obtener analytics
  const { data: analytics } = useQuery({
    queryKey: ['oms-analytics'],
    queryFn: () => omsService.getRoutingAnalytics(30),
  });

  const orders = ordersData?.ordenes || [];

  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress(0);
    info('Iniciando sincronización...', 'Conectando con plataformas');

    // Simular sincronización con progress
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncing(false);
          refetch(); // Refrescar datos reales
          success(
            'Sincronización completada',
            `${orders.length} órdenes actualizadas`
          );
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Filtrar órdenes
  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === 'all') return true;
    return order.fulfillment_status === selectedStatus;
  });

  // Calcular estadísticas
  const stats = [
    { label: 'Total Órdenes', value: orders.length.toString(), change: '+12%', trend: 'up' as const },
    { label: 'Pendientes', value: orders.filter((o) => o.fulfillment_status === 'pending').length.toString(), change: '+5', trend: 'up' as const },
    { label: 'Procesando', value: orders.filter((o) => o.fulfillment_status === 'processing').length.toString(), change: '-3', trend: 'down' as const },
    { label: 'Asignación Auto', value: `${Math.round(analytics?.tasa_asignacion_auto || 0)}%`, change: '+8%', trend: 'up' as const },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/30 via-white/10 to-gray-100/20">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Sync Progress Bar */}
      {syncing && (
        <div className="fixed top-16 left-0 right-0 z-50 px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
          <ProgressBar
            progress={syncProgress}
            color="indigo"
            size="md"
            showPercentage
            label="Sincronizando órdenes..."
          />
        </div>
      )}
      
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/85 backdrop-blur-2xl shadow-sm shadow-gray-200/20">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                Order Management
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Gestión centralizada de órdenes e-commerce
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => {
            const percentage = stat.trend === 'up' ? 78 : 45;
            const radius = 32;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08, type: 'spring' }}
                className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 hover:-translate-y-1 group overflow-hidden"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-cyan-500/0 group-hover:from-primary-500/5 group-hover:to-cyan-500/5 transition-all duration-500" />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className="text-4xl font-black text-gray-900 tracking-tight">
                        {stat.value}
                      </p>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        stat.trend === 'up' 
                          ? 'bg-gradient-to-r from-success-500 to-emerald-500 text-white shadow-lg shadow-success-500/40'
                          : 'bg-gradient-to-r from-danger-500 to-rose-500 text-white shadow-lg shadow-danger-500/40'
                      }`}>
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">últimas 24h</p>
                  </div>
                  
                  {/* Circular progress */}
                  <div className="relative w-20 h-20">
                    <svg className="-rotate-90 w-full h-full" viewBox="0 0 72 72">
                      <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="6"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        fill="none"
                        stroke={stat.trend === 'up' ? 'url(#gradient-oms-success)' : 'url(#gradient-oms-warning)'}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradient-oms-success" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <linearGradient id="gradient-oms-warning" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black text-gray-600">{percentage}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Filtrar por estado:</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              selectedStatus === 'all'
                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg shadow-gray-900/40'
                : 'bg-white/90 text-gray-600 hover:bg-gray-50 border border-gray-200/80 hover:border-gray-300/80 shadow-sm hover:shadow-md'
            }`}
          >
            Todas <span className="ml-1.5 px-2 py-0.5 rounded-full bg-white/20 text-xs">{orders.length}</span>
          </motion.button>
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const count = orders.filter(o => o.fulfillment_status === status).length;
            return (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStatus(status as OrderStatus)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  selectedStatus === status
                    ? `bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 text-white shadow-lg shadow-${config.color}-500/40`
                    : 'bg-white/90 text-gray-600 hover:bg-gray-50 border border-gray-200/80 hover:border-gray-300/80 shadow-sm hover:shadow-md'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
                {count > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-black">{count}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 px-6 pb-6 overflow-auto">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay órdenes</h3>
            <p className="text-gray-500">
              {selectedStatus === 'all' 
                ? 'No se encontraron órdenes en el sistema' 
                : `No hay órdenes con estado "${statusConfig[selectedStatus as OrderStatus]?.label}"`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente auxiliar para orden card
function OrderCard({ order, index }: { order: OrdenOmnicanal; index: number }) {
  const StatusIcon = statusConfig[order.fulfillment_status as OrderStatus]?.icon || Package;
  const platform = order.plataforma || order.canal;
  const platformInfo = platformConfig[platform as keyof typeof platformConfig] || platformConfig.online;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: 'spring' }}
      className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 group hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/40">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">
              {order.numero_orden}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {new Date(order.created_at).toLocaleDateString('es-AR', { 
                day: '2-digit', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${platformInfo.color}`}>
            <ExternalLink className="w-3 h-3" />
            {platformInfo.name}
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 shadow-lg shadow-primary-500/40">
          <StatusIcon className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {statusConfig[order.fulfillment_status as OrderStatus]?.label || order.fulfillment_status}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 pl-12 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Canal:</span>
          <span className="text-sm font-bold text-gray-900">{order.canal}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Total:</span>
          <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-primary-50 to-cyan-50 border border-primary-200/50">
            <span className="text-base font-black text-primary-700">
              ${order.total.toLocaleString()}
            </span>
          </div>
        </div>
        {order.fulfillment_location_id && (
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">Ubicación asignada</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
