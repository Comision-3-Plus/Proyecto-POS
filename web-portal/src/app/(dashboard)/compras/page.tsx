/**
 * 📦 PÁGINA DE COMPRAS
 * Gestión de órdenes de compra y recepción de mercadería
 */

'use client';

import { useState } from 'react';
import { useOrdenes, useRecibirOrden, useCrearOrden, useProveedores } from '@/hooks';
import { useProductos } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Package,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { ESTADO_ORDEN_LABELS, type DetalleOrdenCreate } from '@/types/compras';
import { toast } from 'sonner';

export default function ComprasPage() {
  const { data: ordenes, isLoading } = useOrdenes();
  const { data: proveedores } = useProveedores();
  const { data: productos } = useProductos();
  const recibirOrden = useRecibirOrden();
  const crearOrden = useCrearOrden();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [proveedorId, setProveedorId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<DetalleOrdenCreate[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioCosto, setPrecioCosto] = useState('');

  // Manejar recepción de mercadería
  const handleRecibir = async (ordenId: string) => {
    if (confirm('¿Confirmas que recibiste toda la mercadería de esta orden? Se actualizará el stock y los precios de costo.')) {
      await recibirOrden.mutateAsync(ordenId);
    }
  };

  // Agregar producto al detalle
  const handleAgregarProducto = () => {
    if (!productoSeleccionado || !cantidad || !precioCosto) {
      toast.error('Completa todos los campos del producto');
      return;
    }

    const cantidadNum = parseFloat(cantidad);
    const precioNum = parseFloat(precioCosto);

    if (cantidadNum <= 0 || precioNum <= 0) {
      toast.error('La cantidad y el precio deben ser mayores a 0');
      return;
    }

    setDetalles([
      ...detalles,
      {
        producto_id: productoSeleccionado,
        cantidad: cantidadNum,
        precio_costo_unitario: precioNum,
      },
    ]);

    // Limpiar campos
    setProductoSeleccionado('');
    setCantidad('');
    setPrecioCosto('');
  };

  // Remover producto del detalle
  const handleRemoverProducto = (index: number) => {
    setDetalles(detalles.filter((_: DetalleOrdenCreate, i: number) => i !== index));
  };

  // Crear orden
  const handleCrearOrden = async () => {
    if (!proveedorId) {
      toast.error('Selecciona un proveedor');
      return;
    }

    if (detalles.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    await crearOrden.mutateAsync({
      proveedor_id: proveedorId,
      observaciones: observaciones || null,
      detalles,
    });

    // Resetear formulario
    setProveedorId('');
    setObservaciones('');
    setDetalles([]);
    setSheetOpen(false);
  };

  // Calcular total del detalle
  const calcularTotal = () => {
    return detalles.reduce((sum: number, d: DetalleOrdenCreate) => sum + d.cantidad * d.precio_costo_unitario, 0);
  };

  // Obtener nombre del producto
  const getNombreProducto = (productoId: string) => {
    const producto = productos?.find((p: any) => p.id === productoId);
    return producto?.nombre || 'Producto desconocido';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600 mt-1">
            Gestión de órdenes de compra y recepción de mercadería
          </p>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Compra
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Nueva Orden de Compra</SheetTitle>
              <SheetDescription>
                Selecciona un proveedor y agrega los productos que deseas comprar
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Proveedor */}
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor *</Label>
                <select
                  id="proveedor"
                  value={proveedorId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProveedorId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.razon_social} ({p.cuit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  placeholder="Notas adicionales..."
                  value={observaciones}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setObservaciones(e.target.value)}
                />
              </div>

              {/* Agregar productos */}
              <Card className="p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Agregar Producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Producto</Label>
                    <select
                      value={productoSeleccionado}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProductoSeleccionado(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar</option>
                      {productos?.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={cantidad}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCantidad(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Precio Costo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={precioCosto}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrecioCosto(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAgregarProducto}
                  className="mt-3 w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar a la orden
                </Button>
              </Card>

              {/* Lista de productos */}
              {detalles.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Productos ({detalles.length})</h3>
                  <div className="space-y-2">
                    {detalles.map((detalle, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {getNombreProducto(detalle.producto_id)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {detalle.cantidad} x ${detalle.precio_costo_unitario.toFixed(2)} =
                            ${(detalle.cantidad * detalle.precio_costo_unitario).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverProducto(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </Card>
              )}

              {/* Botones */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCrearOrden}
                  disabled={crearOrden.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {crearOrden.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Crear Orden
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Tabla de órdenes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenes?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No hay órdenes de compra registradas</p>
                  </td>
                </tr>
              )}

              {ordenes?.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(orden.fecha_emision).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {orden.proveedor_razon_social}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${orden.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={
                        orden.estado === 'PENDIENTE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : orden.estado === 'RECIBIDA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {orden.estado === 'PENDIENTE' && <Clock className="w-3 h-3 mr-1 inline" />}
                      {orden.estado === 'RECIBIDA' && <CheckCircle className="w-3 h-3 mr-1 inline" />}
                      {orden.estado === 'CANCELADA' && <XCircle className="w-3 h-3 mr-1 inline" />}
                      {ESTADO_ORDEN_LABELS[orden.estado]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {orden.estado === 'PENDIENTE' && (
                      <Button
                        size="sm"
                        onClick={() => handleRecibir(orden.id)}
                        disabled={recibirOrden.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {recibirOrden.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Package className="w-4 h-4 mr-1" />
                            Recibir Mercadería
                          </>
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
