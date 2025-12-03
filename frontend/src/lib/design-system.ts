/**
 * Design System - Sistema unificado de colores y estilos
 * Colores consistentes para estados en toda la aplicación
 */

export const STATUS_COLORS = {
  // Estados de éxito
  success: {
    bg: 'bg-green-50',
    bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-700 border-green-200',
  },
  // Estados de error/peligro
  error: {
    bg: 'bg-red-50',
    bgGradient: 'bg-gradient-to-br from-red-50 to-rose-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200',
  },
  danger: {
    bg: 'bg-red-50',
    bgGradient: 'bg-gradient-to-br from-red-50 to-rose-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200',
  },
  // Estados de advertencia
  warning: {
    bg: 'bg-amber-50',
    bgGradient: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  // Estados informativos
  info: {
    bg: 'bg-blue-50',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  // Estados neutrales
  neutral: {
    bg: 'bg-gray-50',
    bgGradient: 'bg-gradient-to-br from-gray-50 to-slate-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  // Estados primarios (marca)
  primary: {
    bg: 'bg-primary-50',
    bgGradient: 'bg-gradient-to-br from-primary-50 to-cyan-50',
    text: 'text-primary-700',
    border: 'border-primary-200',
    icon: 'text-primary-600',
    badge: 'bg-primary-100 text-primary-700 border-primary-200',
  },
} as const;

export type StatusType = keyof typeof STATUS_COLORS;

/**
 * Mapeo de estados de negocio a colores
 */
export const BUSINESS_STATUS_MAP = {
  // Stock
  stock: {
    high: STATUS_COLORS.success,      // Stock alto
    medium: STATUS_COLORS.warning,    // Stock medio
    low: STATUS_COLORS.error,         // Stock bajo
    empty: STATUS_COLORS.danger,      // Sin stock
  },
  // Pagos
  payment: {
    paid: STATUS_COLORS.success,      // Pagado
    pending: STATUS_COLORS.warning,   // Pendiente
    failed: STATUS_COLORS.error,      // Fallido
    refunded: STATUS_COLORS.info,     // Reembolsado
  },
  // Órdenes
  order: {
    pending: STATUS_COLORS.warning,    // Pendiente
    processing: STATUS_COLORS.info,    // Procesando
    shipped: STATUS_COLORS.primary,    // Enviado
    delivered: STATUS_COLORS.success,  // Entregado
    cancelled: STATUS_COLORS.error,    // Cancelado
  },
  // Usuarios/Estado activo
  active: {
    active: STATUS_COLORS.success,     // Activo
    inactive: STATUS_COLORS.neutral,   // Inactivo
    blocked: STATUS_COLORS.danger,     // Bloqueado
  },
} as const;

/**
 * Helper para obtener clases de badge según tipo de estado
 */
export function getStatusBadgeClasses(
  category: keyof typeof BUSINESS_STATUS_MAP,
  status: string
): string {
  const statusMap = BUSINESS_STATUS_MAP[category] as Record<string, typeof STATUS_COLORS[StatusType]>;
  const colorScheme = statusMap[status.toLowerCase()] || STATUS_COLORS.neutral;
  
  return `inline-flex px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border ${colorScheme.badge}`;
}

/**
 * Helper para obtener clases de icono según tipo de estado
 */
export function getStatusIconClasses(
  category: keyof typeof BUSINESS_STATUS_MAP,
  status: string
): string {
  const statusMap = BUSINESS_STATUS_MAP[category] as Record<string, typeof STATUS_COLORS[StatusType]>;
  const colorScheme = statusMap[status.toLowerCase()] || STATUS_COLORS.neutral;
  
  return colorScheme.icon;
}

/**
 * Helper para obtener clases de background según tipo de estado
 */
export function getStatusBackgroundClasses(
  category: keyof typeof BUSINESS_STATUS_MAP,
  status: string,
  gradient: boolean = false
): string {
  const statusMap = BUSINESS_STATUS_MAP[category] as Record<string, typeof STATUS_COLORS[StatusType]>;
  const colorScheme = statusMap[status.toLowerCase()] || STATUS_COLORS.neutral;
  
  return gradient ? colorScheme.bgGradient : colorScheme.bg;
}
