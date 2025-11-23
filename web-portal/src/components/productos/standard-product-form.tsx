"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Producto } from "@/types";

interface StandardProductFormProps {
  producto?: Producto | null;
  formData: any;
  setFormData: (data: any) => void;
}

const TIPOS = ["BEBIDA", "SNACK", "HIGIENE", "LIMPIEZA", "OTRO"] as const;

export default function StandardProductForm({
  producto,
  formData,
  setFormData,
}: StandardProductFormProps) {
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🍬</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Producto Estándar</h4>
            <p className="text-sm text-blue-700">
              Perfecto para kioscos, drugstores y comercios generales. Escaneo rápido con código de barras
              para ventas ágiles.
            </p>
          </div>
        </div>
      </div>

      {/* Información Básica */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre del Producto *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Coca-Cola 500ml"
            required
          />
        </div>
        <div>
          <Label htmlFor="codigo_barras" className="flex items-center gap-2">
            Código de Barras *
            <span className="text-xs font-normal text-blue-600">Prioritario</span>
          </Label>
          <Input
            id="codigo_barras"
            value={formData.codigo_barras || ""}
            onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
            placeholder="Escanea o ingresa EAN/UPC"
            required
            autoFocus
          />
        </div>
      </div>

      {/* SKU y Tipo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Ej: COCA-500"
            required
          />
        </div>
        <div>
          <Label htmlFor="tipo">Categoría *</Label>
          <select
            id="tipo"
            value={formData.tipo || "OTRO"}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Precios */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="precio_venta">Precio de Venta *</Label>
          <Input
            id="precio_venta"
            type="number"
            step="0.01"
            value={formData.precio_venta}
            onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="precio_costo">Precio de Costo *</Label>
          <Input
            id="precio_costo"
            type="number"
            step="0.01"
            value={formData.precio_costo}
            onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Stock */}
      <div>
        <Label htmlFor="stock_actual">Stock Actual *</Label>
        <Input
          id="stock_actual"
          type="number"
          value={formData.stock_actual}
          onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
          required
        />
      </div>

      {/* Descripción Opcional */}
      <div>
        <Label htmlFor="descripcion">Descripción (Opcional)</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion || ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Información adicional del producto..."
          rows={3}
        />
      </div>
    </div>
  );
}
