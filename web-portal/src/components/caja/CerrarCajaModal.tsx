/**
 * CerrarCajaModal - Modal para realizar el arqueo final y cerrar caja
 */

'use client';

import { useState, useEffect } from 'react';
import { useSesionActual, useCerrarCaja } from '@/hooks/useCaja';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Loader2, Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface CerrarCajaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CerrarCajaModal({ open, onOpenChange }: CerrarCajaModalProps) {
  const sesion = useSesionActual();
  const cerrarCaja = useCerrarCaja();
  const [montoReal, setMontoReal] = useState('');
  const [calculando, setCalculando] = useState(false);

  // Calcular totales de la sesión
  const montoInicial = sesion?.monto_inicial ?? 0;
  const movimientos = sesion?.movimientos ?? [];
  
  const totalIngresos = movimientos
    .filter(m => m.tipo === 'INGRESO')
    .reduce((sum, m) => sum + m.monto, 0);
  
  const totalEgresos = movimientos
    .filter(m => m.tipo === 'EGRESO')
    .reduce((sum, m) => sum + m.monto, 0);

  // El backend calculará las ventas en efectivo
  // Aquí mostramos una estimación (no incluye ventas, solo movimientos manuales)
  const montoEsperadoEstimado = montoInicial + totalIngresos - totalEgresos;

  // Calcular diferencia preliminar
  const montoRealNum = parseFloat(montoReal) || 0;
  const diferenciaPreliminar = montoRealNum - montoEsperadoEstimado;

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const monto = parseFloat(montoReal);
    if (isNaN(monto) || monto < 0) {
      return;
    }

    setCalculando(true);
    try {
      await cerrarCaja.mutateAsync({ monto_real: monto });
      setMontoReal('');
      onOpenChange(false);
    } finally {
      setCalculando(false);
    }
  };

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setMontoReal('');
    }
  }, [open]);

  if (!sesion) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleCerrarCaja}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Cierre de Caja - Arqueo Final
            </DialogTitle>
            <DialogDescription>
              Cuenta el efectivo en caja e ingresa el monto real. El sistema calculará la diferencia automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            {/* Resumen de la sesión */}
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold mb-3 text-sm text-gray-700">Resumen de la Sesión</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Inicial:</span>
                  <span className="font-medium">${montoInicial.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Ingresos Manuales:
                  </span>
                  <span className="font-medium">+${totalIngresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between text-red-600">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Egresos Manuales:
                  </span>
                  <span className="font-medium">-${totalEgresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-semibold">
                  <span>Monto Esperado (estimado):</span>
                  <span className="text-blue-600">${montoEsperadoEstimado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Las ventas en efectivo se calcularán automáticamente al cerrar</span>
                </div>
              </div>
            </Card>

            {/* Input de monto real */}
            <div className="space-y-2">
              <Label htmlFor="monto-real" className="text-base font-semibold">
                Monto Real Contado (ARS) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <Input
                  id="monto-real"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={montoReal}
                  onChange={(e) => setMontoReal(e.target.value)}
                  className="pl-8 text-lg h-12"
                  required
                  autoFocus
                  disabled={calculando}
                />
              </div>
              <p className="text-xs text-gray-500">
                Cuenta todo el efectivo físico que tienes en caja en este momento.
              </p>
            </div>

            {/* Diferencia preliminar */}
            {montoReal && (
              <Card className={`p-4 ${
                diferenciaPreliminar === 0 
                  ? 'bg-green-50 border-green-200' 
                  : diferenciaPreliminar > 0 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Diferencia Preliminar:</span>
                  <span className={`text-lg font-bold ${
                    diferenciaPreliminar === 0 
                      ? 'text-green-600' 
                      : diferenciaPreliminar > 0 
                        ? 'text-blue-600' 
                        : 'text-red-600'
                  }`}>
                    {diferenciaPreliminar > 0 ? '+' : ''}
                    ${diferenciaPreliminar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs mt-1 text-gray-600">
                  {diferenciaPreliminar === 0 && 'Perfecto, el monto coincide con lo esperado'}
                  {diferenciaPreliminar > 0 && 'Hay un sobrante en caja'}
                  {diferenciaPreliminar < 0 && 'Hay un faltante en caja'}
                </p>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={calculando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={calculando || !montoReal || parseFloat(montoReal) < 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {calculando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando caja...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Cerrar Caja
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
