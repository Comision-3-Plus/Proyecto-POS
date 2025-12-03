/**
 * OMS Screen - Order Management System
 * Sincronización con plataformas e-commerce
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
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

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: number;
  order_number: string;
  platform: 'shopify' | 'mercadolibre' | 'tiendanube';
  customer: string;
  items: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  tracking?: string;
}

const mockOrders: Order[] = [
  {
    id: 1,
    order_number: 'SHP-2024-001',
    platform: 'shopify',
    customer: 'Juan Pérez',
    items: 3,
    total: 45000,
    status: 'processing',
    created_at: '2024-01-15T10:30:00',
  },
  {
    id: 2,
    order_number: 'ML-2024-002',
    platform: 'mercadolibre',
    customer: 'María García',
    items: 1,
    total: 12500,
    status: 'shipped',
    created_at: '2024-01-15T09:15:00',
    tracking: 'AR123456789',
  },
];

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: { label: 'Pendiente', color: 'warning', icon: Clock },
  processing: { label: 'Procesando', color: 'primary', icon: Package },
  shipped: { label: 'Enviado', color: 'info', icon: Truck },
  delivered: { label: 'Entregado', color: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'danger', icon: AlertCircle },
};

const platformConfig = {
  shopify: { name: 'Shopify', color: 'bg-green-50 text-green-700' },
  mercadolibre: { name: 'Mercado Libre', color: 'bg-yellow-50 text-yellow-700' },
  tiendanube: { name: 'TiendaNube', color: 'bg-blue-50 text-blue-700' },
};

export default function OMS() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const { toasts, removeToast, success, info } = useToast();

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
          success(
            'Sincronización completada',
            '47 órdenes actualizadas desde Shopify, Mercado Libre y TiendaNube'
          );
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const stats = [
    { label: 'Órdenes Hoy', value: '47', change: '+12%', trend: 'up' as const },
    { label: 'En Proceso', value: '23', change: '+5', trend: 'up' as const },
    { label: 'Enviadas', value: '18', change: '-3', trend: 'down' as const },
    { label: 'Entregadas', value: '156', change: '+28', trend: 'up' as const },
  ];

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
            Todas <span className="ml-1.5 px-2 py-0.5 rounded-full bg-white/20 text-xs">{mockOrders.length}</span>
          </motion.button>
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const count = mockOrders.filter(o => o.status === status).length;
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
        <div className="space-y-4">
          {mockOrders.map((order, index) => {
            const StatusIcon = statusConfig[order.status].icon;
            
            // Calcular progress del fulfillment
            const statusProgress: Record<OrderStatus, number> = {
              pending: 20,
              processing: 40,
              shipped: 70,
              delivered: 100,
              cancelled: 0
            };
            const progress = statusProgress[order.status];

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, type: 'spring' }}
                className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 group hover:-translate-y-1 overflow-hidden"
              >
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-cyan-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Order number con badge premium */}
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/40">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-gray-900 tracking-tight">
                            {order.order_number}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            {new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Platform badge con icono */}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${
                        order.platform === 'shopify' ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50' :
                        order.platform === 'mercadolibre' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200/50' :
                        'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200/50'
                      }`}>
                        <ExternalLink className="w-3 h-3" />
                        {platformConfig[order.platform].name}
                      </div>
                    </div>
                    
                    {/* Status badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r shadow-lg ${
                      order.status === 'pending' ? 'from-warning-500 to-amber-500 shadow-warning-500/40' :
                      order.status === 'processing' ? 'from-primary-500 to-cyan-500 shadow-primary-500/40' :
                      order.status === 'shipped' ? 'from-blue-500 to-indigo-500 shadow-blue-500/40' :
                      order.status === 'delivered' ? 'from-success-500 to-emerald-500 shadow-success-500/40' :
                      'from-danger-500 to-rose-500 shadow-danger-500/40'
                    }`}>
                      <StatusIcon className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {statusConfig[order.status].label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Order details */}
                  <div className="flex items-center gap-6 pl-12">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Cliente:</span>
                      <span className="text-sm font-bold text-gray-900">{order.customer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Items:</span>
                      <div className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200">
                        <span className="text-sm font-black text-gray-900">{order.items}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Total:</span>
                      <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-primary-50 to-cyan-50 border border-primary-200/50">
                        <span className="text-base font-black text-primary-700">
                          ${order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {order.tracking && (
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-gray-400" />
                        <code className="text-xs bg-gray-900 text-white px-3 py-1 rounded-lg font-mono font-bold shadow-sm">
                          {order.tracking}
                        </code>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress bar de fulfillment */}
                  {order.status !== 'cancelled' && (
                    <div className="pl-12 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Progreso de fulfillment</span>
                        <span className="font-bold text-gray-900">{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-full bg-gradient-to-r rounded-full shadow-sm ${
                            order.status === 'delivered' ? 'from-success-500 to-emerald-500' :
                            order.status === 'shipped' ? 'from-blue-500 to-indigo-500' :
                            'from-primary-500 to-cyan-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Timeline horizontal de estados */}
                  <div className="pl-12 pt-2">
                    <div className="flex items-center gap-3">
                      {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                        const isCompleted = statusProgress[order.status] >= statusProgress[step as OrderStatus];
                        const isCurrent = order.status === step;
                        const StepIcon = statusConfig[step as OrderStatus].icon;
                        
                        return (
                          <div key={step} className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-success-500 to-emerald-500 shadow-lg shadow-success-500/40 scale-110' 
                                  : isCurrent
                                  ? 'bg-gradient-to-br from-primary-500 to-cyan-500 shadow-lg shadow-primary-500/40 animate-pulse'
                                  : 'bg-gray-200 border-2 border-gray-300'
                              }`}>
                                <StepIcon className={`w-3.5 h-3.5 ${
                                  isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                                }`} />
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                isCompleted ? 'text-success-600' : isCurrent ? 'text-primary-600' : 'text-gray-400'
                              }`}>
                                {statusConfig[step as OrderStatus].label}
                              </span>
                            </div>
                            {idx < 3 && (
                              <div className={`w-12 h-0.5 transition-all duration-500 ${
                                isCompleted ? 'bg-gradient-to-r from-success-500 to-emerald-500' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Hover action button */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <Button variant="primary" size="sm" className="shadow-lg shadow-primary-500/40">
                    Ver Detalles
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
