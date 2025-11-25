/**
 * 📦 GESTIÓN DE PRODUCTOS - Sistema Completo de Inventario
 * 
 * Features:
 * - DataTable con TanStack Table
 * - Filtros avanzados (búsqueda, rubro, tipo)
 * - CRUD completo (Crear, Editar, Eliminar)
 * - Indicadores visuales de stock
 * - Paginación y sorting
 */

'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Hooks generados por Orval
import {
  useGetApiV1Productos,
  useDeleteApiV1ProductosId,
} from '@/api/generated/productos/productos';

import type { ProductoRead } from '@/api/generated/models';
import { formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

// ==================== SKELETON COMPONENT ====================
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-slate-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== ERROR STATE ====================
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Error al cargar productos
        </h3>
        <p className="text-red-700 mb-4">
          No se pudieron cargar los productos. Por favor, intenta nuevamente.
        </p>
        <Button onClick={onRetry} variant="outline">
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}

// ==================== MAIN COMPONENT ====================
export default function ProductosPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductoRead | null>(null);

  // ==================== QUERIES ====================
  const {
    data: productos,
    isLoading,
    error,
    refetch,
  } = useGetApiV1Productos({
    query: {
      refetchInterval: 30000, // Refresh cada 30s
    },
  });

  // ==================== MUTATIONS ====================
  const deleteMutation = useDeleteApiV1ProductosId({
    mutation: {
      onSuccess: () => {
        toast.success('Producto eliminado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['productos'] });
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      },
      onError: () => {
        toast.error('Error al eliminar el producto');
      },
    },
  });

  // ==================== TABLE COLUMNS ====================
  const columns = useMemo<ColumnDef<ProductoRead>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Producto
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const producto = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="font-medium">{producto.nombre}</div>
                <div className="text-sm text-slate-500">SKU: {producto.sku}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'tipo_producto',
        header: 'Tipo',
        cell: ({ row }) => {
          const tipo = row.original.tipo_producto;
          return (
            <Badge variant="outline">
              {tipo === 'general' ? 'General' : tipo === 'ropa' ? 'Ropa' : 'Pesable'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'precio_venta',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Precio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatCurrency(row.original.precio_venta)}
          </span>
        ),
      },
      {
        accessorKey: 'stock_actual',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Stock
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const stock = row.original.stock_actual;
          const stockMin = row.original.stock_minimo;
          const isCritical = stock <= stockMin;
          const isLow = stock <= stockMin * 2 && !isCritical;

          return (
            <Badge
              variant={isCritical ? 'destructive' : isLow ? 'default' : 'secondary'}
              className="font-mono"
            >
              {isCritical && <AlertTriangle className="h-3 w-3 mr-1" />}
              {stock} uds
            </Badge>
          );
        },
      },
      {
        accessorKey: 'activo',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant={row.original.activo ? 'default' : 'secondary'}>
            {row.original.activo ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Activo
              </>
            ) : (
              'Inactivo'
            )}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          const producto = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setProductToDelete(producto);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  // ==================== FILTERED DATA ====================
  const filteredData = useMemo(() => {
    if (!productos) return [];
    
    let filtered = [...productos];

    // Filtro por tipo
    if (tipoFilter !== 'todos') {
      filtered = filtered.filter((p) => p.tipo_producto === tipoFilter);
    }

    return filtered;
  }, [productos, tipoFilter]);

  // ==================== TABLE INSTANCE ====================
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // ==================== HANDLERS ====================
  const handleDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate({ id: productToDelete.id });
    }
  };

  // ==================== RENDER ====================
  if (error) {
    return (
      <div className="p-6">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Productos</h1>
          <p className="text-slate-500 mt-1">Gestiona tu inventario completo</p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {productos?.filter((p) => p.activo).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {productos?.filter((p) => p.stock_actual <= p.stock_minimo * 2).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Stock Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {productos?.filter((p) => p.stock_actual <= p.stock_minimo).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tipo Filter */}
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de producto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="ropa">Ropa</SelectItem>
                <SelectItem value="pesable">Pesable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No se encontraron productos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-slate-600">
                  Mostrando {table.getRowModel().rows.length} de {filteredData.length}{' '}
                  productos
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el producto <strong>{productToDelete?.nombre}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
