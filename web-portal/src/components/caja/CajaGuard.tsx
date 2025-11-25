/**
 * CajaGuard - Componente de protección que requiere caja abierta
 * Muestra un diálogo persistente para abrir caja si no está abierta
 */

'use client';

import { useState } from 'react';
import { useEstadoCaja, useAbrirCaja } from '@/hooks/useCaja';
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
import { DollarSign, Loader2 } from 'lucide-react';

interface CajaGuardProps {
  children: React.ReactNode;
}

export function CajaGuard({ children }: CajaGuardProps) {
  const { data: estadoCaja, isLoading } = useEstadoCaja();
  const abrirCaja = useAbrirCaja();
  const [montoInicial, setMontoInicial] = useState('');

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const monto = parseFloat(montoInicial);
    if (isNaN(monto) || monto <= 0) {
      return;
    }

    await abrirCaja.mutateAsync({ monto_inicial: monto });
    setMontoInicial('');
  };

  // Mostrar loading mientras se verifica el estado
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando estado de caja...</p>
        </div>
      </div>
    );
  }

  // Si tiene caja abierta, renderizar contenido normal
  if (estadoCaja?.tiene_caja_abierta) {
    return <>{children}</>;
  }

  // Si NO tiene caja abierta, mostrar diálogo persistente
  return (
    <>
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Esperando apertura de caja...</p>
        </div>
      </div>

      <Dialog open={true} modal>
        <DialogContent showClose={false} onPointerDownOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleAbrirCaja}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Apertura de Caja
              </DialogTitle>
              <DialogDescription>
                Debes abrir la caja antes de comenzar a trabajar. Ingresa el monto inicial con el que cuentas en efectivo.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="space-y-2">
                <Label htmlFor="monto-inicial">Monto Inicial (ARS)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="monto-inicial"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                    className="pl-7"
                    required
                    autoFocus
                    disabled={abrirCaja.isPending}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Este monto será el punto de partida para el arqueo de caja al final del turno.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={abrirCaja.isPending || !montoInicial || parseFloat(montoInicial) <= 0}
                className="w-full"
              >
                {abrirCaja.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Abriendo caja...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Abrir Caja
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
