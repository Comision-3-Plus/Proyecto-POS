/**
 * Sidebar Component - Ultra Minimalista & Moderno
 * Diseño inspirado en Linear/Vercel/Arc
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package2,
  Warehouse,
  ShoppingBag,
  BarChart3,
  Users2,
  Settings,
  ChevronLeft,
  Zap,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Ventas / POS', icon: ShoppingCart, path: '/ventas' },
  { label: 'Productos', icon: Package2, path: '/productos' },
  { label: 'Stock', icon: Warehouse, path: '/stock' },
  { label: 'OMS', icon: ShoppingBag, path: '/oms' },
  { label: 'Reportes', icon: BarChart3, path: '/reportes' },
  { label: 'Clientes', icon: Users2, path: '/clientes' },
  { label: 'Configuración', icon: Settings, path: '/configuracion' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col border-r border-gray-200/50 bg-gradient-to-b from-white/95 via-white/90 to-white/85 backdrop-blur-2xl h-screen shadow-xl shadow-gray-200/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/40 ring-2 ring-primary-400/20 ring-offset-2">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/25 to-transparent" />
                <Zap className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight leading-none">NexusPOS</h2>
                <p className="text-[11px] text-gray-500 tracking-wide mt-0.5 font-medium">ENTERPRISE</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all',
            isCollapsed && 'mx-auto'
          )}
          aria-label={isCollapsed ? 'Expandir' : 'Contraer'}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-3 h-11 rounded-xl transition-all duration-150',
                'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50',
                isActive && 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:text-white shadow-lg shadow-primary-500/30',
                isCollapsed && 'justify-center px-0'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-all',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-semibold tracking-tight overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip para estado colapsado */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[4px] border-transparent border-r-gray-900" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-100 p-2.5">
        <div
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-gray-50 transition-all cursor-pointer group',
            isCollapsed && 'justify-center px-0'
          )}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex-shrink-0 ring-2 ring-white shadow-sm" />
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-[11px] font-semibold text-gray-900 truncate">Admin</p>
                <p className="text-[10px] text-gray-500 truncate">admin@nexuspos.com</p>
              </motion.div>
            )}
          </AnimatePresence>

          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[11px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Admin
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-[3px] border-transparent border-r-gray-900" />
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
