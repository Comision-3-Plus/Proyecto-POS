/**
 * 🎨 DASHBOARD LAYOUT - Navegación Principal
 * 
 * Layout para todas las páginas protegidas con:
 * - Sidebar con navegación
 * - Header con info del usuario
 * - Contenido principal
 * - CajaGuard para requerir apertura de caja
 */

'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Warehouse,
  Settings,
  LogOut,
  Menu,
  X,
  Lightbulb,
  Store,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clearAuthToken } from '@/api/custom-instance';
import { CajaGuard, CerrarCajaModal } from '@/components/caja';
import { useTieneCajaAbierta } from '@/hooks/useCaja';

// ==================== TYPES ====================

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

// ==================== NAV ITEMS ====================

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Punto de Venta',
    href: '/pos',
    icon: ShoppingCart,
  },
  {
    name: 'Productos',
    href: '/productos',
    icon: Package,
  },
  {
    name: 'Inventario',
    href: '/inventario',
    icon: Warehouse,
  },
  {
    name: 'Ventas',
    href: '/ventas',
    icon: BarChart3,
  },
  {
    name: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
  },
  {
    name: 'Insights',
    href: '/insights',
    icon: Lightbulb,
  },
  {
    name: 'Tienda',
    href: '/tienda',
    icon: Store,
  },
];

// ==================== COMPONENT ====================

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cerrarCajaOpen, setCerrarCajaOpen] = useState(false);
  const tieneCajaAbierta = useTieneCajaAbierta();

  // Obtener info del usuario del localStorage
  const getUserInfo = () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('nexus_pos_user');
    return userStr ? JSON.parse(userStr) : null;
  };

  const userInfo = getUserInfo();

  // ==================== HANDLERS ====================

  const handleLogout = () => {
    clearAuthToken();
    toast.success('Sesión cerrada exitosamente');
    router.push('/login');
    router.refresh();
  };

  // ==================== RENDER ====================

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b bg-indigo-600">
            <ShoppingCart className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-semibold text-white">Nexus POS</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5',
                        isActive ? 'text-indigo-600' : 'text-gray-400'
                      )}
                    />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className="flex-shrink-0 border-t p-4">
            {/* Botón de Cerrar Caja */}
            {tieneCajaAbierta && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-3 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                onClick={() => setCerrarCajaOpen(true)}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Cerrar Caja
              </Button>
            )}
            
            <div className="flex items-center mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userInfo?.username || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userInfo?.rol || 'CAJERO'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
            <span className="ml-2 text-lg font-semibold">Nexus POS</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <CajaGuard>
            {children}
          </CajaGuard>
        </main>
      </div>

      {/* Modal de Cerrar Caja */}
      <CerrarCajaModal open={cerrarCajaOpen} onOpenChange={setCerrarCajaOpen} />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-white z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Same sidebar content as desktop */}
            <div className="flex flex-col h-full">
              <div className="flex items-center h-16 flex-shrink-0 px-4 border-b bg-indigo-600">
                <ShoppingCart className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-semibold text-white">Nexus POS</span>
              </div>

              <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm font-medium rounded-lg',
                          isActive
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <item.icon
                          className={cn(
                            'mr-3 h-5 w-5',
                            isActive ? 'text-indigo-600' : 'text-gray-400'
                          )}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="flex-shrink-0 border-t p-4">
                {/* Botón de Cerrar Caja en móvil */}
                {tieneCajaAbierta && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-3 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                    onClick={() => {
                      setCerrarCajaOpen(true);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Cerrar Caja
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
