/**
 * App Root Component
 * Configuración de routing, providers y layout
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Productos from './screens/Productos';
import Ventas from './screens/Ventas';
import Stock from './screens/Stock';
import OMS from './screens/OMS';
import Reportes from './screens/Reportes';
import Clientes from './screens/Clientes';
import Configuracion from './screens/Configuracion';

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
    mutations: {
      retry: 0,
    },
  },
});

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main Layout with Sidebar
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/30">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/productos"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Productos />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ventas"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Ventas />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Stock />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/oms"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <OMS />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Reportes />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Clientes />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Configuracion />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
