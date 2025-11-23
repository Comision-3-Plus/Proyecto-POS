"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Producto } from "@/types";

interface VariantSelectorModalProps {
  open: boolean;
  onClose: () => void;
  producto: Producto;
  onConfirm: (color: string, talle: string, cantidad: number) => void;
}

export default function VariantSelectorModal({
  open,
  onClose,
  producto,
  onConfirm,
}: VariantSelectorModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedTalle, setSelectedTalle] = useState<string>("");
  const [cantidad, setCantidad] = useState(1);

  const colores = producto.atributos?.colores || [];
  const talles = producto.atributos?.talles || [];
  const variantesStock = producto.atributos?.variantes_stock || {};

  const currentKey = `${selectedColor}-${selectedTalle}`;
  const stockDisponible = variantesStock[currentKey] || 0;
  const canAdd = selectedColor && selectedTalle && cantidad > 0 && cantidad <= stockDisponible;

  const handleConfirm = () => {
    if (canAdd) {
      onConfirm(selectedColor, selectedTalle, cantidad);
      // Reset
      setSelectedColor("");
      setSelectedTalle("");
      setCantidad(1);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{producto.nombre}</DialogTitle>
          <p className="text-sm text-gray-600">Selecciona color y talle</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selector de Color */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Color</Label>
            <div className="grid grid-cols-3 gap-2">
              {colores.map((color: string) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`p-3 rounded-lg border-2 transition-all capitalize ${
                    selectedColor === color
                      ? "border-blue-500 bg-blue-50 font-semibold"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Talle */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Talle</Label>
            <div className="grid grid-cols-4 gap-2">
              {talles.map((talle: string) => (
                <button
                  key={talle}
                  type="button"
                  onClick={() => setSelectedTalle(talle)}
                  className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                    selectedTalle === talle
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {talle}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Info */}
          {selectedColor && selectedTalle && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stock disponible:</span>
                <span
                  className={`font-bold ${
                    stockDisponible > 5 ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {stockDisponible} unidades
                </span>
              </div>
            </div>
          )}

          {/* Cantidad */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Cantidad</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
              >
                -
              </Button>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border rounded-md py-2 font-semibold"
                min="1"
                max={stockDisponible}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCantidad(Math.min(stockDisponible, cantidad + 1))}
                disabled={cantidad >= stockDisponible}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!canAdd}>
            Agregar al Carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
