/**
 * Stock Screen - Gestión de Inventario Multi-Ubicación
 * Vista con filtros por almacén y alertas de stock bajo
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Warehouse,
  AlertTriangle,
  Package,
  TrendingUp,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';

interface StockItem {
  id: number;
  producto: string;
  sku: string;
  deposito_central: number;
  deposito_norte: number;
  deposito_sur: number;
  stock_minimo: number;
  precio_costo: number;
  valor_total: number;
}

const mockStock: StockItem[] = [
  {
    id: 1,
    producto: 'Laptop Dell XPS 15',
    sku: 'LAP-XPS-001',
    deposito_central: 45,
    deposito_norte: 12,
    deposito_sur: 8,
    stock_minimo: 20,
    precio_costo: 1250000,
    valor_total: 81250000,
  },
  {
    id: 2,
    producto: 'Mouse Logitech MX Master 3',
    sku: 'ACC-MOU-002',
    deposito_central: 3,
    deposito_norte: 5,
    deposito_sur: 2,
    stock_minimo: 15,
    precio_costo: 12500,
    valor_total: 125000,
  },
];

export default function Stock() {
  const [filtroDeposito, setFiltroDeposito] = useState<string>('todos');

  const stats = [
    {
      label: 'Valor Total Inventario',
      value: '$124.5M',
      change: '+8.2%',
      icon: TrendingUp,
      trend: 'up' as const,
    },
    {
      label: 'Productos en Stock',
      value: '1,284',
      change: '+12',
      icon: Package,
      trend: 'up' as const,
    },
    {
      label: 'Alertas Stock Bajo',
      value: '47',
      change: '-5',
      icon: AlertTriangle,
      trend: 'down' as const,
    },
    {
      label: 'Ubicaciones',
      value: '3',
      change: '0',
      icon: Warehouse,
      trend: 'neutral' as const,
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
                Gestión de Stock
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Control de inventario multi-ubicación
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button variant="primary" size="sm">
                <Package className="w-4 h-4" />
                Ajustar Stock
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => {
            // Calcular porcentaje para el gráfico circular
            const percentage = stat.trend === 'up' ? 75 : stat.trend === 'down' ? 35 : 50;
            const circumference = 2 * Math.PI * 20;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 hover:shadow-2xl hover:shadow-gray-200/40 transition-all duration-500 hover:-translate-y-1 cursor-pointer overflow-hidden group"
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  stat.trend === 'up' ? 'bg-gradient-to-br from-success-500/5 to-emerald-500/5' :
                  stat.trend === 'down' ? 'bg-gradient-to-br from-danger-500/5 to-rose-500/5' :
                  'bg-gradient-to-br from-gray-500/5 to-gray-500/5'
                }`} />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight mb-3">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        stat.trend === 'up' ? 'bg-gradient-to-r from-success-500 to-emerald-500 text-white shadow-lg shadow-success-500/40' :
                        stat.trend === 'down' ? 'bg-gradient-to-r from-danger-500 to-rose-500 text-white shadow-lg shadow-danger-500/40' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {stat.change}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">vs mes anterior</span>
                    </div>
                  </div>
                  
                  {/* Mini circular progress chart */}
                  <div className="relative">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
                      {/* Background circle */}
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="4"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke={stat.trend === 'up' ? 'url(#gradient-success)' : stat.trend === 'down' ? 'url(#gradient-danger)' : '#9ca3af'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="gradient-danger" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <stat.icon className={`w-6 h-6 ${
                        stat.trend === 'up' ? 'text-success-600' :
                        stat.trend === 'down' ? 'text-danger-600' :
                        'text-gray-500'
                      }`} />
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
        <div className="flex items-center gap-4">
          <div className="flex-1 relative group max-w-lg">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-focus-within:shadow-primary-500/50 transition-shadow">
              <Search className="w-4.5 h-4.5 text-white" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos por nombre, SKU o categoría..."
              className="w-full h-12 pl-14 pr-4 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 transition-all"
            />
          </div>
          
          {/* Warehouse selector con visual */}
          <div className="relative">
            <select
              value={filtroDeposito}
              onChange={(e) => setFiltroDeposito(e.target.value)}
              className="h-12 pl-12 pr-10 bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all appearance-none shadow-md hover:shadow-lg cursor-pointer"
            >
              <option value="todos">Todos los depósitos</option>
              <option value="central">Depósito Central</option>
              <option value="norte">Depósito Norte</option>
              <option value="sur">Depósito Sur</option>
            </select>
            <Warehouse className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-600 pointer-events-none" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <Button variant="secondary" size="md" className="h-12 shadow-md hover:shadow-lg">
            <Filter className="w-4 h-4" />
            Filtros Avanzados
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/60 h-full overflow-auto shadow-2xl shadow-gray-200/30">
          <Table
            columns={[
              { key: 'producto', header: 'Producto' },
              { key: 'sku', header: 'SKU' },
              { key: 'distribucion', header: 'Distribución Multi-Ubicación' },
              { key: 'total', header: 'Total' },
              { key: 'alerta', header: 'Estado' },
              { key: 'valor_total', header: 'Valor Total' },
            ]}
            keyExtractor={(item) => String(item.id)}
            data={mockStock.map((item) => {
              const totalStock = item.deposito_central + item.deposito_norte + item.deposito_sur;
              const isBajo = totalStock < item.stock_minimo;
              const isCritico = totalStock < item.stock_minimo * 0.5;
              
              // Calcular porcentajes para heat map
              const pctCentral = (item.deposito_central / totalStock) * 100;
              const pctNorte = (item.deposito_norte / totalStock) * 100;
              const pctSur = (item.deposito_sur / totalStock) * 100;
              
              return {
                id: item.id,
                producto: (
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border border-gray-200/50 shadow-sm">
                      <Package className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.producto}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {item.id}</p>
                    </div>
                  </div>
                ),
                sku: (
                  <code className="text-xs bg-gradient-to-br from-gray-50 to-gray-100 px-3 py-1.5 rounded-lg text-gray-700 font-mono border border-gray-200/50">{item.sku}</code>
                ),
                distribucion: (
                  <div className="space-y-2 min-w-[280px]">
                    {/* Central */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 min-w-[70px]">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600" />
                        <span className="text-xs font-medium text-gray-600">Central</span>
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${pctCentral}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-900 min-w-[35px] text-right">{item.deposito_central}</span>
                    </div>
                    {/* Norte */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 min-w-[70px]">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600" />
                        <span className="text-xs font-medium text-gray-600">Norte</span>
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-500"
                          style={{ width: `${pctNorte}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-900 min-w-[35px] text-right">{item.deposito_norte}</span>
                    </div>
                    {/* Sur */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 min-w-[70px]">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-600" />
                        <span className="text-xs font-medium text-gray-600">Sur</span>
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500"
                          style={{ width: `${pctSur}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-900 min-w-[35px] text-right">{item.deposito_sur}</span>
                    </div>
                  </div>
                ),
                total: (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg font-black text-gray-900">
                      {totalStock}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">unidades</span>
                  </div>
                ),
                alerta: (
                  <div className="flex flex-col gap-1.5">
                    {isCritico ? (
                      <>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-danger-500 to-rose-600 shadow-lg shadow-danger-500/40">
                          <AlertTriangle className="w-3.5 h-3.5 text-white animate-pulse" />
                          <span className="text-xs font-bold text-white">CRÍTICO</span>
                        </div>
                        <span className="text-[10px] text-danger-600 font-medium">Reordenar urgente</span>
                      </>
                    ) : isBajo ? (
                      <>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-warning-400 to-amber-500 shadow-lg shadow-warning-500/40">
                          <AlertTriangle className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-bold text-white">BAJO</span>
                        </div>
                        <span className="text-[10px] text-warning-600 font-medium">Revisar stock</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-success-500 to-emerald-600 shadow-md">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span className="text-xs font-bold text-white">NORMAL</span>
                        </div>
                        <span className="text-[10px] text-success-600 font-medium">Stock adecuado</span>
                      </>
                    )}
                  </div>
                ),
                valor_total: (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-sm font-bold text-gray-900">
                      ${item.valor_total.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      ${item.precio_costo.toLocaleString()} c/u
                    </span>
                  </div>
                ),
              };
            })}
          />
        </div>
      </div>
    </div>
  );
}
