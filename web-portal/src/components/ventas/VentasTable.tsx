/**
 * Componente de tabla de ventas
 */

'use client';

import { useVentas } from '@/hooks';
import type { VentaListRead } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface VentasTableProps {
  onView?: (venta: VentaListRead) => void;
}

export function VentasTable({ onView }: VentasTableProps) {
  const { data: ventas, isLoading, error } = useVentas();

  const getMetodoPagoBadge = (metodo: string) => {
    const variants = {
      EFECTIVO: 'default',
      MERCADOPAGO: 'secondary',
      TARJETA: 'outline',
    } as const;

    return (
      <Badge variant={variants[metodo as keyof typeof variants] || 'outline'}>
        {metodo}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando ventas...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error al cargar ventas: {error.message}</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>ID</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Método de Pago</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ventas && ventas.length > 0 ? (
            ventas.map((venta) => (
              <TableRow key={venta.id}>
                <TableCell>{formatDate(venta.fecha)}</TableCell>
                <TableCell className="font-mono text-xs">{venta.id.substring(0, 8)}...</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(venta.total)}
                </TableCell>
                <TableCell>{getMetodoPagoBadge(venta.metodo_pago)}</TableCell>
                <TableCell className="text-right">{venta.cantidad_items}</TableCell>
                <TableCell className="text-right">
                  {onView && (
                    <Button variant="ghost" size="icon" onClick={() => onView(venta)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No se encontraron ventas
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
