/**
 * Componente de tabla de productos
 */

'use client';

import { useState } from 'react';
import { useProductos, useDeleteProducto } from '@/hooks';
import type { ProductoRead } from '@/types/api';
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
import { Pencil, Trash2, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ProductosTableProps {
  onEdit?: (producto: ProductoRead) => void;
  onView?: (producto: ProductoRead) => void;
}

export function ProductosTable({ onEdit, onView }: ProductosTableProps) {
  const [filters, setFilters] = useState({
    search: '',
    tipo: undefined as string | undefined,
    is_active: true,
  });

  const { data: productos, isLoading, error } = useProductos(filters);
  const deleteProducto = useDeleteProducto();

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      await deleteProducto.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando productos...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error al cargar productos: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar por SKU o nombre..."
          className="flex-1 px-4 py-2 border rounded-md"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="px-4 py-2 border rounded-md"
          value={filters.tipo || ''}
          onChange={(e) => setFilters({ ...filters, tipo: e.target.value || undefined })}
        >
          <option value="">Todos los tipos</option>
          <option value="general">General</option>
          <option value="ropa">Ropa</option>
          <option value="pesable">Pesable</option>
        </select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Precio Venta</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos && productos.length > 0 ? (
              productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell className="font-medium">{producto.sku}</TableCell>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{producto.tipo}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(producto.precio_venta)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        producto.stock_actual <= 10
                          ? 'text-red-600 font-semibold'
                          : 'text-green-600'
                      }
                    >
                      {producto.stock_actual}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={producto.is_active ? 'success' : 'secondary'}>
                      {producto.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(producto)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(producto)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(producto.id)}
                        disabled={deleteProducto.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
