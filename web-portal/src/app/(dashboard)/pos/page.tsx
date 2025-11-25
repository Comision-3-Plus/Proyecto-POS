/**
 * 🛒 MÓDULO POS (PUNTO DE VENTA) - COMPONENTE PRINCIPAL
 * 
 * Este es el corazón del sistema. Implementa:
 * 1. Escáner de productos (código de barras + búsqueda)
 * 2. Carrito de compras (Zustand)
 * 3. Checkout y procesamiento de pagos
 * 4. Manejo de errores (Circuit Breaker, validaciones)
 * 
 * Stack: React Query (datos servidor) + Zustand (estado cliente)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// 🤖 Hooks generados automáticamente por Orval
import {
  useGetApiV1ProductosScanCodigo,
  useGetApiV1ProductosBuscar,
  usePostApiV1VentasCheckout,
} from '@/api/generated/endpoints';

import type { VentaCreateRequest } from '@/api/generated/models';

export default function POSPage() {
  const router = useRouter();
  
  // ==================== ZUSTAND STATE ====================
  const {
    items,
    total,
    cantidadItems,
    metodoPago,
    addItem,
    removeItem,
    updateQuantity,
    setMetodoPago,
    clearCart,
  } = useCartStore();

  // ==================== LOCAL STATE ====================
  const [searchQuery, setSearchQuery] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // ==================== REACT QUERY HOOKS ====================
  
  /**
   * 🔍 Buscar productos por texto
   */
  const {
    data: searchResults,
    isLoading: isSearching,
  } = useGetApiV1ProductosBuscar(
    { q: searchQuery },
    {
      query: {
        enabled: searchQuery.length >= 3, // Solo buscar si hay al menos 3 caracteres
        staleTime: 1000 * 30, // 30 segundos
      },
    }
  );

  /**
   * 📦 Escanear producto por código
   */
  const {
    data: scannedProduct,
    isLoading: isScanning,
    error: scanError,
  } = useGetApiV1ProductosScanCodigo(
    scanCode,
    {
      query: {
        enabled: scanCode.length > 0,
        onSuccess: (data) => {
          // ✅ Producto encontrado - agregar al carrito
          addItem(data);
          toast.success(`✅ ${data.nombre} agregado al carrito`);
          setScanCode(''); // Limpiar input
          scanInputRef.current?.focus(); // Volver a enfocar para siguiente escaneo
        },
        onError: (error: any) => {
          // ❌ Producto no encontrado
          toast.error(`❌ Producto no encontrado: ${scanCode}`);
          setScanCode('');
          scanInputRef.current?.focus();
        },
      },
    }
  );

  /**
   * 💳 Procesar checkout (crear venta)
   */
  const checkoutMutation = usePostApiV1VentasCheckout({
    mutation: {
      onSuccess: (venta) => {
        // ✅ Venta creada exitosamente
        toast.success(
          <div className="flex flex-col gap-1">
            <div className="font-semibold">✅ Venta procesada exitosamente</div>
            <div className="text-sm">Ticket #{venta.id.slice(0, 8)}</div>
            <div className="text-sm font-mono">${venta.total.toFixed(2)}</div>
          </div>
        );

        // Limpiar carrito
        clearCart();
        setIsCheckoutDialogOpen(false);

        // Opcional: Redirigir a la venta creada o imprimir ticket
        // router.push(`/ventas/${venta.id}`);
      },
      onError: (error: any) => {
        // ❌ Error en checkout
        const status = error.response?.status;
        
        // 🛡️ Circuit Breaker abierto (servicio de pagos offline)
        if (status === 503) {
          toast.warning(
            'Sistema de pagos offline. Por favor, cobre en efectivo.',
            { duration: 5000 }
          );
          // Permitir procesar como efectivo
          setMetodoPago('EFECTIVO');
        } else {
          toast.error(`Error al procesar venta: ${error.message}`);
        }
      },
    },
  });

  // ==================== EFFECTS ====================
  
  /**
   * Auto-focus en input de escaneo al montar
   */
  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  // ==================== HANDLERS ====================

  /**
   * Manejar escaneo de código de barras
   */
  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanCode.trim()) {
      // Triggerea el query de escaneo
      setScanCode(scanCode.trim());
    }
  };

  /**
   * Agregar producto desde búsqueda
   */
  const handleAddFromSearch = (producto: any) => {
    addItem(producto);
    toast.success(`✅ ${producto.nombre} agregado`);
    setSearchQuery('');
  };

  /**
   * Procesar checkout
   */
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Crear payload de venta
    const ventaData: VentaCreateRequest = {
      items: items.map(item => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio_venta,
      })),
      metodo_pago: metodoPago,
    };

    // Ejecutar mutation
    checkoutMutation.mutate({ data: ventaData });
  };

  // ==================== RENDER ====================

  return (
    <div className="h-screen flex bg-gray-50">
      {/* ==================== PANEL IZQUIERDO: PRODUCTOS ==================== */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <h1 className="text-2xl font-bold text-gray-900">🛒 Punto de Venta</h1>
        </div>

        {/* Búsqueda y Escaneo */}
        <div className="p-4 bg-white border-b space-y-3">
          {/* Escaneo de código de barras */}
          <form onSubmit={handleScan} className="flex gap-2">
            <Input
              ref={scanInputRef}
              type="text"
              placeholder="Escanear código de barras..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              className="flex-1 text-lg"
              disabled={isScanning}
            />
            <Button type="submit" disabled={isScanning}>
              {isScanning ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>
          </form>

          {/* Búsqueda por texto */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Resultados de búsqueda */}
          {searchResults && searchResults.length > 0 && (
            <Card>
              <CardContent className="p-2 max-h-60 overflow-y-auto">
                {searchResults.map((producto) => (
                  <div
                    key={producto.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleAddFromSearch(producto)}
                  >
                    <div>
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-sm text-gray-500">
                        ${producto.precio_venta.toFixed(2)} | Stock: {producto.stock_actual}
                      </div>
                    </div>
                    <Plus className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Atajos de productos frecuentes (TODO: implementar) */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-center text-gray-400 mt-20">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p>Escanea productos o búscalos por nombre</p>
          </div>
        </div>
      </div>

      {/* ==================== PANEL DERECHO: CARRITO ==================== */}
      <div className="w-96 bg-white border-l flex flex-col">
        {/* Header Carrito */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Carrito</h2>
            <Badge variant="secondary">{cantidadItems} items</Badge>
          </div>
        </div>

        {/* Items del Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Carrito vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.producto.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{item.producto.nombre}</div>
                      <div className="text-sm text-gray-500">
                        ${item.producto.precio_venta.toFixed(2)} c/u
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.producto.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-12 text-center font-medium">
                        {item.cantidad}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="font-semibold">
                      ${item.subtotal.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Totales y Checkout */}
        <div className="border-t p-4 space-y-4">
          {/* Total */}
          <div className="flex items-center justify-between text-2xl font-bold">
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {/* Método de Pago */}
          <Select
            value={metodoPago}
            onValueChange={(value: any) => setMetodoPago(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EFECTIVO">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Efectivo
                </div>
              </SelectItem>
              <SelectItem value="TARJETA">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tarjeta
                </div>
              </SelectItem>
              <SelectItem value="MERCADOPAGO">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  MercadoPago
                </div>
              </SelectItem>
              <SelectItem value="transferencia">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Transferencia
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Botones */}
          <div className="space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setIsCheckoutDialogOpen(true)}
              disabled={items.length === 0 || checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Procesar Venta
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={clearCart}
              disabled={items.length === 0}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar Venta
            </Button>
          </div>
        </div>
      </div>

      {/* ==================== DIALOG DE CONFIRMACIÓN ==================== */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Venta</DialogTitle>
            <DialogDescription>
              ¿Confirmas procesar esta venta?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{cantidadItems}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Método de pago:</span>
                <span className="font-medium">{metodoPago}</span>
              </div>
              <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t">
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCheckoutDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Venta'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
