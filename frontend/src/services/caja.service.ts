/**
 * Caja Service - Gestión de sesiones de caja
 */

import apiClient from './api/apiClient';

// Types
export interface SesionCaja {
  id: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  monto_inicial: number;
  monto_final: number | null;
  diferencia: number | null;
  estado: 'abierta' | 'cerrada';
  usuario_id: string;
  tienda_id: string;
  movimientos?: MovimientoCaja[];
}

export interface MovimientoCaja {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  descripcion: string;
  created_at: string;
  sesion_id: string;
}

export interface AbrirCajaRequest {
  monto_inicial: number;
}

export interface MovimientoCajaRequest {
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  descripcion: string;
}

export interface CerrarCajaRequest {
  monto_real: number;
}

export interface EstadoCajaResponse {
  tiene_caja_abierta: boolean;
  sesion: SesionCaja | null;
}

export interface CerrarCajaResponse {
  sesion_id: string;
  monto_inicial: number;
  monto_esperado: number;
  monto_real: number;
  diferencia: number;
  ventas_efectivo: number;
  total_ingresos: number;
  total_egresos: number;
  fecha_apertura: string;
  fecha_cierre: string;
}

class CajaService {
  /**
   * Abrir sesión de caja
   */
  async abrirCaja(data: AbrirCajaRequest) {
    const response = await apiClient.post<SesionCaja>('/caja/abrir', data);
    return response.data;
  }

  /**
   * Obtener estado actual de la caja
   */
  async getEstado() {
    const response = await apiClient.get<EstadoCajaResponse>('/caja/estado');
    return response.data;
  }

  /**
   * Registrar movimiento de caja (ingreso/egreso)
   */
  async registrarMovimiento(data: MovimientoCajaRequest) {
    const response = await apiClient.post<MovimientoCaja>('/caja/movimiento', data);
    return response.data;
  }

  /**
   * Cerrar sesión de caja
   */
  async cerrarCaja(data: CerrarCajaRequest) {
    const response = await apiClient.post<CerrarCajaResponse>('/caja/cerrar', data);
    return response.data;
  }
}

export default new CajaService();
