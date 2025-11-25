/**
 * 🛒 CART STORE - Zustand State Management
 * 
 * Gestiona el estado del carrito de compras para el POS.
 * Este es estado CLIENT-SIDE, no se persiste en el backend hasta el checkout.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ProductoScanRead } from '@/api/generated/models';

// ==================== TYPES ====================

export interface CartItem {
  producto: ProductoScanRead;
  cantidad: number;
  subtotal: number;
  notas?: string; // Para casos especiales (ej: "Sin cebolla")
}

export interface CartState {
  // Estado
  items: CartItem[];
  metodoPago: 'EFECTIVO' | 'MERCADOPAGO' | 'TARJETA' | 'transferencia';
  cliente?: {
    nombre?: string;
    email?: string;
    cuit?: string;
  };
  
  // Computed values
  total: number;
  cantidadItems: number;
  
  // Actions
  addItem: (producto: ProductoScanRead, cantidad?: number) => void;
  removeItem: (productoId: string) => void;
  updateQuantity: (productoId: string, cantidad: number) => void;
  updateNotas: (productoId: string, notas: string) => void;
  setMetodoPago: (metodo: CartState['metodoPago']) => void;
  setCliente: (cliente: CartState['cliente']) => void;
  clearCart: () => void;
  
  // Helpers
  getItem: (productoId: string) => CartItem | undefined;
  hasStock: (productoId: string, cantidad: number) => boolean;
}

// ==================== HELPERS ====================

/**
 * Calcula el total del carrito
 */
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
};

/**
 * Calcula cantidad total de items
 */
const calculateItemCount = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.cantidad, 0);
};

// ==================== STORE ====================

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        items: [],
        metodoPago: 'EFECTIVO',
        cliente: undefined,
        total: 0,
        cantidadItems: 0,
        
        // ==================== ACTIONS ====================
        
        /**
         * Agregar item al carrito
         * Si ya existe, incrementa la cantidad
         */
        addItem: (producto, cantidad = 1) => {
          set((state) => {
            const existingItem = state.items.find(item => item.producto.id === producto.id);
            
            // Si ya existe, incrementar cantidad
            if (existingItem) {
              const newItems = state.items.map(item =>
                item.producto.id === producto.id
                  ? {
                      ...item,
                      cantidad: item.cantidad + cantidad,
                      subtotal: (item.cantidad + cantidad) * producto.precio_venta,
                    }
                  : item
              );
              
              return {
                items: newItems,
                total: calculateTotal(newItems),
                cantidadItems: calculateItemCount(newItems),
              };
            }
            
            // Si no existe, agregar nuevo item
            const newItem: CartItem = {
              producto,
              cantidad,
              subtotal: producto.precio_venta * cantidad,
            };
            
            const newItems = [...state.items, newItem];
            
            return {
              items: newItems,
              total: calculateTotal(newItems),
              cantidadItems: calculateItemCount(newItems),
            };
          });
        },
        
        /**
         * Eliminar item del carrito
         */
        removeItem: (productoId) => {
          set((state) => {
            const newItems = state.items.filter(item => item.producto.id !== productoId);
            
            return {
              items: newItems,
              total: calculateTotal(newItems),
              cantidadItems: calculateItemCount(newItems),
            };
          });
        },
        
        /**
         * Actualizar cantidad de un item
         */
        updateQuantity: (productoId, cantidad) => {
          set((state) => {
            // Si cantidad es 0 o negativa, eliminar el item
            if (cantidad <= 0) {
              const newItems = state.items.filter(item => item.producto.id !== productoId);
              return {
                items: newItems,
                total: calculateTotal(newItems),
                cantidadItems: calculateItemCount(newItems),
              };
            }
            
            const newItems = state.items.map(item =>
              item.producto.id === productoId
                ? {
                    ...item,
                    cantidad,
                    subtotal: cantidad * item.producto.precio_venta,
                  }
                : item
            );
            
            return {
              items: newItems,
              total: calculateTotal(newItems),
              cantidadItems: calculateItemCount(newItems),
            };
          });
        },
        
        /**
         * Actualizar notas de un item
         */
        updateNotas: (productoId, notas) => {
          set((state) => ({
            items: state.items.map(item =>
              item.producto.id === productoId
                ? { ...item, notas }
                : item
            ),
          }));
        },
        
        /**
         * Establecer método de pago
         */
        setMetodoPago: (metodo) => {
          set({ metodoPago: metodo });
        },
        
        /**
         * Establecer información del cliente
         */
        setCliente: (cliente) => {
          set({ cliente });
        },
        
        /**
         * Limpiar carrito completamente (después del checkout)
         */
        clearCart: () => {
          set({
            items: [],
            metodoPago: 'EFECTIVO',
            cliente: undefined,
            total: 0,
            cantidadItems: 0,
          });
        },
        
        // ==================== HELPERS ====================
        
        /**
         * Obtener un item específico del carrito
         */
        getItem: (productoId) => {
          return get().items.find(item => item.producto.id === productoId);
        },
        
        /**
         * Verificar si hay stock suficiente
         */
        hasStock: (productoId, cantidad) => {
          const item = get().items.find(item => item.producto.id === productoId);
          if (!item) return true; // Si no está en el carrito, asumir que hay stock
          
          const totalCantidad = item.cantidad + cantidad;
          return totalCantidad <= item.producto.stock_actual;
        },
      }),
      {
        name: 'nexus-pos-cart', // Key en localStorage
        partialize: (state) => ({
          // Solo persistir items y método de pago
          items: state.items,
          metodoPago: state.metodoPago,
        }),
      }
    ),
    {
      name: 'CartStore', // Nombre en Redux DevTools
    }
  )
);
