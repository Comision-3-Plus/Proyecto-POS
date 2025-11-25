/**
 * Punto de entrada para todos los servicios
 */

export { authService } from './auth.service';
export { productosService } from './productos.service';
export { ventasService } from './ventas.service';
export { dashboardService } from './dashboard.service';
export { reportesService } from './reportes.service';
export { inventarioService } from './inventario.service';
export { insightsService } from './insights.service';
export { cajaService } from './caja.service';

// Re-exportar tipos comunes
export type * from '@/types/api';
