/**
 * Layout principal de la aplicación autenticada
 */

'use client';

import { usePathname } from 'next/navigation';
import { useAuth, useLogout, useTieneCajaAbierta } from '@/hooks';
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Box,
  Settings,
  LogOut,
  DollarSign,
} from 'lucide-react';
import { CerrarCajaModal } from '@/components/caja';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/inventario', label: 'Inventario', icon: Box },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const logout = useLogout();
  const tieneCajaAbierta = useTieneCajaAbierta();
  const [cerrarCajaOpen, setCerrarCajaOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Nexus POS</h1>
          {user && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">{user.full_name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              <p className="text-xs text-blue-600 mt-1">{user.rol.toUpperCase()}</p>
            </div>
          )}
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Botón de Cerrar Caja */}
          {tieneCajaAbierta && (
            <div className="px-6 py-3 mt-8">
              <Button
                onClick={() => setCerrarCajaOpen(true)}
                variant="outline"
                className="w-full justify-start gap-3 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
              >
                <DollarSign className="w-5 h-5" />
                <span>Cerrar Caja</span>
              </Button>
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors w-full mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>

      {/* Modal de Cerrar Caja */}
      <CerrarCajaModal open={cerrarCajaOpen} onOpenChange={setCerrarCajaOpen} />
    </div>
  );
}
