/**
 * Servicio de Control de Caja
 * Gestiona apertura, cierre y movimientos de caja
 */

import apiClient, { handleApiError } from '@/lib/api-client';
import type {
  AbrirCajaRequest,
  MovimientoCajaRequest,
  CerrarCajaRequest,
  SesionCaja,
  EstadoCajaResponse,
  CerrarCajaResponse,
  MovimientoCaja,
} from '@/types/caja';

const API_V1 = '/api/v1';

export const cajaService = {
  /**
   * Abrir una nueva sesión de caja
   */
  async abrirCaja(data: AbrirCajaRequest): Promise<SesionCaja> {
    try {
      const response = await apiClient.post<SesionCaja>(`${API_V1}/caja/abrir`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Obtener el estado actual de la caja del usuario
   */
  async obtenerEstadoCaja(): Promise<EstadoCajaResponse> {
    try {
      const response = await apiClient.get<EstadoCajaResponse>(`${API_V1}/caja/estado`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Registrar un movimiento de caja (ingreso o egreso manual)
   */
  async registrarMovimiento(data: MovimientoCajaRequest): Promise<MovimientoCaja> {
    try {
      const response = await apiClient.post<MovimientoCaja>(`${API_V1}/caja/movimiento`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Cerrar la sesión de caja actual
   */
  async cerrarCaja(data: CerrarCajaRequest): Promise<CerrarCajaResponse> {
    try {
      const response = await apiClient.post<CerrarCajaResponse>(`${API_V1}/caja/cerrar`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
