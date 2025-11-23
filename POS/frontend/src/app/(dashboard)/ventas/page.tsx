"use client";

import { useSales } from "@/hooks/use-sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Receipt, TrendingUp } from "lucide-react";

export default function VentasPage() {
  const { data: ventas, isLoading } = useSales();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-96 w-full bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  const totalVentas = ventas?.reduce((sum, venta) => sum + venta.total, 0) || 0;
  const cantidadVentas = ventas?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ventas</h1>
          <p className="text-muted-foreground">Historial de todas las ventas realizadas</p>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cantidadVentas}</div>
            <p className="text-xs text-muted-foreground">tickets emitidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVentas)}</div>
            <p className="text-xs text-muted-foreground">ingresos totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {!ventas || ventas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay ventas registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {new Date(venta.fecha).toLocaleDateString("es-AR")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(venta.fecha).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{venta.metodo_pago}</Badge>
                    </TableCell>
                    <TableCell>{venta.cantidad_items} productos</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(venta.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">COMPLETADA</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
