/**
 * Tipos generados basados en el backend API
 * Estos tipos se sincronizarán automáticamente con Orval
 */

// ==================== AUTH TYPES ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user?: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  rol: 'owner' | 'cajero' | 'admin' | 'super_admin';
  tienda_id: string;
  tienda?: TiendaInfo;
}

export interface TiendaInfo {
  id: string;
  nombre: string;
  rubro: string;
  is_active?: boolean;
}

// ==================== PRODUCTO TYPES ====================
export interface ProductoBase {
  nombre: string;
  sku: string;
  descripcion?: string | null;
  precio_venta: number;
  precio_costo: number;
  unidad_medida: string;
  tipo: string;
  atributos?: Record<string, any>;
}

export interface ProductoCreate extends ProductoBase {
  stock_actual?: number;
}

export interface ProductoUpdate extends Partial<ProductoBase> {
  stock_actual?: number;
  is_active?: boolean;
}

export interface ProductoRead extends ProductoBase {
  id: string;
  stock_actual: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tienda_id: string;
  stock_calculado?: number | null;
}

export interface ProductoScanRead {
  id: string;
  nombre: string;
  sku: string;
  precio_venta: number;
  stock_actual: number;
  tipo: string;
  tiene_stock: boolean;
}

export interface ProductoBajoStock {
  id: string;
  sku: string;
  nombre: string;
  stock_actual: number;
  stock_minimo?: number;
  debe_reabastecer?: boolean;
}

// ==================== VENTA TYPES ====================
export interface ItemVentaInput {
  producto_id: string;
  cantidad: number;
}

export interface VentaCreate {
  items: ItemVentaInput[];
  metodo_pago: 'EFECTIVO' | 'MERCADOPAGO' | 'TARJETA' | 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia';
}

export interface DetalleVentaRead {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_sku: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaRead {
  id: string;
  fecha: string;
  total: number;
  metodo_pago: string;
  tienda_id: string;
  detalles: DetalleVentaRead[];
  created_at: string;
}

export interface VentaListRead {
  id: string;
  fecha: string;
  total: number;
  metodo_pago: string;
  created_at: string;
  cantidad_items: number;
  factura?: Factura | null;
}

export interface VentaResumen {
  venta_id: string;
  fecha: string;
  total: number;
  metodo_pago: string;
  cantidad_items: number;
  mensaje: string;
}

// ==================== FACTURACIÓN TYPES ====================
export interface FacturarVentaRequest {
  tipo_factura: 'A' | 'B' | 'C';
  cliente_doc_tipo: 'CUIT' | 'DNI' | 'CUIL';
  cliente_doc_nro: string;
  cuit_cliente?: string;
}

export interface FacturarVentaResponse {
  factura_id: string;
  cae: string;
  vencimiento_cae: string;
  punto_venta: number;
  numero_comprobante: number;
  tipo_factura: string;
  monto_total: number;
  mensaje: string;
}

export interface Factura {
  id: string;
  venta_id: string;
  tienda_id: string;
  tipo_factura: string;
  punto_venta: number;
  numero_comprobante: number;
  cae: string;
  vencimiento_cae: string;
  cliente_doc_tipo: string;
  cliente_doc_nro: string;
  monto_neto: number;
  monto_iva: number;
  monto_total: number;
  url_pdf?: string;
  created_at: string;
}

// ==================== DASHBOARD TYPES ====================
export interface MetricaVentas {
  hoy: number;
  ayer: number;
  semana: number;
  mes: number;
  tickets_emitidos: number;
  cambio_diario_porcentaje: number;
  cambio_semanal_porcentaje: number;
  ultimos_7_dias: Array<{ fecha: string; total: number }>;
}

export interface MetricaInventario {
  total_productos: number;
  productos_activos: number;
  productos_bajo_stock: number;
  valor_total_inventario: number;
}

export interface ProductoDestacado {
  id: string;
  nombre: string;
  sku: string;
  stock: number;
  ventas_hoy: number;
}

export interface DashboardResumen {
  ventas: MetricaVentas;
  inventario: MetricaInventario;
  productos_destacados: ProductoDestacado[];
  alertas_criticas: number;
  ultima_actualizacion: string;
}

// ==================== REPORTES TYPES ====================
export interface ResumenVentas {
  periodo_inicio: string;
  periodo_fin: string;
  total_ventas: number;
  monto_total: number;
  ticket_promedio: number;
  metodo_pago_mas_usado?: string | null;
  producto_mas_vendido?: string | null;
}

export interface ProductoMasVendido {
  producto_id: string;
  sku: string;
  nombre: string;
  cantidad_vendida: number;
  total_recaudado: number;
  veces_vendido: number;
}

export interface RentabilidadProducto {
  producto_id: string;
  nombre: string;
  sku: string;
  cantidad_vendida: number;
  costo_total: number;
  ingreso_total: number;
  utilidad_bruta: number;
  margen_porcentaje: number;
}

export interface VentasPorPeriodo {
  fecha: string;
  cantidad_ventas: number;
  total_vendido: number;
  ticket_promedio: number;
}

// ==================== INSIGHTS TYPES ====================
export interface InsightRead {
  id: string;
  tipo: string;
  mensaje: string;
  nivel_urgencia: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  is_active: boolean;
  extra_data: Record<string, any>;
  created_at: string;
}

export interface InsightRefreshResponse {
  mensaje: string;
  insights_generados: Record<string, any>;
  total: number;
}

// ==================== TIENDA TYPES ====================
export interface TiendaCreate {
  nombre: string;
  rubro: string;
}

export interface TiendaUpdate {
  nombre?: string | null;
  rubro?: string | null;
}

export interface TiendaResponse {
  id: string;
  nombre: string;
  rubro: string;
  is_active: boolean;
}

// ==================== USUARIO TYPES ====================
export interface UsuarioCreate {
  email: string;
  password: string;
  full_name: string;
  rol?: string;
  tienda_id: string;
}

export interface UsuarioResponse {
  id: string;
  email: string;
  full_name: string;
  rol: string;
  tienda_id: string;
  is_active: boolean;
}

// ==================== ONBOARDING TYPES ====================
export interface OnboardingData {
  nombre_tienda: string;
  rubro: string;
  email: string;
  password: string;
  nombre_completo: string;
  rol?: string;
}

export interface OnboardingResponse {
  tienda: TiendaResponse;
  usuario: UsuarioResponse;
}

// ==================== INVENTARIO TYPES ====================
export interface AjusteStockRequest {
  producto_id: string;
  cantidad_nueva: number;
  motivo: string;
}

// ==================== PAGOS TYPES ====================
export interface PaymentPreference {
  preference_id: string;
  init_point: string;
  qr_code_url?: string;
}

// ==================== QUERY PARAMS TYPES ====================
export interface ProductosQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  tipo?: 'general' | 'ropa' | 'pesable';
  is_active?: boolean;
}

export interface VentasQueryParams {
  skip?: number;
  limit?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface ProductosBusquedaParams extends ProductosQueryParams {
  q?: string;
  precio_min?: number;
  precio_max?: number;
  stock_min?: number;
  solo_activos?: boolean;
}
