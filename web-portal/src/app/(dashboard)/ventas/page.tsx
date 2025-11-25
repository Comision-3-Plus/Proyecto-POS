/**
 * 📜 HISTORIAL DE VENTAS - Auditoría y Control de Caja
 * 
 * Features:
 * - Tabla completa de ventas con filtros
 * - Sheet lateral con detalle de items
 * - Anulación de ventas con confirmación
 * - Indicadores visuales de estado
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Receipt,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

// Hooks generados por Orval
import {
  useGetApiV1Ventas,
  usePatchApiV1VentasIdAnular,
} from '@/api/generated/ventas/ventas';

import type { VentaRead } from '@/api/generated/models';
import { formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

// ==================== SKELETON ====================
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg animate-pulse">
          <div className="w-16 h-16 bg-slate-200 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== VENTA DETAIL SHEET ====================
function VentaDetailSheet({
  venta,
  isOpen,
  onClose,
  onAnular,
}: {
  venta: VentaRead | null;
  isOpen: boolean;
  onClose: () => void;
  onAnular: (venta: VentaRead) => void;
}) {
  if (!venta) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Ticket #{venta.id.slice(0, 8).toUpperCase()}
          </SheetTitle>
          <SheetDescription>
            {format(new Date(venta.fecha), "PPP 'a las' HH:mm", { locale: es })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Estado</span>
            <Badge
              variant={venta.anulada ? 'destructive' : 'default'}
              className="gap-1"
            >
              {venta.anulada ? (
                <>
                  <XCircle className="h-3 w-3" />
                  Anulada
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Confirmada
                </>
              )}
            </Badge>
          </div>

          {/* Método de Pago */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Método de Pago</span>
            <Badge variant="outline" className="gap-1">
              {venta.metodo_pago === 'EFECTIVO' ? (
                <DollarSign className="h-3 w-3" />
              ) : (
                <CreditCard className="h-3 w-3" />
              )}
              {venta.metodo_pago}
            </Badge>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos ({venta.items.length})
            </h4>
            <div className="space-y-3">
              {venta.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.nombre_producto}</div>
                    <div className="text-xs text-slate-500">
                      {formatCurrency(item.precio_unitario)} × {item.cantidad} uds
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>TOTAL</span>
              <span className="text-indigo-600">{formatCurrency(venta.total)}</span>
            </div>
          </div>

          {/* Acciones */}
          {!venta.anulada && (
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => onAnular(venta)}
            >
              <Ban className="h-4 w-4" />
              Anular Venta
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==================== MAIN COMPONENT ====================
export default function VentasPage() {
  const queryClient = useQueryClient();
  const [selectedVenta, setSelectedVenta] = useState<VentaRead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [anularDialogOpen, setAnularDialogOpen] = useState(false);
  const [ventaToAnular, setVentaToAnular] = useState<VentaRead | null>(null);

  // ==================== QUERIES ====================
  const {
    data: ventas,
    isLoading,
    refetch,
  } = useGetApiV1Ventas({
    query: {
      refetchInterval: 60000, // Refresh cada minuto
    },
  });

  // ==================== MUTATIONS ====================
  const anularMutation = usePatchApiV1VentasIdAnular({
    mutation: {
      onSuccess: () => {
        toast.success('Venta anulada exitosamente');
        queryClient.invalidateQueries({ queryKey: ['ventas'] });
        setAnularDialogOpen(false);
        setVentaToAnular(null);
        setSheetOpen(false);
      },
      onError: () => {
        toast.error('Error al anular la venta');
      },
    },
  });

  // ==================== HANDLERS ====================
  const handleViewDetail = (venta: VentaRead) => {
    setSelectedVenta(venta);
    setSheetOpen(true);
  };

  const handleAnularClick = (venta: VentaRead) => {
    setVentaToAnular(venta);
    setAnularDialogOpen(true);
  };

  const handleConfirmAnular = () => {
    if (ventaToAnular) {
      anularMutation.mutate({ id: ventaToAnular.id });
    }
  };

  // ==================== STATS ====================
  const stats = {
    total: ventas?.length || 0,
    confirmadas: ventas?.filter((v) => !v.anulada).length || 0,
    anuladas: ventas?.filter((v) => v.anulada).length || 0,
    totalVentas: ventas?.reduce((sum, v) => (!v.anulada ? sum + v.total : sum), 0) || 0,
  };

  // ==================== RENDER ====================
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Historial de Ventas</h1>
        <p className="text-slate-500 mt-1">Auditoría y control de caja completo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Anuladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.anuladas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Recaudado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(stats.totalVentas)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Todas las Ventas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas && ventas.length > 0 ? (
                  ventas.map((venta) => (
                    <TableRow key={venta.id} className="cursor-pointer hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">
                          #{venta.id.slice(0, 8).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {venta.metodo_pago === 'EFECTIVO' ? (
                            <DollarSign className="h-3 w-3" />
                          ) : (
                            <CreditCard className="h-3 w-3" />
                          )}
                          {venta.metodo_pago}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {venta.items.length} producto{venta.items.length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{formatCurrency(venta.total)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={venta.anulada ? 'destructive' : 'default'}
                          className="gap-1"
                        >
                          {venta.anulada ? (
                            <>
                              <XCircle className="h-3 w-3" />
                              Anulada
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Confirmada
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(venta)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!venta.anulada && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAnularClick(venta)}
                            >
                              <Ban className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No hay ventas registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <VentaDetailSheet
        venta={selectedVenta}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAnular={handleAnularClick}
      />

      {/* Anular Confirmation */}
      <AlertDialog open={anularDialogOpen} onOpenChange={setAnularDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular esta venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a anular la venta <strong>#{ventaToAnular?.id.slice(0, 8)}</strong> por{' '}
              <strong>{formatCurrency(ventaToAnular?.total || 0)}</strong>.
              <br />
              <br />
              El stock de los productos se devolverá al inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAnular}
              className="bg-red-600 hover:bg-red-700"
              disabled={anularMutation.isPending}
            >
              {anularMutation.isPending ? 'Anulando...' : 'Anular Venta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
