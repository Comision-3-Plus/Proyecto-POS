/**
 * Componente de lista de alertas de inventario
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { inventarioService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, PackageX } from 'lucide-react';

export function InventoryAlerts() {
  const { data: alertas } = useQuery({
    queryKey: ['inventario', 'alertas-stock-bajo'],
    queryFn: () => inventarioService.getAlertasStockBajo(10),
  });

  if (!alertas || alertas.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertas de Stock ({alertas.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alertas.slice(0, 5).map((producto) => (
            <div
              key={producto.id}
              className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-md"
            >
              <div className="flex items-center gap-3">
                <PackageX className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="font-medium text-sm">{producto.nombre}</p>
                  <p className="text-xs text-gray-600">SKU: {producto.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-orange-600">
                  Stock: {producto.stock_actual}
                </p>
                {producto.debe_reabastecer && (
                  <Badge variant="destructive" className="text-xs">
                    Urgente
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
