/**
 * Utilidades de formateo para números, moneda y fechas
 * Configurado para Argentina (es-AR)
 */

/**
 * Formatea un número como moneda argentina (ARS)
 * @example formatCurrency(1500) // "$1.500,00"
 * @example formatCurrency(1500, false) // "$1.500"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  showDecimals: boolean = true
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (num === null || num === undefined || isNaN(num)) {
    return '$0,00';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Formatea un número con separadores de miles argentinos
 * @example formatNumber(1500) // "1.500"
 * @example formatNumber(1500.50, 2) // "1.500,50"
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 0
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formatea números grandes en formato compacto (K, M, B)
 * @example formatCompactNumber(1500) // "1,5K"
 * @example formatCompactNumber(1500000) // "1,5M"
 */
export function formatCompactNumber(
  value: number | string | null | undefined
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Formatea porcentaje
 * @example formatPercent(0.15) // "15%"
 * @example formatPercent(0.1567, 2) // "15,67%"
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 0
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (num === null || num === undefined || isNaN(num)) {
    return '0%';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formatea fecha en formato argentino
 * @example formatDate(new Date()) // "03/12/2025"
 */
export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(dateObj);
}

/**
 * Formatea fecha y hora en formato argentino
 * @example formatDateTime(new Date()) // "03/12/2025 17:30"
 */
export function formatDateTime(
  date: Date | string | null | undefined
): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Formatea fecha relativa (hace X días/horas)
 * @example formatRelativeTime(new Date(Date.now() - 86400000)) // "hace 1 día"
 */
export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'hace unos segundos';
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  if (diffDay < 30) return `hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
  
  return formatDate(dateObj);
}
