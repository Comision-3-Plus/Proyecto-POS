/**
 * Admin Service - Panel de administración (super admin)
 */

import apiClient from './api/apiClient';

// Types
export interface Tienda {
  id: string;
  nombre: string;
  rubro: string;
  is_active: boolean;
  created_at: string;
}

export interface TiendaCreate {
  nombre: string;
  rubro: string;
}

export interface UsuarioAdmin {
  id: string;
  email: string;
  full_name: string;
  rol: string;
  tienda_id: string;
  tienda_nombre?: string;
  is_active: boolean;
  created_at: string;
}

export interface UsuarioAdminCreate {
  email: string;
  full_name: string;
  password: string;
  rol: string;
  tienda_id: string;
}

export interface OnboardingRequest {
  tienda_nombre: string;
  tienda_rubro: string;
  admin_email: string;
  admin_password: string;
  admin_full_name: string;
}

export interface OnboardingResponse {
  tienda_id: string;
  usuario_id: string;
  mensaje: string;
}

class AdminService {
  /**
   * Listar todas las tiendas (super admin)
   */
  async getTiendas() {
    const response = await apiClient.get<Tienda[]>('/admin/tiendas');
    return response.data;
  }

  /**
   * Crear nueva tienda (super admin)
   */
  async createTienda(data: TiendaCreate) {
    const response = await apiClient.post<Tienda>('/admin/tiendas', data);
    return response.data;
  }

  /**
   * Listar todos los usuarios de todas las tiendas (super admin)
   */
  async getUsuarios() {
    const response = await apiClient.get<UsuarioAdmin[]>('/admin/usuarios');
    return response.data;
  }

  /**
   * Crear usuario en cualquier tienda (super admin)
   */
  async createUsuario(data: UsuarioAdminCreate) {
    const response = await apiClient.post<UsuarioAdmin>('/admin/usuarios', data);
    return response.data;
  }

  /**
   * Eliminar usuario (super admin)
   */
  async deleteUsuario(usuarioId: string) {
    const response = await apiClient.delete(`/admin/usuarios/${usuarioId}`);
    return response.data;
  }

  /**
   * Activar usuario (super admin)
   */
  async activateUsuario(usuarioId: string) {
    const response = await apiClient.patch<UsuarioAdmin>(
      `/admin/usuarios/${usuarioId}/activate`
    );
    return response.data;
  }

  /**
   * Onboarding completo: crear tienda + admin
   */
  async onboarding(data: OnboardingRequest) {
    const response = await apiClient.post<OnboardingResponse>(
      '/admin/onboarding',
      data
    );
    return response.data;
  }
}

export default new AdminService();
