"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  Menu,
  X,
  LogOut,
  Store,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiClient } from "@/lib/api-client";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Punto de Venta", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/ventas", label: "Ventas", icon: DollarSign },
  { href: "/admin", label: "Administración", icon: Shield, adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  // ⚡ OPTIMIZACIÓN: useAuth ya tiene staleTime largo, no re-fetchea en cada navegación
  const { user, logout } = useAuth();

  // ⚡ PREFETCH: Pre-cargar datos al hacer hover sobre link (navegación instantánea)
  const handlePrefetch = (href: string) => {
    if (href === "/dashboard") {
      queryClient.prefetchQuery({
        queryKey: ["dashboard", "metrics"],
        queryFn: () => apiClient.get("/api/v1/dashboard/resumen"),
      });
    } else if (href === "/productos") {
      queryClient.prefetchQuery({
        queryKey: ["productos"],
        queryFn: () => apiClient.get("/api/v1/productos"),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <span className="font-bold text-lg">Nexus POS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            // ⚡ Ocultar item si es adminOnly y user no es super_admin
            if (item.adminOnly && user?.rol !== "super_admin") {
              return null;
            }
            
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => handlePrefetch(item.href)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-gray-600" />
            <span className="font-semibold text-gray-900">
              {user?.tienda?.nombre || "Mi Tienda"}
            </span>
            <span className="text-sm text-gray-500">
              · {user?.tienda?.rubro}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.nombre}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-black text-white">
                  {user?.nombre?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
