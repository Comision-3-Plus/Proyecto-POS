/**
 * PaymentModal - Modal de Cobro Profesional con Múltiples Métodos de Pago
 * 
 * @module components/pos/PaymentModal
 * @description Modal de checkout enterprise con tabs para Efectivo, Tarjeta y MercadoPago
 * 
 * Features:
 * - Sistema de tabs para diferentes métodos de pago
 * - Cálculo automático de vuelto
 * - Botones de acceso rápido para billetes comunes
 * - Validación de montos y estados
 * - Integración con procesadores de pago
 * 
 * @author Tech Lead - Enterprise POS System
 * @version 1.0.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Datos de pago que se retornan al confirmar
 */
export interface PaymentData {
  metodo_pago: 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'mercadopago';
  monto_recibido?: number;
  monto_cambio?: number;
  terminal_id?: string;
  codigo_autorizacion?: string;
  qr_id?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (paymentData: PaymentData) => Promise<void>;
}

type PaymentMethod = 'efectivo' | 'tarjeta' | 'mercadopago';

/**
 * Billetes comunes argentinos para acceso rápido
 */
const BILLETES_RAPIDOS = [1000, 2000, 5000, 10000, 20000, 50000];

/**
 * Modal de Checkout Profesional
 */
export default function PaymentModal({
  isOpen,
  onClose,
  total,
  onConfirm,
}: PaymentModalProps) {
  // State Management
  const [activeTab, setActiveTab] = useState<PaymentMethod>('efectivo');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [terminalId, setTerminalId] = useState<string>('TERMINAL_01');
  const [codigoAutorizacion, setCodigoAutorizacion] = useState<string>('');
  const [tipoTarjeta, setTipoTarjeta] = useState<'debito' | 'credito'>('credito');
  const [verificandoMP, setVerificandoMP] = useState(false);
  const [estadoMP, setEstadoMP] = useState<'pending' | 'approved' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab('efectivo');
      setMontoRecibido('');
      setCodigoAutorizacion('');
      setEstadoMP(null);
      setIsProcessing(false);
      
      // Auto-focus en input de efectivo
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  /**
   * Calcula el vuelto/cambio
   */
  const calcularVuelto = (): number => {
    const recibido = parseFloat(montoRecibido) || 0;
    return recibido - total;
  };

  /**
   * Valida si se puede procesar el pago
   */
  const puedeConfirmar = (): boolean => {
    switch (activeTab) {
      case 'efectivo': {
        const vuelto = calcularVuelto();
        return vuelto >= 0 && montoRecibido.length > 0;
      }
      case 'tarjeta': {
        return terminalId.length > 0;
      }
      case 'mercadopago': {
        return estadoMP === 'approved';
      }
      default:
        return false;
    }
  };

  /**
   * Handler para agregar monto rápido
   */
  const agregarBillete = (monto: number) => {
    const actual = parseFloat(montoRecibido) || 0;
    setMontoRecibido((actual + monto).toString());
  };

  /**
   * Handler para verificar pago de MercadoPago
   */
  const verificarMercadoPago = async () => {
    setVerificandoMP(true);
    
    // Simulación de verificación (en producción sería una API call)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulación de aprobación (70% de éxito)
    const aprobado = Math.random() > 0.3;
    setEstadoMP(aprobado ? 'approved' : 'pending');
    setVerificandoMP(false);
  };

  /**
   * Handler para confirmar el pago
   */
  const handleConfirm = async () => {
    if (!puedeConfirmar()) return;

    setIsProcessing(true);

    try {
      let paymentData: PaymentData;

      switch (activeTab) {
        case 'efectivo':
          paymentData = {
            metodo_pago: 'efectivo',
            monto_recibido: parseFloat(montoRecibido),
            monto_cambio: calcularVuelto(),
          };
          break;

        case 'tarjeta':
          paymentData = {
            metodo_pago: tipoTarjeta === 'debito' ? 'tarjeta_debito' : 'tarjeta_credito',
            terminal_id: terminalId,
            codigo_autorizacion: codigoAutorizacion || undefined,
          };
          break;

        case 'mercadopago':
          paymentData = {
            metodo_pago: 'mercadopago',
            qr_id: `QR_${Date.now()}`,
          };
          break;

        default:
          throw new Error('Método de pago no válido');
      }

      await onConfirm(paymentData);
      onClose();
    } catch (error) {
      console.error('Error al procesar pago:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const vuelto = calcularVuelto();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-cyan-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Procesar Pago</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total a cobrar: <span className="font-bold text-primary-600">{formatCurrency(total)}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              disabled={isProcessing}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {[
              { id: 'efectivo', label: 'Efectivo', icon: Banknote },
              { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
              { id: 'mercadopago', label: 'MercadoPago', icon: Smartphone },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as PaymentMethod)}
                  disabled={isProcessing}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold transition-all relative',
                    isActive
                      ? 'text-primary-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* Tab: Efectivo */}
              {activeTab === 'efectivo' && (
                <motion.div
                  key="efectivo"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Input Monto Recibido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Recibido
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                      <input
                        ref={inputRef}
                        type="number"
                        value={montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-14 pr-4 py-4 text-3xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Billetes Rápidos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Acceso Rápido
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {BILLETES_RAPIDOS.map((billete) => (
                        <button
                          key={billete}
                          onClick={() => agregarBillete(billete)}
                          className="px-4 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                        >
                          {formatCurrency(billete)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vuelto */}
                  {montoRecibido && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-6 rounded-xl border-2',
                        vuelto >= 0
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-red-50 border-red-200'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {vuelto >= 0 ? 'Vuelto a entregar:' : 'Falta recibir:'}
                        </span>
                        <span className={cn(
                          'text-3xl font-black',
                          vuelto >= 0 ? 'text-emerald-600' : 'text-red-600'
                        )}>
                          {formatCurrency(Math.abs(vuelto))}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Tab: Tarjeta */}
              {activeTab === 'tarjeta' && (
                <motion.div
                  key="tarjeta"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Tipo de Tarjeta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Tarjeta
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'debito', label: 'Débito' },
                        { id: 'credito', label: 'Crédito' },
                      ].map((tipo) => (
                        <button
                          key={tipo.id}
                          onClick={() => setTipoTarjeta(tipo.id as 'debito' | 'credito')}
                          className={cn(
                            'px-6 py-4 rounded-xl font-semibold transition-all border-2',
                            tipoTarjeta === tipo.id
                              ? 'bg-primary-500 text-white border-primary-500 shadow-lg'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                          )}
                        >
                          {tipo.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terminal/Lote */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terminal/Lote
                    </label>
                    <select
                      value={terminalId}
                      onChange={(e) => setTerminalId(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value="TERMINAL_01">Terminal 01 - Caja Principal</option>
                      <option value="TERMINAL_02">Terminal 02 - Caja Secundaria</option>
                      <option value="TERMINAL_03">Terminal 03 - Móvil</option>
                    </select>
                  </div>

                  {/* Código de Autorización */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Autorización <span className="text-gray-400">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={codigoAutorizacion}
                      onChange={(e) => setCodigoAutorizacion(e.target.value)}
                      placeholder="Ej: 123456"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Para conciliación bancaria posterior
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Tab: MercadoPago */}
              {activeTab === 'mercadopago' && (
                <motion.div
                  key="mercadopago"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* QR Code Placeholder */}
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-64 h-64 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center border-4 border-blue-200 shadow-xl">
                      <div className="text-center">
                        <Smartphone className="w-20 h-20 text-blue-500 mx-auto mb-4" />
                        <p className="text-sm font-medium text-gray-600">
                          QR Code de MercadoPago
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Monto: {formatCurrency(total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estado del Pago */}
                  {estadoMP && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-4 rounded-xl border-2 flex items-center gap-3',
                        estadoMP === 'approved'
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-amber-50 border-amber-200'
                      )}
                    >
                      {estadoMP === 'approved' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {estadoMP === 'approved'
                          ? '¡Pago Aprobado!'
                          : 'Esperando confirmación...'}
                      </span>
                    </motion.div>
                  )}

                  {/* Botón Verificar */}
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={verificarMercadoPago}
                    disabled={verificandoMP || estadoMP === 'approved'}
                    isLoading={verificandoMP}
                  >
                    {verificandoMP ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Verificando Estado...
                      </>
                    ) : estadoMP === 'approved' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Verificado
                      </>
                    ) : (
                      'Verificar Estado del Pago'
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 bg-gray-50 border-t border-gray-200">
            <Button
              variant="secondary"
              size="lg"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirm}
              disabled={!puedeConfirmar() || isProcessing}
              isLoading={isProcessing}
              className="min-w-[200px]"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
