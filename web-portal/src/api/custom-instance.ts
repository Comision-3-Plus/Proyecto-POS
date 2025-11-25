/**
 * 🔒 CUSTOM AXIOS INSTANCE - Security Layer
 * 
 * Esta instancia personalizada de Axios:
 * 1. Inyecta automáticamente el JWT en cada request
 * 2. Maneja errores 401 (token expirado) globalmente
 * 3. Intercepta respuestas 503 (Circuit Breaker)
 * 4. Proporciona logging estructurado
 */

import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// ==================== CONSTANTS ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'nexus_pos_access_token';
const USER_KEY = 'nexus_pos_user';

// ==================== AXIOS INSTANCE ====================
const axiosInstance = Axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// ==================== REQUEST INTERCEPTOR ====================
/**
 * Inyecta el JWT automáticamente antes de cada request
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem(TOKEN_KEY) 
      : null;

    // Inyectar Bearer token si existe
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Logging en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('❌ [Request Error]', error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
/**
 * Maneja errores globales y Circuit Breaker
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Logging en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 [API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error: AxiosError<{ detail: string }>) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    // 🔒 401 Unauthorized: Token expirado o inválido
    if (status === 401) {
      console.warn('🔒 [Auth Error] Token inválido o expirado. Redirigiendo a login...');
      
      // Limpiar storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        
        // Redirigir a login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?reason=session_expired';
        }
      }

      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }

    // 🛡️ 503 Service Unavailable: Circuit Breaker abierto
    else if (status === 503) {
      console.warn('🛡️ [Circuit Breaker] Servicio externo no disponible');
      toast.warning(
        'Sistema de pagos temporalmente offline. Por favor, cobre en efectivo.',
        { duration: 5000 }
      );
    }

    // 🚫 403 Forbidden: Sin permisos
    else if (status === 403) {
      toast.error('No tienes permisos para realizar esta acción.');
    }

    // 🔍 404 Not Found
    else if (status === 404) {
      toast.error('El recurso solicitado no existe.');
    }

    // 💥 500 Server Error
    else if (status === 500) {
      console.error('💥 [Server Error]', error.response?.data);
      toast.error('Error interno del servidor. Por favor, contacta al soporte.');
    }

    // ⚠️ Validation Errors (422)
    else if (status === 422) {
      const validationError = detail || 'Error de validación';
      toast.error(validationError);
    }

    // 🌐 Network Errors
    else if (error.code === 'ECONNABORTED') {
      toast.error('La solicitud tardó demasiado. Por favor, intenta nuevamente.');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Error de conexión. Verifica tu internet.');
    }

    return Promise.reject(error);
  }
);

// ==================== CUSTOM INSTANCE FOR ORVAL ====================
/**
 * Esta función es la que Orval usará para todas las requests.
 * DEBE devolver una Promise con AxiosResponse.
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = Axios.CancelToken.source();

  const promise = axiosInstance({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Guarda el token en localStorage
 */
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Obtiene el token actual
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Limpia el token (logout)
 */
export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Export default para compatibilidad
export default axiosInstance;
