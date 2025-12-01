/**
 * Productos Screen - Premium Design
 * Gestión completa de productos con tabla premium y modal de creación
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter } from 'lucide-react';
import { useProductosQuery } from '@/hooks/useProductosQuery';
import Table, { Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import type { Product } from '@/types/api';

export default function Productos() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: productos = [], isLoading, error } = useProductosQuery();

  // Filter and sort
  const filteredProductos = productos
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.base_sku?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[sortBy];
      const bValue = (b as unknown as Record<string, unknown>)[sortBy];
      const modifier = sortOrder === 'asc' ? 1 : -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * modifier;
      }
      return 0;
    });

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'base_sku',
      header: 'Código',
      sortable: true,
      render: (p) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
          {p.base_sku || '-'}
        </code>
      ),
    },
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-medium text-gray-900">{p.name}</p>
          {p.description && (
            <p className="text-xs text-gray-500 truncate max-w-xs">
              {p.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      render: (p) => (
        <span className="inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-br from-primary-50 to-cyan-50 text-primary-700 border border-primary-200/50 shadow-sm">
          {p.category || 'Sin categoría'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Precio',
      sortable: false,
      align: 'right',
      render: (p) => (
        <span className="font-bold text-gray-900 text-base">
          ${p.variants?.[0]?.price?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: false,
      align: 'center',
      render: (p) => {
        const stock = p.variants?.[0]?.stock_total || 0;
        const isLow = stock < 10;
        return (
          <span
            className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
              isLow
                ? 'bg-gradient-to-br from-danger-50 to-rose-50 text-danger-700 border border-danger-200/50'
                : 'bg-gradient-to-br from-success-50 to-emerald-50 text-success-700 border border-success-200/50'
            }`}
          >
            {stock}
          </span>
        );
      },
    },
    {
      key: 'is_active',
      header: 'Estado',
      sortable: true,
      align: 'center',
      render: (p) => (
        <div className="flex items-center justify-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            p.is_active ? 'bg-gradient-to-r from-success-500 to-emerald-500 animate-pulse shadow-lg shadow-success-500/40' : 'bg-gray-400'
          }`} />
          <span
            className={`text-xs font-semibold ${
              p.is_active
                ? 'text-success-700'
                : 'text-gray-600'
            }`}
          >
            {p.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-danger-600 font-medium">Error al cargar productos</p>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6 bg-gradient-to-br from-gray-50/30 via-white/10 to-gray-100/20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-6"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Productos</h1>
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold shadow-lg shadow-primary-500/40">
              {productos.length}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Gestiona el catálogo completo de productos
          </p>
          
          {/* Mini stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-success-500 to-emerald-500 animate-pulse" />
              <span className="text-xs text-gray-600">
                Stock total: <span className="font-bold text-gray-900">{productos.reduce((sum, p) => sum + (p.variants?.[0]?.stock_total || 0), 0)}</span> unidades
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 animate-pulse" />
              <span className="text-xs text-gray-600">
                Valor: <span className="font-bold text-primary-600">${(productos.reduce((sum, p) => sum + ((p.variants?.[0]?.price || 0) * (p.variants?.[0]?.stock_total || 0)), 0)).toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>
        <Button variant="primary" size="md" className="shadow-lg shadow-primary-500/40 hover:shadow-xl hover:shadow-primary-500/50">
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <div className="flex-1 max-w-lg">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-focus-within:shadow-primary-500/50 transition-shadow">
              <Search className="w-4.5 h-4.5 text-white" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, código de barras o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-14 pr-4 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 transition-all"
            />
          </div>
        </div>
        <Button variant="secondary" size="md" className="h-12 shadow-md hover:shadow-lg hover:shadow-gray-200/40">
          <Filter className="w-5 h-5" />
          Filtros
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-auto rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/20"
      >
        <Table
          data={filteredProductos}
          columns={columns}
          keyExtractor={(p) => p.product_id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          isLoading={isLoading}
          emptyMessage="No se encontraron productos"
        />
      </motion.div>
    </div>
  );
}
