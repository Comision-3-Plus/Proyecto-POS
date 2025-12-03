/**
 * Servicio de Autenticación
 */

import apiClient from './api/apiClient';
import type { LoginRequest, AuthResponse, User } from '@/types/api';

const BASE_PATH = '/auth';

export interface RegisterRequest {
  full_name: string;
  email: string;
  dni: string;
  password: string;
  tienda_nombre: string;
  tienda_rubro: string;
}

export const authService = {
  /**
   * Login de usuario
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      `${BASE_PATH}/login`,
      credentials
    );

    // Guardar token y usuario en localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  /**
   * Registro de nuevo usuario con tienda
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      `${BASE_PATH}/register`,
      data
    );

    // Guardar token y usuario en localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  /**
   * Obtiene datos del usuario actual
   */
  async me(): Promise<User> {
    const response = await apiClient.get<User>(`${BASE_PATH}/me`);
    return response.data;
  },

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Obtiene el usuario del localStorage
   */
  getCurrentUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
