/**
 * Stock Screen - Gestión de Inventario con datos reales
 * Inventory Ledger System conectado a la API
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, MapPin, Plus } from 'lucide-react';
// TODO: Import when implementing transfer modal
// import { ArrowRightLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useStockResumen, useLowStockProducts } from '@/hooks/useStockQuery';
import { formatNumber } from '@/lib/format';
// TODO: Import when implementing modals
// import { useLocations, useCreateAdjustment, useTransferStock } from '@/hooks/useStockQuery';

export default function Stock() {
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  // TODO: Implement transfer modal
  // const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const { data: stockData = [], isLoading } = useStockResumen();
  const { data: lowStockData = [] } = useLowStockProducts(10);
  // TODO: Implement adjustment/transfer functionality
  // const { data: locations = [] } = useLocations();
  // const adjustmentMutation = useCreateAdjustment();
  // const transferMutation = useTransferStock();

  const totalStock = stockData.reduce((sum, item) => sum + item.stock_total, 0);
  const totalProducts = stockData.length;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/30 via-white/10 to-gray-100/20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/85 backdrop-blur-2xl shadow-sm">
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">Gestión de Stock</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatNumber(totalProducts)} productos · {formatNumber(totalStock)} unidades totales
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(totalProducts)}</p>
                <p className="text-sm text-gray-500">Productos</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(totalStock)}</p>
                <p className="text-sm text-gray-500">Unidades Totales</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(lowStockData.length)}</p>
                <p className="text-sm text-gray-500">Bajo Stock</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas de Bajo Stock */}
        {lowStockData.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-semibold text-red-900">Productos con Bajo Stock</h3>
            </div>
            <div className="space-y-2">
              {lowStockData.slice(0, 5).map((item) => (
                <div key={item.variant_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{item.stock_total.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">unidades</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla de Stock */}
        <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
          <h3 className="text-sm font-semibold mb-4">Inventario por Producto</h3>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : stockData.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No hay productos en stock</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Producto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Variante</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Stock Total</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ubicaciones</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((item) => (
                    <motion.tr
                      key={item.variant_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm text-gray-600">{item.sku}</code>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {item.size_name && <span className="mr-2">Talla: {item.size_name}</span>}
                          {item.color_name && <span>Color: {item.color_name}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${item.stock_total <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.stock_total.toFixed(0)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {item.stock_by_location.map((loc) => (
                            <div key={loc.location_id} className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span>{loc.location_name}: {loc.stock.toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedVariant(item);
                              setShowAdjustmentModal(true);
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                            title="Ajustar Stock"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {/* TODO: Implement transfer modal
                          <button
                            onClick={() => {
                              setSelectedVariant(item);
                              setShowTransferModal(true);
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                            title="Transferir"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          */}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals (simplified for now - would need full implementation) */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ajustar Stock</h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedVariant?.product_name} - {selectedVariant?.sku}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Implementar formulario de ajuste aquí
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowAdjustmentModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary">Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
