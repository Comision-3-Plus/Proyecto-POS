// Producto (estructura de Supabase)
export interface Producto {
  id: string; // UUID en Supabase
  nombre: string;
  sku: string;
  descripcion?: string;
  precio_venta: number; // Cambiado de 'precio' a 'precio_venta'
  precio_costo: number;
  stock_actual: number; // Cambiado de 'stock' a 'stock_actual'
  tipo: string; // Categoría/tipo de producto
  atributos?: Record<string, any>; // JSON flexible para atributos adicionales
  is_active: boolean;
  tienda_id: string;
  created_at?: string;
  updated_at?: string;
  
  // Campos opcionales para compatibilidad con frontend anterior
  precio?: number; // Alias de precio_venta
  stock?: number; // Alias de stock_actual
  codigo_barras?: string;
  imagen_url?: string;
  pesable?: boolean;
  peso_kg?: number;
}

// Venta
export interface ItemVenta {
  producto_id: string; // UUID en Supabase
  cantidad: number;
  precio_unitario?: number;
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
  id: string; // UUID en Supabase
  fecha: string;
  total: number;
  metodo_pago: string;
  created_at: string;
  cantidad_items: number;
  items?: ItemVenta[]; // Solo en respuesta de checkout
  detalles?: DetalleVenta[]; // Solo en detalle completo
  estado?: "COMPLETADA" | "CANCELADA";
}

// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: string; // UUID en Supabase
  email: string;
  full_name: string; // Cambiado de 'nombre' a 'full_name' (Supabase)
  nombre?: string; // Alias para compatibilidad
  rol: string;
  tienda: Tienda;
  tienda_id: string;
}

export interface Tienda {
  id: string; // UUID en Supabase
  nombre: string;
  rubro: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

// Dashboard
export interface DashboardMetrics {
  ventas_hoy: number;
  tickets_emitidos: number;
  productos_bajo_stock: number;
  ventas_semana: Array<{ fecha: string; total: number }>;
}

export interface Insight {
  id: string;
  tipo: string;
  mensaje: string;
  nivel_urgencia: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  is_active: boolean;
  extra_data: Record<string, any>;
  created_at: string;
}
