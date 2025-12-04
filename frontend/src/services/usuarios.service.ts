/**
 * Usuarios Service - Gestión de empleados
 */

import apiClient from './api/apiClient';

// Types
export interface Usuario {
  id: string;
  email: string;
  full_name: string;
  rol: 'owner' | 'admin' | 'encargado' | 'vendedor' | 'cajero';
  tienda_id: string;
  is_active: boolean;
  created_at?: string;
}

export interface InvitarUsuarioRequest {
  email: string;
  full_name: string;
  password: string;
  rol: 'admin' | 'encargado' | 'vendedor' | 'cajero';
}

export interface CambiarRolRequest {
  nuevo_rol: 'admin' | 'encargado' | 'vendedor' | 'cajero';
}

class UsuariosService {
  /**
   * Listar empleados de la tienda
   */
  async getEmpleados() {
    const response = await apiClient.get<Usuario[]>('/usuarios');
    return response.data;
  }

  /**
   * Invitar nuevo empleado
   */
  async invitarEmpleado(data: InvitarUsuarioRequest) {
    const response = await apiClient.post<Usuario>('/usuarios/invitar', data);
    return response.data;
  }

  /**
   * Cambiar rol de empleado
   */
  async cambiarRol(usuarioId: string, data: CambiarRolRequest) {
    const response = await apiClient.patch<Usuario>(
      `/usuarios/${usuarioId}/rol`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar empleado (desactivar)
   */
  async eliminarEmpleado(usuarioId: string) {
    const response = await apiClient.delete(`/usuarios/${usuarioId}`);
    return response.data;
  }

  /**
   * Reactivar empleado
   */
  async reactivarEmpleado(usuarioId: string) {
    const response = await apiClient.patch<Usuario>(
      `/usuarios/${usuarioId}/reactivar`
    );
    return response.data;
  }
}

export default new UsuariosService();
