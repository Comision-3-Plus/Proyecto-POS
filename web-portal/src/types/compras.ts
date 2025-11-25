/**
 * Tipos TypeScript para el módulo de Compras y Proveedores
 */

// ==================== PROVEEDOR ====================

export interface Proveedor {
  id: string;
  razon_social: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProveedorCreate {
  razon_social: string;
  cuit: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
}

// ==================== ORDEN DE COMPRA ====================

export interface DetalleOrden {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_costo_unitario: number;
  subtotal: number;
}

export interface DetalleOrdenCreate {
  producto_id: string;
  cantidad: number;
  precio_costo_unitario: number;
}

export interface OrdenCompra {
  id: string;
  proveedor_id: string;
  proveedor_razon_social: string;
  fecha_emision: string;
  estado: 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';
  total: number;
  observaciones: string | null;
  created_at: string;
  detalles: DetalleOrden[];
}

export interface OrdenCompraCreate {
  proveedor_id: string;
  observaciones?: string | null;
  detalles: DetalleOrdenCreate[];
}

export interface RecibirOrdenResponse {
  orden_id: string;
  estado: string;
  productos_actualizados: number;
  mensaje: string;
}

// ==================== UI HELPERS ====================

export type EstadoOrden = 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';

export const ESTADO_ORDEN_LABELS: Record<EstadoOrden, string> = {
  PENDIENTE: 'Pendiente',
  RECIBIDA: 'Recibida',
  CANCELADA: 'Cancelada',
};

export const ESTADO_ORDEN_COLORS: Record<EstadoOrden, string> = {
  PENDIENTE: 'yellow',
  RECIBIDA: 'green',
  CANCELADA: 'red',
};
