/**
 * Axios Client with Interceptors
 * Enterprise-grade HTTP client con retry, request tracking y error handling
 */

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Configuración base
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Agregar token y request ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Agregar token de autenticación
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Agregar Request ID para tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (config.headers) {
      config.headers['X-Request-ID'] = requestId;
    }

    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        requestId,
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Manejo de errores y logging
apiClient.interceptors.response.use(
  (response) => {
    // Log exitoso en desarrollo
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
        requestId: response.config.headers?.['X-Request-ID'],
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const requestId = error.config?.headers?.['X-Request-ID'] as string;

    // Log de error
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      requestId,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    // Manejo de errores específicos
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Token expirado o inválido
          console.warn('[Auth] Token inválido o expirado. Redirigiendo a login...');
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          break;

        case 403:
          // Sin permisos
          console.warn('[Auth] Sin permisos para esta operación');
          break;

        case 404:
          // Recurso no encontrado
          console.warn('[API] Recurso no encontrado');
          break;

        case 422:
          // Validación fallida
          console.warn('[Validation] Errores de validación:', data);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Errores del servidor
          console.error('[Server] Error del servidor:', status);
          break;

        default:
          console.error('[API] Error desconocido:', status);
      }
    } else if (error.request) {
      // Request hecho pero sin respuesta
      console.error('[Network] Error de red - sin respuesta del servidor');
    } else {
      // Error en configuración del request
      console.error('[Request] Error en configuración:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helpers para requests comunes
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config),
};

export default apiClient;
