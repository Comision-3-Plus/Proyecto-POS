/**
 * Servicio de autenticación
 * Maneja login, logout y gestión de sesión
 */

import apiClient, { handleApiError } from '@/lib/api-client';
import type { LoginRequest, Token, UserInfo } from '@/types/api';

const API_V1 = '/api/v1';

export const authService = {
  /**
   * Login con email y contraseña
   */
  async login(credentials: LoginRequest): Promise<Token> {
    try {
      const response = await apiClient.post<Token>(`${API_V1}/auth/login`, credentials);
      
      // Guardar token y usuario en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.data.access_token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      }
      
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Obtener información del usuario actual
   */
  async getCurrentUser(): Promise<UserInfo> {
    try {
      const response = await apiClient.get<UserInfo>(`${API_V1}/auth/me`);
      
      // Actualizar usuario en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Logout - limpiar sesión
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  /**
   * Obtener usuario del localStorage
   */
  getStoredUser(): UserInfo | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Obtener token del localStorage
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },
};

export default authService;
