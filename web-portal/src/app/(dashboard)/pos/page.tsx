"use client";

import { useState, useEffect } from "react";
import { Producto, ItemVenta } from "@/types";
import { useProducts } from "@/hooks/use-products";
import { useCreateSale } from "@/hooks/use-sales";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScanLine, Search, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ProductCardPOS from "@/components/pos/product-card-pos";
import PaymentModal from "./payment-modal";

interface CartItem extends ItemVenta {
  producto: Producto;
  metadata?: {
    variante?: { color: string; talle: string };
    varianteKey?: string;
    peso?: number;
    precioCalculado?: number;
  };
}

export default function POSPage() {
  const { productos } = useProducts();
  const createSaleMutation = useCreateSale();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Scanner de códigos de barras (solo para productos general/kiosco)
  useBarcodeScanner({
    onScan: (code) => {
      const producto = productos.find(
        (p) => p.codigo_barras === code || p.sku === code
      );
      if (producto) {
        // Solo agregar directo si NO es pesable ni tiene variantes
        const isPesable = producto.atributos?.pesable || producto.pesable;
        const hasVariants = producto.atributos?.colores || producto.atributos?.talles;
        
        if (!isPesable && !hasVariants) {
          addToCart(producto, { cantidad: 1 });
        }
      }
    },
  });

  // Filtro de productos
  const filteredProducts = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (producto: Producto, metadata?: any) => {
    const newItem: CartItem = {
      producto_id: producto.id,
      cantidad: metadata?.cantidad || 1,
      precio_unitario: metadata?.precioCalculado || producto.precio_venta,
      producto,
      metadata,
    };

    setCart((prev) => {
      // Para productos con variantes, crear un ID único por variante
      if (metadata?.varianteKey) {
        const uniqueId = `${producto.id}-${metadata.varianteKey}`;
        const existing = prev.find(
          (item) => `${item.producto_id}-${item.metadata?.varianteKey}` === uniqueId
        );
        
        if (existing) {
          return prev.map((item) =>
            `${item.producto_id}-${item.metadata?.varianteKey}` === uniqueId
              ? { ...item, cantidad: item.cantidad + metadata.cantidad }
              : item
          );
        }
      }
      
      // Para productos pesables o productos normales sin match previo
      return [...prev, newItem];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, i) =>
          i === index
            ? { ...item, cantidad: item.cantidad + delta }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.cantidad * (item.precio_unitario || 0),
    0
  );

  const handleCompleteSale = async (metodoPago: "EFECTIVO" | "MERCADOPAGO") => {
    await createSaleMutation.mutateAsync({
      items: cart.map(({ producto, metadata, ...item }) => item),
      metodo_pago: metodoPago,
    });
    setCart([]);
    setPaymentModalOpen(false);
  };

  const renderCartItemLabel = (item: CartItem) => {
    let label = item.producto.nombre;
    
    if (item.metadata?.variante) {
      label += ` (${item.metadata.variante.color} - ${item.metadata.variante.talle})`;
    }
    
    if (item.metadata?.peso) {
      label += ` - ${item.metadata.peso}kg`;
    }
    
    return label;
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      {/* Panel Izquierdo - Productos */}
      <div className="flex-1 flex flex-col">
        {/* Barra de Búsqueda */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar producto o escanear código de barras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
            autoFocus
          />
          <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {/* Grilla de Productos - Ahora con componentes adaptativos */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((producto) => (
              <ProductCardPOS
                key={producto.id}
                producto={producto}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Panel Derecho - Carrito */}
      <div className="w-96 flex flex-col bg-white rounded-lg border border-gray-200 shadow-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Ticket ({cart.length} items)
          </h2>
        </div>

        {/* Items del Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ShoppingCart className="h-16 w-16 mx-auto mb-2 opacity-20" />
                <p>Carrito vacío</p>
              </div>
            </div>
          ) : (
            cart.map((item, index) => (
              <Card key={`${item.producto_id}-${index}`} className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm flex-1">
                    {renderCartItemLabel(item)}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeFromCart(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(index, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold w-8 text-center">
                      {item.metadata?.peso ? item.metadata.peso.toFixed(2) : item.cantidad}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(index, 1)}
                      disabled={!!item.metadata?.peso} // No editable si es pesable
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.precio_unitario || 0)} {item.metadata?.peso ? "/kg" : "c/u"}
                    </p>
                    <p className="font-bold">
                      {formatCurrency(item.cantidad * (item.precio_unitario || 0))}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer - Total y Cobrar */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">TOTAL</span>
            <span className="text-3xl font-bold">{formatCurrency(total)}</span>
          </div>
          <Button
            variant="success"
            size="xl"
            className="w-full"
            disabled={cart.length === 0}
            onClick={() => setPaymentModalOpen(true)}
          >
            COBRAR
          </Button>
        </div>
      </div>

      {/* Modal de Pago */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        total={total}
        onConfirm={handleCompleteSale}
      />
    </div>
  );
}
