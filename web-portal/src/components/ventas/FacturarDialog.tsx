/**
 * 🧾 Dialog de Facturación Electrónica AFIP
 * Permite emitir facturas tipo A, B o C para ventas
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Receipt, Loader2, Check } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import ventasService from '@/services/ventas.service';
import type { FacturarVentaRequest, FacturarVentaResponse } from '@/types/api';

interface FacturarDialogProps {
  ventaId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (factura: FacturarVentaResponse) => void;
}

export function FacturarDialog({ ventaId, isOpen, onClose, onSuccess }: FacturarDialogProps) {
  const [tipoFactura, setTipoFactura] = useState<'A' | 'B' | 'C'>('B');
  const [docTipo, setDocTipo] = useState<'CUIT' | 'DNI' | 'CUIL'>('CUIT');
  const [docNumero, setDocNumero] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!docNumero.trim()) {
      toast.error('Ingrese el número de documento del cliente');
      return;
    }

    setIsLoading(true);

    try {
      const request: FacturarVentaRequest = {
        tipo_factura: tipoFactura,
        cliente_doc_tipo: docTipo,
        cliente_doc_nro: docNumero.trim(),
        cuit_cliente: docTipo === 'CUIT' ? docNumero.trim() : undefined,
      };

      const factura = await ventasService.facturar(ventaId, request);

      toast.success(factura.mensaje, {
        description: `CAE: ${factura.cae}`,
        duration: 5000,
      });

      onSuccess(factura);
      handleClose();
    } catch (error: unknown) {
      // Error ya manejado por handleApiError
      console.error('Error facturando venta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setDocNumero('');
      setTipoFactura('B');
      setDocTipo('CUIT');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Emitir Factura Electrónica</DialogTitle>
              <DialogDescription>
                Facturación AFIP para esta venta
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Tipo de Factura */}
          <div className="space-y-2">
            <Label htmlFor="tipo_factura">Tipo de Factura</Label>
            <Select
              value={tipoFactura}
              onValueChange={(value: string) => setTipoFactura(value as 'A' | 'B' | 'C')}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">A</Badge>
                    <span>Factura A (Responsable Inscripto)</span>
                  </div>
                </SelectItem>
                <SelectItem value="B">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">B</Badge>
                    <span>Factura B (Consumidor Final)</span>
                  </div>
                </SelectItem>
                <SelectItem value="C">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">C</Badge>
                    <span>Factura C (Monotributista)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500">
              {tipoFactura === 'A' && '⚡ Discrimina IVA - Para inscriptos en IVA'}
              {tipoFactura === 'B' && '👤 No discrimina IVA - Consumidor final'}
              {tipoFactura === 'C' && '🏪 No discrimina IVA - Monotributistas'}
            </p>
          </div>

          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label htmlFor="doc_tipo">Tipo de Documento</Label>
            <Select
              value={docTipo}
              onValueChange={(value: string) => setDocTipo(value as 'CUIT' | 'DNI' | 'CUIL')}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUIT">CUIT</SelectItem>
                <SelectItem value="DNI">DNI</SelectItem>
                <SelectItem value="CUIL">CUIL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número de Documento */}
          <div className="space-y-2">
            <Label htmlFor="doc_numero">Número de Documento</Label>
            <Input
              id="doc_numero"
              placeholder={docTipo === 'DNI' ? '12345678' : '20-12345678-9'}
              value={docNumero}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocNumero(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            <p className="text-xs text-slate-500">
              {docTipo === 'CUIT' && 'Formato: 20-12345678-9 o 2012345678'}
              {docTipo === 'DNI' && 'Sólo números sin puntos'}
              {docTipo === 'CUIL' && 'Formato: 20-12345678-9 o 2012345678'}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Emitiendo...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Emitir Factura
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
