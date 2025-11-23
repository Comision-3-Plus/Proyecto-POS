"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ProductoFormModal from "./producto-form-modal";
import type { Producto } from "@/types";

export default function ProductosPage() {
  const { productos, isLoading, deleteProducto } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  const filteredProducts = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedProducto(null);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      deleteProducto(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Productos</h1>
          <p className="text-gray-600">Gestión de inventario</p>
        </div>
        <Button onClick={handleNew} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Buscar por nombre o SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla de Productos */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Rubro</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell>
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    {producto.imagen_url ? (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{producto.nombre}</TableCell>
                <TableCell className="text-gray-600">{producto.sku}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {producto.tipo}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      producto.stock_actual < 10
                        ? "text-red-600 font-semibold"
                        : "text-gray-900"
                    }
                  >
                    {producto.stock_actual}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(producto.precio_venta)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(producto)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(producto.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal de Formulario */}
      <ProductoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        producto={selectedProducto}
      />
    </div>
  );
}
