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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Producto } from "@/types";

interface WeightInputModalProps {
  open: boolean;
  onClose: () => void;
  producto: Producto;
  onConfirm: (peso: number) => void;
}

export default function WeightInputModal({
  open,
  onClose,
  producto,
  onConfirm,
}: WeightInputModalProps) {
  const [peso, setPeso] = useState("");

  const precioTotal = peso ? parseFloat(peso) * producto.precio_venta : 0;
  const canAdd = peso && parseFloat(peso) > 0;

  const handleConfirm = () => {
    if (canAdd) {
      onConfirm(parseFloat(peso));
      setPeso("");
      onClose();
    }
  };

  const setPesoRapido = (value: number) => {
    setPeso(value.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Scale className="h-6 w-6 text-green-600" />
            {producto.nombre}
          </DialogTitle>
          <p className="text-sm text-gray-600">Ingresa el peso del producto</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Precio por Kg */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Precio por Kilogramo:</span>
              <span className="text-xl font-bold text-green-900">
                {formatCurrency(producto.precio_venta)}
              </span>
            </div>
          </div>

          {/* Input de Peso */}
          <div>
            <Label htmlFor="peso" className="text-sm font-semibold mb-2 block">
              Peso (en kilogramos)
            </Label>
            <Input
              id="peso"
              type="number"
              step="0.001"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="0.000"
              className="text-2xl font-bold text-center py-6"
              autoFocus
            />
          </div>

          {/* Botones Rápidos */}
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Pesos comunes:</Label>
            <div className="grid grid-cols-4 gap-2">
              {[0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPesoRapido(value)}
                  className="font-semibold"
                >
                  {value} kg
                </Button>
              ))}
            </div>
          </div>

          {/* Total */}
          {peso && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-blue-700">Total a cobrar:</span>
                  <p className="text-xs text-blue-600">
                    {peso} kg × {formatCurrency(producto.precio_venta)}
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-900">
                  {formatCurrency(precioTotal)}
                </span>
              </div>
            </div>
          )}

          {/* Stock Info */}
          <div className="text-xs text-gray-500 text-center">
            Stock disponible: {producto.stock_actual} kg
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canAdd}
            className="bg-green-600 hover:bg-green-700"
          >
            Agregar al Carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
