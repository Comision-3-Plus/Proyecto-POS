/**
 * Inventario Screen - Ajustes de Stock y Movimientos
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Minus, ArrowRightLeft, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/context/ToastContext';
import inventarioService, { InventoryMovement, StockLevel } from '@/services/inventario.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/format';

export default function Inventario() {
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [tipoAjuste, setTipoAjuste] = useState<'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA'>('AJUSTE_ENTRADA');

  const { success: showSuccess, error: showError } = useToast();
  const queryClient = useQueryClient();

  const { data: stockLevels = [] } = useQuery({
    queryKey: ['stock-levels'],
    queryFn: () => inventarioService.getStockLevels(),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => inventarioService.getMovements({ limit: 50 }),
  });

  const { data: lowStockAlerts = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventarioService.getLowStockAlerts(),
  });

  const ajusteMutation = useMutation({
    mutationFn: (data: any) => inventarioService.registrarAjuste(data),
    onSuccess: () => {
      showSuccess('Ajuste registrado exitosamente');
      setShowAjusteModal(false);
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
    onError: (error: Error) => showError(error.message),
  });

  const stockColumns: Column<StockLevel>[] = [
    { key: 'product_name', header: 'Producto' },
    { key: 'sku', header: 'SKU' },
    { key: 'location_name', header: 'Ubicación' },
    {
      key: 'quantity',
      header: 'Stock',
      render: (item) => (
        <span className={item.quantity <= (item.min_stock || 0) ? 'text-red-600 font-bold' : ''}>
          {item.quantity}
        </span>
      ),
    },
    { key: 'min_stock', header: 'Stock Mín' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item) => (
        <Button
          size="sm"
          onClick={() => {
            setSelectedVariant(item);
            setShowAjusteModal(true);
          }}
        >
          Ajustar
        </Button>
      ),
    },
  ];

  const movementsColumns: Column<InventoryMovement>[] = [
    { key: 'occurred_at', header: 'Fecha', render: (m) => formatDate(m.occurred_at) },
    { key: 'transaction_type', header: 'Tipo' },
    { key: 'product_name', header: 'Producto' },
    { key: 'quantity', header: 'Cantidad', render: (m) => (m.quantity > 0 ? `+${m.quantity}` : m.quantity) },
    { key: 'location_name', header: 'Ubicación' },
    { key: 'reason', header: 'Motivo' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-primary-600" />
            Gestión de Inventario
          </h1>
          <p className="text-gray-600 mt-1">Ajustes de stock y movimientos</p>
        </div>
      </div>

      {lowStockAlerts.length > 0 && (
        <Alert variant="warning">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Stock Bajo Detectado</p>
            <p className="text-sm">{lowStockAlerts.length} productos necesitan reposición</p>
          </div>
        </Alert>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Niveles de Stock</h2>
        </div>
        <div className="p-6">
          <Table data={stockLevels} columns={stockColumns} emptyMessage="No hay stock registrado" keyExtractor={(item) => `${item.variant_id}-${item.location_id}`} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Últimos Movimientos</h2>
        </div>
        <div className="p-6">
          <Table data={movements} columns={movementsColumns} emptyMessage="No hay movimientos" keyExtractor={(m) => m.id} />
        </div>
      </div>

      <Modal
        isOpen={showAjusteModal}
        onClose={() => setShowAjusteModal(false)}
        title="Ajustar Stock"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            ajusteMutation.mutate({
              variant_id: selectedVariant?.variant_id,
              location_id: selectedVariant?.location_id || 1,
              quantity: Number(formData.get('quantity')),
              transaction_type: tipoAjuste,
              reason: formData.get('reason'),
            });
          }}
          className="space-y-4"
        >
          <div>
            <p className="text-sm text-gray-600">Producto: <span className="font-medium">{selectedVariant?.product_name}</span></p>
            <p className="text-sm text-gray-600">Stock Actual: <span className="font-medium">{selectedVariant?.quantity}</span></p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={tipoAjuste === 'AJUSTE_ENTRADA' ? 'primary' : 'ghost'}
              onClick={() => setTipoAjuste('AJUSTE_ENTRADA')}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Entrada
            </Button>
            <Button
              type="button"
              variant={tipoAjuste === 'AJUSTE_SALIDA' ? 'primary' : 'ghost'}
              onClick={() => setTipoAjuste('AJUSTE_SALIDA')}
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-2" />
              Salida
            </Button>
          </div>

          <Input name="quantity" type="number" label="Cantidad" required min="1" />
          <Input name="reason" label="Motivo del Ajuste" required />

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowAjusteModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">Confirmar Ajuste</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
