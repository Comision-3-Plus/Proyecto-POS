/**
 * 📦 INVENTARIO - Stock Control & Adjustments
 * 
 * Features:
 * - Alertas de stock bajo/crítico
 * - Ajustes rápidos de inventario
 * - Motivos de ajuste (rotura, ingreso, error)
 * - Historial de movimientos
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  FileText,
  Search,
  Plus,
  Minus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Hooks generados por Orval
import {
  useObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet,
  useAjustarStockManualApiV1InventarioAjustarStockPost,
} from '@/api/generated/inventario/inventario';
import { useListarProductosApiV1ProductosGet } from '@/api/generated/productos/productos';

import { formatCurrency } from '@/lib/utils';

// ==================== SKELETONS ====================
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function InventarioPage() {
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [cantidad, setCantidad] = useState<number>(0);
  const [motivo, setMotivo] = useState<'rotura' | 'ingreso' | 'error' | ''>('');

  // ==================== QUERIES ====================
  const {
    data: alertas,
    isLoading: loadingAlertas,
    refetch: refetchAlertas,
  } = useObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet(
    {},
    {
      query: {
        refetchInterval: 60000, // 1 minuto
      },
    }
  );

  const {
    data: productos,
    isLoading: loadingProductos,
  } = useListarProductosApiV1ProductosGet(
    { search: busqueda },
    {
      query: {
        enabled: busqueda.length >= 2,
      },
    }
  );

  const { mutate: ajustarStock, isPending: ajustando } = useAjustarStockManualApiV1InventarioAjustarStockPost({
    mutation: {
      onSuccess: () => {
        toast.success('Stock ajustado correctamente');
        setProductoSeleccionado(null);
        setBusqueda('');
        setCantidad(0);
        setMotivo('');
        refetchAlertas();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.detail || 'Error al ajustar stock');
      },
    },
  });

  // ==================== HANDLERS ====================
  const handleSelectProducto = (producto: any) => {
    setProductoSeleccionado(producto);
    setBusqueda('');
  };

  const handleAjustar = () => {
    if (!productoSeleccionado) {
      toast.error('Selecciona un producto');
      return;
    }
    if (cantidad === 0) {
      toast.error('La cantidad debe ser diferente de 0');
      return;
    }
    if (!motivo) {
      toast.error('Selecciona un motivo');
      return;
    }

    ajustarStock({
      data: {
        producto_id: productoSeleccionado.id,
        cantidad_nueva: productoSeleccionado.stock_actual + cantidad,
        motivo: motivo || 'Ajuste manual',
      },
    });
  };

  // ==================== STATS ====================
  const stats = {
    alertasCriticas: alertas?.filter((a: any) => a.stock_actual <= a.stock_minimo).length || 0,
    alertasBajas: alertas?.filter((a: any) => a.stock_actual > a.stock_minimo && a.stock_actual <= a.stock_minimo * 2).length || 0,
  };

  // ==================== RENDER ====================
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Control de Inventario</h1>
        <p className="text-slate-500 mt-1">Ajustes y alertas de stock</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Stock Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.alertasCriticas}</div>
            <p className="text-xs text-slate-500 mt-1">Productos en riesgo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-500" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.alertasBajas}</div>
            <p className="text-xs text-slate-500 mt-1">Próximos a agotar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertas?.length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Alertas de Stock Bajo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAlertas ? (
              <TableSkeleton />
            ) : alertas && alertas.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Stock Mínimo</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertas.map((alerta: any) => {
                      const isCritico = alerta.stock_actual <= alerta.stock_minimo;
                      return (
                        <TableRow key={alerta.producto_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{alerta.nombre_producto}</div>
                              {alerta.sku && (
                                <div className="text-xs text-slate-500">{alerta.sku}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCritico ? 'destructive' : 'secondary'}>
                              {alerta.stock_actual} {alerta.unidad_medida}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {alerta.stock_minimo} {alerta.unidad_medida}
                          </TableCell>
                          <TableCell>
                            {isCritico ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Crítico
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-700">
                                <TrendingDown className="h-3 w-3" />
                                Bajo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatCurrency(alerta.precio_venta)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No hay alertas de stock</p>
                <p className="text-sm mt-1">Todos los productos tienen stock suficiente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Ajuste Rápido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ajuste Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buscar Producto */}
            <div className="space-y-2">
              <Label htmlFor="busqueda">Buscar Producto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="busqueda"
                  placeholder="SKU o nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Resultados */}
              {busqueda.length >= 2 && productos && productos.length > 0 && (
                <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                  {productos.map((producto: any) => (
                    <button
                      key={producto.id}
                      onClick={() => handleSelectProducto(producto)}
                      className="w-full text-left p-3 hover:bg-slate-50 border-b last:border-0 transition-colors"
                    >
                      <div className="font-medium text-sm">{producto.nombre}</div>
                      <div className="text-xs text-slate-500 flex items-center justify-between mt-1">
                        <span>{producto.sku}</span>
                        <Badge variant="secondary" className="text-xs">
                          Stock: {producto.stock_actual}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Producto Seleccionado */}
            {productoSeleccionado && (
              <>
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="font-medium text-sm text-indigo-900">
                    {productoSeleccionado.nombre}
                  </div>
                  <div className="text-xs text-indigo-600 mt-1">
                    Stock actual: {productoSeleccionado.stock_actual} {productoSeleccionado.unidad_medida}
                  </div>
                </div>

                <Separator />

                {/* Cantidad */}
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCantidad((prev) => prev - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="cantidad"
                      type="number"
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                      className="text-center font-mono text-lg"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCantidad((prev) => prev + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Usa números negativos para decrementar stock
                  </p>
                </div>

                {/* Motivo */}
                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo del Ajuste</Label>
                  <Select value={motivo} onValueChange={(v: any) => setMotivo(v)}>
                    <SelectTrigger id="motivo">
                      <SelectValue placeholder="Selecciona un motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Ingreso de Mercadería
                        </div>
                      </SelectItem>
                      <SelectItem value="rotura">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Rotura / Pérdida
                        </div>
                      </SelectItem>
                      <SelectItem value="error">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-yellow-500" />
                          Corrección de Error
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview */}
                {cantidad !== 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Stock actual:</span>
                      <span className="font-mono">{productoSeleccionado.stock_actual}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-600">Ajuste:</span>
                      <span className={`font-mono font-bold ${cantidad > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cantidad > 0 ? '+' : ''}{cantidad}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Nuevo stock:</span>
                      <span className="font-mono font-bold text-lg">
                        {productoSeleccionado.stock_actual + cantidad}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botón de Ajuste */}
                <Button
                  onClick={handleAjustar}
                  disabled={!productoSeleccionado || cantidad === 0 || !motivo || ajustando}
                  className="w-full"
                  size="lg"
                >
                  {ajustando ? (
                    'Procesando...'
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Confirmar Ajuste
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
