/**
 * Tipos TypeScript para la API de Nexus POS
 * Mantener sincronizado con el backend FastAPI
 */

// ==================== AUTH ====================
export interface Tienda {
  id: string;
  nombre: string;
  rubro: string;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  rol: 'owner' | 'cajero' | 'admin' | 'vendedor' | 'encargado' | 'supervisor' | 'gerente_regional';
  is_active: boolean;
  tienda_id: string;
  tienda?: Tienda;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    rol: string;
    tienda_id: string;
    tienda: Tienda;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ==================== PRODUCTOS ====================
export interface Size {
  id: number;
  name: string;
  sort_order: number;
}

export interface Color {
  id: number;
  name: string;
  hex_code?: string;
}

export interface Location {
  location_id: string;
  name: string;
  type: 'STORE' | 'WAREHOUSE' | 'VIRTUAL';
  address?: string;
  is_default: boolean;
}

export interface ProductVariant {
  variant_id: string;
  sku: string;
  size_id?: number;
  size_name?: string;
  color_id?: number;
  color_name?: string;
  price: number;
  barcode?: string;
  is_active: boolean;
  stock_total?: number;
}

export interface Product {
  product_id: string;
  tienda_id: string;
  name: string;
  base_sku: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants_count?: number;
  variants?: ProductVariant[];
}

export interface StockByLocation {
  location_id: string;
  location_name: string;
  location_type: string;
  stock: number;
}

export interface ProductVariantWithStock extends ProductVariant {
  stock_by_location: StockByLocation[];
}

export interface CreateProductVariant {
  size_id?: number;
  color_id?: number;
  price: number;
  barcode?: string;
  initial_stock: number;
  location_id?: string;
}

export interface CreateProductRequest {
  name: string;
  base_sku: string;
  description?: string;
  category?: string;
  variants: CreateProductVariant[];
}

// ==================== VENTAS ====================
export interface VentaItem {
  producto_id: string;
  cantidad: number;
}

export interface VentaCreate {
  items: VentaItem[];
  metodo_pago: 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia';
}

export interface DetalleVenta {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_sku: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  fecha: string;
  total: number;
  metodo_pago: string;
  status_pago: 'pendiente' | 'pagado' | 'anulado';
  tienda_id: string;
  detalles: DetalleVenta[];
  created_at: string;
}

export interface VentaResumen {
  venta_id?: string;
  fecha: string;
  total: number;
  metodo_pago: string;
  cantidad_items: number;
  mensaje: string;
}

export interface ProductoScan {
  id: string;
  nombre: string;
  sku: string;
  precio_venta: number;
  stock_actual: number;
  tipo: string;
  tiene_stock: boolean;
}

// ==================== CAJA ====================
export interface SesionCaja {
  id: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial: number;
  monto_final?: number;
  diferencia?: number;
  estado: 'abierta' | 'cerrada';
  usuario_id: string;
  tienda_id: string;
}

export interface MovimientoCaja {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  descripcion: string;
  created_at: string;
  sesion_id: string;
}

// ==================== REPORTES ====================
export interface ResumenVentas {
  total_ventas: number;
  cantidad_ventas: number;
  ticket_promedio: number;
  metodos_pago: Record<string, number>;
  ventas_por_dia: Array<{
    fecha: string;
    total: number;
    cantidad: number;
  }>;
}

export interface ProductoMasVendido {
  producto_id: string;
  nombre: string;
  sku: string;
  cantidad_vendida: number;
  total_vendido: number;
}

// ==================== OMS ====================
export interface OrdenOmnicanal {
  id: string;
  order_number: string;
  source: 'SHOPIFY' | 'WOOCOMMERCE' | 'MERCADOLIBRE' | 'MANUAL';
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  customer_name: string;
  customer_email?: string;
  total: number;
  created_at: string;
  items: Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
    price: number;
  }>;
}

// ==================== AFIP ====================
export interface Factura {
  id: string;
  tipo_factura: 'A' | 'B' | 'C';
  punto_venta: number;
  numero_comprobante: number;
  cae: string;
  vencimiento_cae: string;
  monto_total: number;
  fecha_emision: string;
  venta_id: string;
}

export interface FacturarVentaRequest {
  tipo_factura: 'A' | 'B' | 'C';
  cliente_doc_tipo: string;
  cliente_doc_nro: string;
}

// ==================== LOYALTY ====================
export interface CustomerWallet {
  id: string;
  customer_id: string;
  balance: number;
  points: number;
  tier: string;
}

// ==================== CIRCUIT BREAKER STATUS ====================
export interface CircuitBreakerStatus {
  service: string;
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failure_count: number;
  last_failure?: string;
}

// ==================== API ERROR ====================
export interface APIError {
  success: false;
  error: {
    message: string;
    code: number;
    details?: Record<string, unknown>;
    validation_errors?: Array<{
      field: string;
      message: string;
      type: string;
    }>;
  };
  request_id: string;
}

// ==================== PAGINATION ====================
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ==================== QUERY PARAMS ====================
export interface QueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
}
