/**
 * Clientes Screen - Gestión de Clientes y Loyalty
 * Lista de clientes con programa de fidelización
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Star,
  TrendingUp,
  Award,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
  loyalty_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_compras: number;
  ultima_compra: string;
}

const mockClientes: Cliente[] = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan.perez@email.com',
    telefono: '+54 11 5555-1234',
    ciudad: 'Buenos Aires',
    loyalty_points: 4850,
    tier: 'gold',
    total_compras: 145000,
    ultima_compra: '2024-01-15',
  },
  {
    id: 2,
    nombre: 'María García',
    email: 'maria.garcia@email.com',
    telefono: '+54 11 5555-5678',
    ciudad: 'Córdoba',
    loyalty_points: 12400,
    tier: 'platinum',
    total_compras: 340000,
    ultima_compra: '2024-01-14',
  },
];

const tierConfig = {
  bronze: { label: 'Bronce', color: 'bg-orange-50 text-orange-700', icon: Award },
  silver: { label: 'Plata', color: 'bg-gray-100 text-gray-700', icon: Award },
  gold: { label: 'Oro', color: 'bg-yellow-50 text-yellow-700', icon: Star },
  platinum: {
    label: 'Platinum',
    color: 'bg-purple-50 text-purple-700',
    icon: Star,
  },
};

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    {
      label: 'Total Clientes',
      value: '2,847',
      change: '+12.5%',
      icon: Users,
      trend: 'up' as const,
    },
    {
      label: 'Clientes Activos',
      value: '1,492',
      change: '+8.2%',
      icon: TrendingUp,
      trend: 'up' as const,
    },
    {
      label: 'Nuevos Este Mes',
      value: '184',
      change: '+15.3%',
      icon: UserPlus,
      trend: 'up' as const,
    },
    {
      label: 'Puntos Totales',
      value: '2.4M',
      change: '+21.8%',
      icon: Star,
      trend: 'up' as const,
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
                Gestión de Clientes
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Base de clientes y programa de fidelización
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button variant="primary" size="sm">
                <UserPlus className="w-4 h-4" />
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => {
            const percentage = 75 + index * 5;
            const radius = 28;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08, type: 'spring' }}
                className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-cyan-500/0 group-hover:from-primary-500/5 group-hover:to-cyan-500/5 transition-all duration-500" />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className="text-3xl font-black text-gray-900 tracking-tight">
                        {stat.value}
                      </p>
                      <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-success-500 to-emerald-500 text-white text-xs font-bold shadow-lg shadow-success-500/40">
                        {stat.change}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">vs mes anterior</p>
                  </div>
                  
                  {/* Circular progress */}
                  <div className="relative w-16 h-16">
                    <svg className="-rotate-90 w-full h-full" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="5" />
                      <circle
                        cx="32" cy="32" r={radius} fill="none"
                        stroke="url(#gradient-client)" strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradient-client" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative group max-w-2xl">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-focus-within:shadow-primary-500/50 transition-shadow">
              <Search className="w-4.5 h-4.5 text-white" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar clientes por nombre, email, teléfono o ciudad..."
              className="w-full h-12 pl-14 pr-4 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 transition-all"
            />
          </div>
          <Button variant="secondary" size="md" className="h-12 shadow-md hover:shadow-lg">
            <Filter className="w-4 h-4" />
            Filtros Avanzados
          </Button>
        </div>
      </div>

      {/* Clientes Table */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/60 h-full overflow-auto shadow-2xl shadow-gray-200/30">
          <Table
            columns={[
              { key: 'cliente', header: 'Cliente' },
              { key: 'contacto', header: 'Contacto' },
              { key: 'ubicacion', header: 'Ubicación' },
              { key: 'tier', header: 'Tier Loyalty' },
              { key: 'loyalty_points', header: 'Puntos' },
              { key: 'total_compras', header: 'Total Compras' },
              { key: 'ultima_compra', header: 'Última Compra' },
            ]}
            keyExtractor={(item) => String(item.id)}
            data={mockClientes.map((cliente) => {
              const TierIcon = tierConfig[cliente.tier].icon;
              const initials = cliente.nombre.split(' ').map((n) => n[0]).join('');
              
              // Calcular progreso hacia next tier
              const tierProgress = cliente.tier === 'bronze' ? 30 : cliente.tier === 'silver' ? 55 : cliente.tier === 'gold' ? 80 : 100;
              const nextTier = cliente.tier === 'bronze' ? 'Silver' : cliente.tier === 'silver' ? 'Gold' : cliente.tier === 'gold' ? 'Platinum' : 'Max';

              return {
                id: cliente.id,
                cliente: (
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-primary-500/40 ring-2 ring-primary-400/20 ring-offset-2">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/25 to-transparent" />
                      <span className="text-sm font-black text-white relative z-10">
                        {initials}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {cliente.nombre}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {cliente.id}</p>
                    </div>
                  </div>
                ),
                contacto: (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                        <Mail className="w-3 h-3 text-gray-500" />
                      </div>
                      {cliente.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                        <Phone className="w-3 h-3 text-gray-500" />
                      </div>
                      {cliente.telefono}
                    </div>
                  </div>
                ),
                ubicacion: (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{cliente.ciudad}</span>
                  </div>
                ),
                tier: (
                  <div className="space-y-2 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                          cliente.tier === 'bronze' ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200/50' :
                          cliente.tier === 'silver' ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-300/50' :
                          cliente.tier === 'gold' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-300/50' :
                          'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-300/50'
                        }`}
                      >
                        <TierIcon className="w-3.5 h-3.5" />
                        {tierConfig[cliente.tier].label}
                      </span>
                    </div>
                    {cliente.tier !== 'platinum' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                          <span>Progreso a {nextTier}</span>
                          <span className="font-bold">{tierProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${tierProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ),
                loyalty_points: (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-base font-black text-gray-900">
                        {cliente.loyalty_points.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">PUNTOS</span>
                  </div>
                ),
                total_compras: (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-gray-900">
                      ${cliente.total_compras.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">Lifetime value</span>
                  </div>
                ),
                ultima_compra: (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(cliente.ultima_compra).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {Math.floor((Date.now() - new Date(cliente.ultima_compra).getTime()) / (1000 * 60 * 60 * 24))} días
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
