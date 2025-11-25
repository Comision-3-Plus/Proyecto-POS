/**
 * 🔄 REACT QUERY CLIENT - Global Configuration
 * 
 * Configuración centralizada de TanStack Query (React Query) v5
 * con manejo de errores global y configuración de cache
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

/**
 * Helper para extraer mensaje de error de respuestas del backend
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // FastAPI devuelve errores en formato { detail: string | array }
    const detail = error.response?.data?.detail;
    
    if (typeof detail === 'string') {
      return detail;
    }
    
    if (Array.isArray(detail)) {
      // Errores de validación de Pydantic
      return detail.map((err: any) => err.msg).join(', ');
    }
    
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Ha ocurrido un error desconocido';
};

/**
 * 🎯 QUERY CLIENT CONFIGURATION
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración de staleTime y cacheTime
      staleTime: 1000 * 60 * 5, // 5 minutos - datos considerados frescos
      gcTime: 1000 * 60 * 30, // 30 minutos - garbage collection (antes cacheTime)
      
      // Retry configuration
      retry: (failureCount, error) => {
        // No reintentar en errores 4xx (client errors)
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500) {
            return false;
          }
        }
        // Reintentar hasta 2 veces en otros casos
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: false, // No refetch automático al enfocar ventana
      refetchOnReconnect: true, // Sí refetch al reconectar internet
      refetchOnMount: true, // Refetch al montar componente
    },
    
    mutations: {
      // No reintentar mutations por defecto
      retry: false,
    },
  },
  
  /**
   * 🎭 QUERY CACHE: Manejo global de errores de queries
   */
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Solo mostrar toast si la query tiene observers (componentes montados)
      if (query.state.data !== undefined) {
        const message = getErrorMessage(error);
        console.error('❌ [Query Error]', { queryKey: query.queryKey, error: message });
        
        // No mostrar toast para errores 401 (ya lo maneja el interceptor)
        if (!(error instanceof AxiosError && error.response?.status === 401)) {
          toast.error(`Error al cargar datos: ${message}`);
        }
      }
    },
  }),
  
  /**
   * 🎭 MUTATION CACHE: Manejo global de errores de mutations
   */
  mutationCache: new MutationCache({
    onError: (error) => {
      const message = getErrorMessage(error);
      console.error('❌ [Mutation Error]', { error: message });
      
      // No mostrar toast para errores 401 (ya lo maneja el interceptor)
      if (!(error instanceof AxiosError && error.response?.status === 401)) {
        toast.error(`Error al guardar: ${message}`);
      }
    },
  }),
});

/**
 * 🔄 QUERY KEY FACTORY
 * Centraliza la creación de query keys para evitar inconsistencias
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
  },
  
  // Productos
  productos: {
    all: ['productos'] as const,
    lists: () => [...queryKeys.productos.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.productos.lists(), filters] as const,
    details: () => [...queryKeys.productos.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.productos.details(), id] as const,
  },
  
  // Ventas
  ventas: {
    all: ['ventas'] as const,
    lists: () => [...queryKeys.ventas.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.ventas.lists(), filters] as const,
    details: () => [...queryKeys.ventas.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.ventas.details(), id] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    resumen: () => [...queryKeys.dashboard.all, 'resumen'] as const,
    tiempoReal: () => [...queryKeys.dashboard.all, 'tiempo-real'] as const,
  },
  
  // Insights
  insights: {
    all: ['insights'] as const,
    lists: () => [...queryKeys.insights.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.insights.lists(), filters] as const,
  },
  
  // Inventario
  inventario: {
    all: ['inventario'] as const,
    alertas: () => [...queryKeys.inventario.all, 'alertas'] as const,
    estadisticas: () => [...queryKeys.inventario.all, 'estadisticas'] as const,
  },
} as const;
