"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Producto } from "@/types";

interface WeightedProductFormProps {
  producto?: Producto | null;
  formData: any;
  setFormData: (data: any) => void;
}

export default function WeightedProductForm({
  producto,
  formData,
  setFormData,
}: WeightedProductFormProps) {
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🥩</div>
          <div>
            <h4 className="font-semibold text-green-900 mb-1">Producto Pesable</h4>
            <p className="text-sm text-green-700">
              Define el precio por kilogramo. En el momento de la venta, podrás ingresar el peso exacto
              y el sistema calculará el precio final automáticamente.
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
            placeholder="Ej: Carne Molida"
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Ej: CAR-001"
            required
          />
        </div>
      </div>

      {/* Precios */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <Label htmlFor="precio_venta" className="flex items-center gap-2">
            Precio por Kilogramo *
            <span className="text-xs font-normal text-gray-500">($/kg)</span>
          </Label>
          <Input
            id="precio_venta"
            type="number"
            step="0.01"
            value={formData.precio_venta}
            onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
            placeholder="Ej: 2500.00"
            required
            className="text-lg font-semibold"
          />
          {formData.precio_venta && (
            <p className="text-xs text-gray-500 mt-1">
              Ej: 0.5kg = ${(parseFloat(formData.precio_venta) * 0.5).toFixed(2)}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="precio_costo">Precio de Costo (por kg) *</Label>
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

      {/* Stock en Kilos */}
      <div>
        <Label htmlFor="stock_actual" className="flex items-center gap-2">
          Stock Disponible
          <span className="text-xs font-normal text-gray-500">(en kilogramos)</span>
        </Label>
        <Input
          id="stock_actual"
          type="number"
          step="0.001"
          value={formData.stock_actual}
          onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
          placeholder="Ej: 15.5"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Puedes usar decimales (Ej: 15.5 kg, 0.250 kg)
        </p>
      </div>

      {/* Código de Barras Opcional */}
      <div>
        <Label htmlFor="codigo_barras">Código de Barras (Opcional)</Label>
        <Input
          id="codigo_barras"
          value={formData.codigo_barras || ""}
          onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
          placeholder="Escanea o ingresa manualmente"
        />
      </div>

      {/* Atributos adicionales (marca pesable) */}
      <input
        type="hidden"
        value="true"
        onChange={() =>
          setFormData({
            ...formData,
            atributos: {
              ...formData.atributos,
              pesable: true,
              unidad: "kg",
            },
          })
        }
      />
    </div>
  );
}
