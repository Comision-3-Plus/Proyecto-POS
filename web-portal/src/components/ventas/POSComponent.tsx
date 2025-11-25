/**
 * Componente de POS (Punto de Venta)
 * Interfaz para procesar ventas con scanner
 */

'use client';

import { useState } from 'react';
import { useCheckout } from '@/hooks';
import type { ItemVentaInput } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';

export function POSComponent() {
  const [items, setItems] = useState<(ItemVentaInput & { nombre?: string; precio?: number })[]>([]);
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [scanCode, setScanCode] = useState('');

  const checkout = useCheckout();

  const addItem = (productoId: string, cantidad: number = 1) => {
    // Aquí deberías hacer un scan del producto para obtener los detalles
    setItems([...items, { producto_id: productoId, cantidad }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, cantidad: number) => {
    const newItems = [...items];
    newItems[index].cantidad = cantidad;
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + (item.precio || 0) * item.cantidad, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      await checkout.mutateAsync({
        items: items.map(({ producto_id, cantidad }) => ({ producto_id, cantidad })),
        metodo_pago: metodoPago as any,
      });

      // Limpiar carrito después del checkout
      setItems([]);
      setScanCode('');
    } catch (error) {
      console.error('Error en checkout:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Panel de scanner y productos */}
      <Card>
        <CardHeader>
          <CardTitle>Escanear Producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Escanear código de barras o SKU..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && scanCode) {
                  // Aquí deberías buscar el producto por SKU
                  // y agregarlo al carrito
                  console.log('Buscar producto:', scanCode);
                  setScanCode('');
                }
              }}
            />
            <Button variant="outline" onClick={() => console.log('Scan:', scanCode)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Panel de carrito */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({items.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de items */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium">{item.nombre || item.producto_id.substring(0, 8)}</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(item.precio || 0)} x {item.cantidad}
                  </p>
                </div>
                <Input
                  type="number"
                  className="w-20"
                  value={item.cantidad}
                  onChange={(e) => updateQuantity(index, parseFloat(e.target.value))}
                  min="0.01"
                  step="0.01"
                />
                <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {/* Total y método de pago */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger>
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PAYMENT_METHODS.EFECTIVO}>Efectivo</SelectItem>
                <SelectItem value={PAYMENT_METHODS.MERCADOPAGO}>MercadoPago</SelectItem>
                <SelectItem value={PAYMENT_METHODS.TARJETA_DEBITO}>Tarjeta Débito</SelectItem>
                <SelectItem value={PAYMENT_METHODS.TARJETA_CREDITO}>Tarjeta Crédito</SelectItem>
                <SelectItem value={PAYMENT_METHODS.TRANSFERENCIA}>Transferencia</SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={items.length === 0 || checkout.isPending}
            >
              {checkout.isPending ? 'Procesando...' : 'Cobrar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
