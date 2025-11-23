"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";
import ProductFormFactory from "@/components/productos/product-form-factory";
import type { Producto } from "@/types";

interface ProductoFormModalProps {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
}

export default function ProductoFormModal({
  open,
  onClose,
  producto,
}: ProductoFormModalProps) {
  const { createProducto, updateProducto } = useProducts();
  const isEdit = !!producto;

  const [formData, setFormData] = useState<any>({
    nombre: "",
    sku: "",
    precio_venta: "",
    precio_costo: "",
    stock_actual: "",
    tipo: "OTRO",
    codigo_barras: "",
    atributos: {},
  });

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre,
        sku: producto.sku,
        precio_venta: producto.precio_venta.toString(),
        precio_costo: producto.precio_costo.toString(),
        stock_actual: producto.stock_actual.toString(),
        tipo: producto.tipo?.toUpperCase() || "OTRO",
        codigo_barras: producto.codigo_barras || "",
        descripcion: producto.descripcion || "",
        atributos: producto.atributos || {},
      });
    } else {
      setFormData({
        nombre: "",
        sku: "",
        precio_venta: "",
        precio_costo: "",
        stock_actual: "",
        tipo: "OTRO",
        codigo_barras: "",
        descripcion: "",
        atributos: {},
      });
    }
  }, [producto, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: Partial<Producto> = {
      nombre: formData.nombre,
      sku: formData.sku,
      precio_venta: parseFloat(formData.precio_venta),
      precio_costo: parseFloat(formData.precio_costo),
      stock_actual: parseFloat(formData.stock_actual), // Permitir decimales para pesables
      tipo: formData.tipo.toLowerCase(),
      codigo_barras: formData.codigo_barras || undefined,
      descripcion: formData.descripcion || undefined,
      atributos: formData.atributos,
      pesable: formData.atributos?.pesable || false,
    };

    if (isEdit) {
      updateProducto({ id: producto.id, data });
    } else {
      createProducto(data);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Factory de Formularios Adaptativos */}
          <ProductFormFactory
            producto={producto}
            formData={formData}
            setFormData={setFormData}
          />

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {isEdit ? "Actualizar Producto" : "Crear Producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
