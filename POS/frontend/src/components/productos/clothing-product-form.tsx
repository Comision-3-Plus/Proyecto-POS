"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { Producto } from "@/types";

interface ClothingProductFormProps {
  producto?: Producto | null;
  formData: any;
  setFormData: (data: any) => void;
}

const COLORES_PREDEFINIDOS = [
  { value: "negro", label: "Negro", hex: "#000000" },
  { value: "blanco", label: "Blanco", hex: "#FFFFFF" },
  { value: "rojo", label: "Rojo", hex: "#EF4444" },
  { value: "azul", label: "Azul", hex: "#3B82F6" },
  { value: "verde", label: "Verde", hex: "#10B981" },
  { value: "amarillo", label: "Amarillo", hex: "#FBBF24" },
  { value: "rosa", label: "Rosa", hex: "#EC4899" },
  { value: "gris", label: "Gris", hex: "#6B7280" },
];

const TALLES_PREDEFINIDOS = ["XS", "S", "M", "L", "XL", "XXL"];

export default function ClothingProductForm({
  producto,
  formData,
  setFormData,
}: ClothingProductFormProps) {
  const [coloresSeleccionados, setColoresSeleccionados] = useState<string[]>([]);
  const [tallesSeleccionados, setTallesSeleccionados] = useState<string[]>([]);
  const [colorCustom, setColorCustom] = useState("");
  const [talleCustom, setTalleCustom] = useState("");

  // Cargar datos existentes
  useEffect(() => {
    if (producto?.atributos) {
      setColoresSeleccionados(producto.atributos.colores || []);
      setTallesSeleccionados(producto.atributos.talles || []);
    }
  }, [producto]);

  // Actualizar formData cuando cambien las variantes
  useEffect(() => {
    setFormData({
      ...formData,
      atributos: {
        ...formData.atributos,
        colores: coloresSeleccionados,
        talles: tallesSeleccionados,
        variantes_stock: generateVariantesStock(),
      },
    });
  }, [coloresSeleccionados, tallesSeleccionados]);

  const generateVariantesStock = () => {
    const variantes: Record<string, number> = {};
    coloresSeleccionados.forEach((color) => {
      tallesSeleccionados.forEach((talle) => {
        const key = `${color}-${talle}`;
        variantes[key] = producto?.atributos?.variantes_stock?.[key] || 0;
      });
    });
    return variantes;
  };

  const toggleColor = (color: string) => {
    setColoresSeleccionados((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleTalle = (talle: string) => {
    setTallesSeleccionados((prev) =>
      prev.includes(talle) ? prev.filter((t) => t !== talle) : [...prev, talle]
    );
  };

  const addColorCustom = () => {
    if (colorCustom && !coloresSeleccionados.includes(colorCustom)) {
      setColoresSeleccionados([...coloresSeleccionados, colorCustom]);
      setColorCustom("");
    }
  };

  const addTalleCustom = () => {
    if (talleCustom && !tallesSeleccionados.includes(talleCustom)) {
      setTallesSeleccionados([...tallesSeleccionados, talleCustom]);
      setTalleCustom("");
    }
  };

  const removeColor = (color: string) => {
    setColoresSeleccionados(coloresSeleccionados.filter((c) => c !== color));
  };

  const removeTalle = (talle: string) => {
    setTallesSeleccionados(tallesSeleccionados.filter((t) => t !== talle));
  };

  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre del Producto *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Remera Lisa"
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Ej: REM-001"
            required
          />
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

      {/* COLORES */}
      <div className="border-t pt-4">
        <Label className="text-lg font-semibold mb-3 block">Colores Disponibles</Label>
        
        {/* Predefinidos */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {COLORES_PREDEFINIDOS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => toggleColor(color.value)}
              className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                coloresSeleccionados.includes(color.value)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-sm font-medium">{color.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Color */}
        <div className="flex gap-2">
          <Input
            placeholder="Color personalizado..."
            value={colorCustom}
            onChange={(e) => setColorCustom(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addColorCustom())}
          />
          <Button type="button" variant="outline" onClick={addColorCustom}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Seleccionados */}
        {coloresSeleccionados.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {coloresSeleccionados.map((color) => (
              <span
                key={color}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {color}
                <button type="button" onClick={() => removeColor(color)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* TALLES */}
      <div className="border-t pt-4">
        <Label className="text-lg font-semibold mb-3 block">Talles Disponibles</Label>
        
        {/* Predefinidos */}
        <div className="grid grid-cols-6 gap-2 mb-3">
          {TALLES_PREDEFINIDOS.map((talle) => (
            <button
              key={talle}
              type="button"
              onClick={() => toggleTalle(talle)}
              className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                tallesSeleccionados.includes(talle)
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {talle}
            </button>
          ))}
        </div>

        {/* Custom Talle */}
        <div className="flex gap-2">
          <Input
            placeholder="Talle personalizado (Ej: 42, 44)..."
            value={talleCustom}
            onChange={(e) => setTalleCustom(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTalleCustom())}
          />
          <Button type="button" variant="outline" onClick={addTalleCustom}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Seleccionados */}
        {tallesSeleccionados.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tallesSeleccionados.map((talle) => (
              <span
                key={talle}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                {talle}
                <button type="button" onClick={() => removeTalle(talle)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Matriz de Variantes */}
      {coloresSeleccionados.length > 0 && tallesSeleccionados.length > 0 && (
        <div className="border-t pt-4">
          <Label className="text-lg font-semibold mb-3 block">
            Stock por Variante ({coloresSeleccionados.length * tallesSeleccionados.length} combinaciones)
          </Label>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Color</th>
                  <th className="text-left p-2 font-semibold">Talle</th>
                  <th className="text-right p-2 font-semibold">Stock</th>
                </tr>
              </thead>
              <tbody>
                {coloresSeleccionados.map((color) =>
                  tallesSeleccionados.map((talle) => {
                    const key = `${color}-${talle}`;
                    return (
                      <tr key={key} className="border-b border-gray-200">
                        <td className="p-2 capitalize">{color}</td>
                        <td className="p-2 font-medium">{talle}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            className="text-right"
                            defaultValue={producto?.atributos?.variantes_stock?.[key] || 0}
                            onChange={(e) => {
                              const newVariantes = {
                                ...formData.atributos?.variantes_stock,
                                [key]: parseInt(e.target.value) || 0,
                              };
                              setFormData({
                                ...formData,
                                atributos: {
                                  ...formData.atributos,
                                  variantes_stock: newVariantes,
                                },
                              });
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
