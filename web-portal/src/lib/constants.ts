/**
 * Constantes de la aplicación
 */

export const APP_CONFIG = {
  name: 'Nexus POS',
  version: '1.0.0',
  description: 'Sistema de Punto de Venta Multi-Tenant',
} as const;

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  version: 'v1',
} as const;

export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  productos: '/productos',
  ventas: '/ventas',
  reportes: '/reportes',
  inventario: '/inventario',
  configuracion: '/configuracion',
} as const;

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  CAJERO: 'cajero',
  SUPER_ADMIN: 'super_admin',
} as const;

export const PRODUCT_TYPES = {
  GENERAL: 'general',
  ROPA: 'ropa',
  PESABLE: 'pesable',
} as const;

export const PAYMENT_METHODS = {
  EFECTIVO: 'EFECTIVO',
  MERCADOPAGO: 'MERCADOPAGO',
  TARJETA: 'TARJETA',
  TARJETA_DEBITO: 'tarjeta_debito',
  TARJETA_CREDITO: 'tarjeta_credito',
  TRANSFERENCIA: 'transferencia',
} as const;

export const URGENCY_LEVELS = {
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  CRITICA: 'CRITICA',
} as const;

export const PAGINATION = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
} as const;
