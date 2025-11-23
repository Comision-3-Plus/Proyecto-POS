"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, CreditCard, QrCode } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (metodo: "EFECTIVO" | "MERCADOPAGO") => void;
}

export default function PaymentModal({
  open,
  onClose,
  total,
  onConfirm,
}: PaymentModalProps) {
  const [metodo, setMetodo] = useState<"EFECTIVO" | "MERCADOPAGO">("EFECTIVO");
  const [monto, setMonto] = useState("");

  const montoNumerico = parseFloat(monto) || 0;
  const vuelto = montoNumerico - total;

  const handleConfirm = () => {
    if (metodo === "EFECTIVO" && vuelto < 0) {
      return; // No permitir si el monto es insuficiente
    }
    onConfirm(metodo);
    setMonto("");
    setMetodo("EFECTIVO");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Cobrar Venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total a cobrar</p>
            <p className="text-4xl font-bold">{formatCurrency(total)}</p>
          </div>

          {/* Selector de Método de Pago */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={metodo === "EFECTIVO" ? "default" : "outline"}
              className="h-20 flex-col gap-2"
              onClick={() => setMetodo("EFECTIVO")}
            >
              <DollarSign className="h-6 w-6" />
              <span>Efectivo</span>
            </Button>
            <Button
              variant={metodo === "MERCADOPAGO" ? "default" : "outline"}
              className="h-20 flex-col gap-2"
              onClick={() => setMetodo("MERCADOPAGO")}
            >
              <CreditCard className="h-6 w-6" />
              <span>Mercado Pago</span>
            </Button>
          </div>

          {/* Efectivo */}
          {metodo === "EFECTIVO" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="monto">Monto recibido</Label>
                <Input
                  id="monto"
                  type="number"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="text-2xl h-14 text-center font-bold"
                  autoFocus
                />
              </div>
              {montoNumerico > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">Vuelto</p>
                  <p className="text-3xl font-bold text-green-800">
                    {vuelto >= 0 ? formatCurrency(vuelto) : "Insuficiente"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mercado Pago QR */}
          {metodo === "MERCADOPAGO" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <QrCode className="h-32 w-32 mx-auto mb-3 text-blue-600" />
              <p className="text-sm text-blue-800 font-medium">
                Mostrá este QR al cliente
              </p>
              <p className="text-xs text-blue-600 mt-1">
                (Integración simulada - conectar API de MP)
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={handleConfirm}
              className="flex-1"
              disabled={metodo === "EFECTIVO" && vuelto < 0}
            >
              Confirmar Venta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
