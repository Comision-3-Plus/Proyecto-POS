/**
 * Cliente HTTP centralizado con Axios
 * - Interceptores para token JWT
 * - Retry automático en fallos de red
 * - Propagación de errores al Toast System
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { APIError } from '@/types/api';

// En desarrollo usar el proxy de Vite, en producción usar la variable de entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Instancia de Axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s
});

// ==================== INTERCEPTOR: REQUEST ====================
apiClient.interceptors.request.use(
  (config) => {
    // Inyectar token JWT si existe
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Request ID para tracking (opcional)
    const requestId = crypto.randomUUID();
    config.headers['X-Request-ID'] = requestId;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== INTERCEPTOR: RESPONSE ====================
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Respuesta exitosa, devolver data directamente
    return response;
  },
  async (error: AxiosError<APIError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Retry automático en fallos de red (timeout, conexión, 5xx)
    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      (error.response?.status && error.response.status >= 500)
    ) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        // Esperar 1s antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));

        return apiClient(originalRequest);
      }
    }

    // Logout automático si token expiró (401)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Evitar loops infinitos en /login
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Propagar error al caller con información estructurada
    return Promise.reject(error);
  }
);

// ==================== HELPERS DE ERROR ====================

/**
 * Extrae el mensaje de error de una respuesta de API
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIError>;
    
    // Error estructurado del backend
    if (axiosError.response?.data?.error?.message) {
      return axiosError.response.data.error.message;
    }

    // Error de validación
    if (axiosError.response?.data?.error?.validation_errors) {
      const validationErrors = axiosError.response.data.error.validation_errors;
      return validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
    }

    // Error genérico de Axios
    if (axiosError.message) {
      return axiosError.message;
    }
  }

  // Fallback
  if (error instanceof Error) {
    return error.message;
  }

  return 'Error desconocido';
}

/**
 * Verifica si es un error de validación (422)
 */
export function isValidationError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 422;
  }
  return false;
}

/**
 * Extrae detalles adicionales del error (para debugging)
 */
export function getErrorDetails(error: unknown): Record<string, any> | undefined {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIError>;
    return axiosError.response?.data?.error?.details;
  }
  return undefined;
}

// ==================== EXPORTS ====================
export default apiClient;
