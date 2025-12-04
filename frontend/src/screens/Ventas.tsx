/**
 * Ventas / POS Screen - Enterprise Edition
 * Sistema de Punto de Venta de Alto Rendimiento con Checkout Profesional
 * 
 * @module screens/Ventas
 * @description Pantalla principal de ventas con soporte para hotkeys y modo offline
 * 
 * Features:
 * - Modal de checkout profesional con múltiples métodos de pago
 * - Hotkeys para productividad (F5, ESC, F2, DEL)
 * - Banner de modo offline
 * - Búsqueda y escaneo de productos
 * - Gestión de carrito en tiempo real
 * 
 * @author Tech Lead - Enterprise POS System
 * @version 2.0.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Scan,
  Plus,
  Trash2,
  Search,
  Tag,
  Download,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Gift,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import PaymentModal, { PaymentData } from '@/components/pos/PaymentModal';
import { useProductosQuery } from '@/hooks/useProductosQuery';
import { useCheckout, useScanProducto } from '@/hooks/useVentasQuery';
import { useToast } from '@/context/ToastContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface CartItem {
  variant_id: string;
  product_id: string;
  nombre: string;
  sku: string;
  precio: number;
  cantidad: number;
}

export default function Ventas() {
  // State Management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldScan, setShouldScan] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { data: productos = [] } = useProductosQuery();
  const { data: scannedProduct, isError: scanError } = useScanProducto(scanInput, shouldScan);
  const checkoutMutation = useCheckout();
  const { error: showError, success: showSuccess } = useToast();
  const { isOnline, wasOffline } = useNetworkStatus();

  // ==================== HOTKEYS ====================
  
  /**
   * F5: Abrir Checkout
   */
  useHotkeys('f5', (e) => {
    e.preventDefault();
    if (cart.length > 0 && !showPaymentModal) {
      setShowPaymentModal(true);
    }
  }, [cart, showPaymentModal]);

  /**
   * ESC: Cancelar/Cerrar Modal
   */
  useHotkeys('esc', () => {
    if (showPaymentModal) {
      setShowPaymentModal(false);
    }
  }, [showPaymentModal]);

  /**
   * F2: Focus en Buscador de Productos
   */
  useHotkeys('f2', (e) => {
    e.preventDefault();
    searchInputRef.current?.focus();
  });

  /**
   * DEL: Eliminar item seleccionado del carrito
   */
  useHotkeys('delete', () => {
    if (cart.length > 0) {
      // Eliminar último item del carrito
      const lastItem = cart[cart.length - 1];
      if (lastItem) {
        eliminarDelCarrito(lastItem.variant_id);
      }
    }
  }, [cart]);

  // ==================== EFFECTS ====================
  
  /**
   * Efecto para agregar producto escaneado al carrito
   */
  useEffect(() => {
    if (scannedProduct && shouldScan) {
      agregarAlCarrito({
        variant_id: scannedProduct.id,
        product_id: scannedProduct.id,
        nombre: scannedProduct.nombre,
        sku: scannedProduct.sku,
        precio: scannedProduct.precio_venta,
        cantidad: 1,
      });
      setScanInput('');
      setShouldScan(false);
    }
    if (scanError && shouldScan) {
      showError('Producto no encontrado');
      setScanInput('');
      setShouldScan(false);
    }
  }, [scannedProduct, scanError, shouldScan]);

  const agregarAlCarrito = (item: CartItem) => {
    setCart(prevCart => {
      const existing = prevCart.find(i => i.variant_id === item.variant_id);
      if (existing) {
        return prevCart.map(i =>
          i.variant_id === item.variant_id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prevCart, item];
    });
  };

  const actualizarCantidad = (variant_id: string, delta: number) => {
    setCart(prevCart =>
      prevCart
        .map(item =>
          item.variant_id === variant_id
            ? { ...item, cantidad: Math.max(0, item.cantidad + delta) }
            : item
        )
        .filter(item => item.cantidad > 0)
    );
  };

  const eliminarDelCarrito = (variant_id: string) => {
    setCart(prevCart => prevCart.filter(item => item.variant_id !== variant_id));
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    setShouldScan(true);
  };

  /**
   * Maneja el checkout con datos de pago del modal
   */
  const handlePaymentConfirm = async (paymentData: PaymentData) => {
    if (cart.length === 0) {
      showError('El carrito está vacío');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/api/v1/ventas-simple/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            variant_id: item.variant_id,
            cantidad: item.cantidad,
          })),
          metodo_pago: paymentData.metodo_pago,
          monto_recibido: paymentData.monto_recibido,
          monto_cambio: paymentData.monto_cambio,
          terminal_id: paymentData.terminal_id,
          codigo_autorizacion: paymentData.codigo_autorizacion,
          qr_id: paymentData.qr_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al procesar venta');
      }

      const data = await response.json();
      
      // Limpiar carrito y cerrar modal
      setCart([]);
      setShowPaymentModal(false);
      showSuccess(`Venta #${data.id} procesada con éxito`);
      
    } catch (error) {
      console.error('Error en checkout:', error);
      showError(error instanceof Error ? error.message : 'Error al procesar venta');
    }
  };

  /**
   * Legacy checkout handler (deprecated - usar PaymentModal)
   */
  const handleCheckout = async (metodo_pago: 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito') => {
    if (cart.length === 0) {
      showError('El carrito está vacío');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/api/v1/ventas-simple/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            variant_id: item.variant_id,
            cantidad: item.cantidad,
          })),
          metodo_pago,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al procesar venta');
      }

      const data = await response.json();
      
      // Limpiar carrito
      setCart([]);
      showSuccess(`¡Venta procesada! Total: $${data.total.toFixed(2)}`);
    } catch (error: any) {
      console.error('Error en checkout:', error);
      showError(error.message || 'Error al procesar venta');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const tax = subtotal * 0.21;
  const total = subtotal + tax;

  // Filtrar productos para búsqueda rápida
  const productosFiltrados = productos.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.base_sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const limpiarVenta = () => {
    if (cart.length > 0) {
      if (window.confirm('¿Estás seguro de que deseas limpiar la venta actual?')) {
        setCart([]);
        setScanInput('');
        setSearchQuery('');
        showSuccess('Venta limpiada');
      }
    } else {
      setCart([]);
      setScanInput('');
      setSearchQuery('');
    }
  };

  const exportarVentas = () => {
    showSuccess('Función de exportación en desarrollo');
    // TODO: Implementar exportación de ventas
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50/30 via-white/10 to-gray-100/20">
      
      {/* ==================== OFFLINE BANNER ==================== */}
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg"
        >
          <WifiOff className="w-5 h-5 text-white" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Modo sin conexión</p>
            <p className="text-xs text-amber-50">Las ventas se sincronizarán automáticamente al reconectar</p>
          </div>
          <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
        </motion.div>
      )}

      {wasOffline && isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
          <p className="text-sm font-semibold text-white">Conexión restaurada - sincronizando datos...</p>
        </motion.div>
      )}

      {/* Header Superior con Botones */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200/50 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ventas / POS</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sistema de punto de venta</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={exportarVentas}
            className="shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={limpiarVenta}
            className="shadow-md shadow-primary-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        </div>
      </div>

      {/* Contenedor Principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel Izquierdo - Productos */}
        <div className="flex-1 flex flex-col border-r border-gray-100">
          {/* Header */}
          <div className="border-b border-gray-200/50 bg-white/85 backdrop-blur-2xl shadow-sm shadow-gray-200/20">
            <div className="px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                Punto de Venta
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Escanea o busca productos</p>
            </div>
          </div>

        {/* Scanner Input */}
        <div className="p-6 bg-gradient-to-br from-primary-50/30 via-white/20 to-cyan-50/30 border-b border-gray-200/50 backdrop-blur-xl">
          <form onSubmit={handleScan} className="flex gap-3">
            <div className="flex-1 relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-focus-within:shadow-primary-500/50 transition-shadow">
                <Scan className="w-4.5 h-4.5 text-white" />
              </div>
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Escanear código de barras o RFID..."
                className="w-full h-12 pl-14 pr-4 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 transition-all"
                autoFocus
              />
            </div>
            <Button variant="primary" size="md" type="submit" className="h-12 px-5 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40">
              <Plus className="w-4 h-4" />
              Agregar
            </Button>
          </form>
        </div>

        {/* Search */}
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Quick Products Grid - Con datos reales */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {productosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Tag className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-sm font-medium text-gray-500">
                {searchQuery ? 'No se encontraron productos' : 'No hay productos disponibles'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {productosFiltrados.slice(0, 20).map((producto) => {
                const variant = producto.variants?.[0];
                if (!variant) return null;

                return (
                  <motion.button
                    key={variant.variant_id}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => agregarAlCarrito({
                      variant_id: variant.variant_id,
                      product_id: producto.product_id,
                      nombre: producto.name,
                      sku: variant.sku,
                      precio: variant.price,
                      cantidad: 1,
                    })}
                    className="relative flex flex-col items-start gap-2 p-4 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-2xl hover:border-primary-300/60 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 text-left group overflow-hidden"
                  >
                    {/* Stock badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-semibold shadow-lg shadow-emerald-500/40 z-10">
                      {variant.stock_total || 0} stock
                    </div>
                    
                    {/* Image placeholder con gradiente */}
                    <div className="w-full aspect-square bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-cyan-500/5" />
                      <Tag className="w-12 h-12 text-gray-300 group-hover:text-primary-400 transition-colors duration-300" />
                    </div>
                    
                    <div className="w-full">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                        {producto.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">SKU: {variant.sku}</p>
                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
                        <p className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          ${variant.price.toLocaleString()}
                        </p>
                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel Derecho - Carrito */}
      <div className="w-[420px] flex flex-col bg-gradient-to-b from-white/95 to-gray-50/30 backdrop-blur-xl border-l border-gray-200/50 shadow-2xl shadow-gray-200/40">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
            Carrito
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">Carrito vacío</p>
              <p className="text-xs text-gray-400 mt-1">
                Escanea un producto para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <motion.div
                  key={item.variant_id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="relative flex items-start gap-3 p-4 rounded-xl border border-gray-200/60 hover:border-gray-300/60 bg-white/80 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-200/40 transition-all group"
                >
                  {/* Delete button absoluto */}
                  <button 
                    onClick={() => eliminarDelCarrito(item.variant_id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-danger-500 hover:to-danger-600 hover:border-transparent shadow-sm hover:shadow-lg hover:shadow-danger-500/40 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-semibold text-gray-900 truncate pr-8">
                      {item.nombre}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.sku}</p>
                    
                    {/* Contador premium */}
                    <div className="flex items-center gap-2 mt-3">
                      <button 
                        onClick={() => actualizarCantidad(item.variant_id, -1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gradient-to-br hover:from-gray-500 hover:to-gray-600 hover:border-transparent text-gray-600 hover:text-white transition-all shadow-sm hover:shadow-lg"
                      >
                        -
                      </button>
                      <div className="px-3 py-1 rounded-lg bg-gradient-to-br from-primary-50 to-cyan-50 border border-primary-200/50">
                        <span className="text-sm font-bold text-primary-700">
                          {item.cantidad}
                        </span>
                      </div>
                      <button 
                        onClick={() => actualizarCantidad(item.variant_id, 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gradient-to-br hover:from-primary-500 hover:to-primary-600 hover:border-transparent text-gray-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-primary-500/40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right pt-1">
                    <p className="text-base font-bold text-gray-900">
                      ${(item.precio * item.cantidad).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ${item.precio.toLocaleString()} c/u
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200/60 px-6 py-5 space-y-3 bg-gradient-to-b from-gray-50/30 to-white/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Subtotal</span>
            <span className="font-semibold text-gray-900">
              ${subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">IVA (21%)</span>
            <span className="font-semibold text-gray-900">
              ${tax.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200/60">
            <span className="text-base font-bold text-gray-900">Total</span>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/40">
              <span className="text-2xl font-black text-white">
                ${total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200/60 p-6 space-y-3 bg-white/50">
          <Button
            variant="secondary"
            size="lg"
            className="w-full justify-start shadow-md hover:shadow-lg hover:shadow-gray-200/40"
            disabled={cart.length === 0}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Gift className="w-4 h-4 text-white" />
            </div>
            Aplicar Descuento / Loyalty
          </Button>
          
          {/* BOTÓN PRINCIPAL DE CHECKOUT - Abre PaymentModal */}
          <Button
            variant="primary"
            size="lg"
            className="w-full shadow-lg shadow-primary-500/40 hover:shadow-xl hover:shadow-primary-500/50"
            disabled={cart.length === 0 || !isOnline}
            onClick={() => setShowPaymentModal(true)}
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="flex-1">Procesar Pago (F5)</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">
              ${total.toLocaleString()}
            </span>
          </Button>
          
          {/* Botones Legacy (mantener por compatibilidad) */}
          <div className="grid grid-cols-2 gap-3 opacity-50">
            <Button
              variant="secondary"
              size="md"
              className="shadow-md"
              disabled={cart.length === 0 || checkoutMutation.isPending}
              onClick={() => handleCheckout('efectivo')}
            >
              <Banknote className="w-4 h-4 mr-2" />
              Efectivo
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="shadow-md"
              disabled={cart.length === 0 || checkoutMutation.isPending}
              onClick={() => handleCheckout('tarjeta_credito')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Tarjeta
            </Button>
          </div>
        </div>
      </div>
      </div>

      {/* ==================== PAYMENT MODAL ==================== */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePaymentConfirm}
          total={total}
        />
      )}
    </div>
  );
}
