/**
 * Servicios Centralizados - Nexus POS
 * Exporta todos los servicios de la aplicación
 */

// Core Services
export { authService } from './auth.service';
export { default as productosService } from './productos.service';
export { default as ventasService } from './ventas.service';
export { default as dashboardService } from './dashboard.service';
export { default as clientesService } from './clientes.service';
export { default as stockService } from './stock.service';
export { default as reportesService } from './reportes.service';

// New Services
export { default as cajaService } from './caja.service';
export { default as comprasService } from './compras.service';
export { default as usuariosService } from './usuarios.service';
export { default as insightsService } from './insights.service';
export { default as inventarioService } from './inventario.service';
export { default as exportarService } from './exportar.service';
export { default as afipService } from './afip.service';
export { default as analyticsService } from './analytics.service';
export { default as integrationsService } from './integrations.service';
export { default as paymentsService } from './payments.service';
export { default as adminService } from './admin.service';

// Types exports
export type * from './auth.service';
export type * from './clientes.service';
export type * from './stock.service';
export type * from './reportes.service';
export type * from './caja.service';
export type * from './compras.service';
export type * from './usuarios.service';
export type * from './insights.service';
export type * from './inventario.service';
export type * from './afip.service';
export type * from './analytics.service';
export type * from './integrations.service';
export type * from './payments.service';
export type * from './admin.service';
