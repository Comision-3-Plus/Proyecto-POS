/**
 * Cliente API configurado con axios
 * Base para todas las llamadas al backend
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// URL base del backend - configurar según entorno
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Instancia principal de axios configurada
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

/**
 * Interceptor de request - agrega token de autenticación
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener token del localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de response - manejo de errores globales
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Manejo de errores de autenticación
    if (error.response?.status === 401) {
      // Token expirado o inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // Manejo de errores del servidor
    if (error.response?.status === 500) {
      console.error('Error del servidor:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Helper para extraer mensaje de error
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail: string | { msg: string }[] }>;
    
    if (axiosError.response?.data?.detail) {
      const detail = axiosError.response.data.detail;
      
      // Si es un array de errores de validación
      if (Array.isArray(detail)) {
        return detail.map(err => err.msg).join(', ');
      }
      
      // Si es un string
      return detail;
    }
    
    return axiosError.message || 'Error desconocido';
  }
  
  return 'Error desconocido';
};

/**
 * Helper para manejar errores de forma consistente
 */
export const handleApiError = (error: unknown): never => {
  const message = getErrorMessage(error);
  throw new Error(message);
};

export default apiClient;
