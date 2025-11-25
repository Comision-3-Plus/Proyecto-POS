/**
 * Tipos TypeScript para el módulo de Control de Caja
 * Sincronizados con el backend FastAPI
 */

// ==================== SESIÓN DE CAJA ====================

export interface SesionCaja {
  id: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  monto_inicial: number;
  monto_final: number | null;
  diferencia: number | null;
  estado: 'abierta' | 'cerrada';
  usuario_id: string;
  movimientos: MovimientoCaja[];
}

export interface MovimientoCaja {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  descripcion: string;
  created_at: string;
}

// ==================== REQUEST DTOs ====================

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

// ==================== RESPONSE DTOs ====================

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

// ==================== UI HELPERS ====================

export interface ResumenCaja {
  monto_inicial: number;
  ventas_efectivo: number;
  ingresos_manuales: number;
  egresos_manuales: number;
  monto_esperado: number;
  cantidad_movimientos: number;
}

export type TipoMovimiento = 'INGRESO' | 'EGRESO';

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
};

export const ESTADO_CAJA_LABELS: Record<'abierta' | 'cerrada', string> = {
  abierta: 'Abierta',
  cerrada: 'Cerrada',
};
