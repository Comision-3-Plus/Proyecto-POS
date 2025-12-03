import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle,
  Plus,
  Calculator
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../lib/format';

// Types
interface SesionCaja {
  id: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial: number;
  monto_final?: number;
  diferencia?: number;
  estado: 'abierta' | 'cerrada';
  usuario_id: string;
  movimientos: MovimientoCaja[];
}

interface MovimientoCaja {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  descripcion: string;
  created_at: string;
}

interface EstadoCaja {
  tiene_caja_abierta: boolean;
  sesion?: SesionCaja;
}

interface CashCountInput {
  billetes_1000: number;
  billetes_500: number;
  billetes_200: number;
  billetes_100: number;
  billetes_50: number;
  billetes_20: number;
  billetes_10: number;
  monedas_10: number;
  monedas_5: number;
  monedas_2: number;
  monedas_1: number;
  monedas_050: number;
  monedas_025: number;
}

const initialCashCount: CashCountInput = {
  billetes_1000: 0,
  billetes_500: 0,
  billetes_200: 0,
  billetes_100: 0,
  billetes_50: 0,
  billetes_20: 0,
  billetes_10: 0,
  monedas_10: 0,
  monedas_5: 0,
  monedas_2: 0,
  monedas_1: 0,
  monedas_050: 0,
  monedas_025: 0,
};

export default function Caja() {
  const [estadoCaja, setEstadoCaja] = useState<EstadoCaja | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  
  // Apertura
  const [montoInicial, setMontoInicial] = useState('');
  
  // Cierre
  const [cashCount, setCashCount] = useState<CashCountInput>(initialCashCount);
  
  // Movimiento
  const [tipoMovimiento, setTipoMovimiento] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [descripcionMovimiento, setDescripcionMovimiento] = useState('');

  useEffect(() => {
    fetchEstadoCaja();
  }, []);

  const fetchEstadoCaja = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/api/caja/estado', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEstadoCaja(data);
      }
    } catch (error) {
      console.error('Error al obtener estado de caja:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/api/caja/abrir', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ monto_inicial: parseFloat(montoInicial) })
      });

      if (response.ok) {
        setShowAbrirModal(false);
        setMontoInicial('');
        await fetchEstadoCaja();
      } else {
        const error = await response.json();
        alert(error.detail || 'Error al abrir caja');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al abrir caja');
    }
  };

  const calculateCashCountTotal = (): number => {
    return (
      cashCount.billetes_1000 * 1000 +
      cashCount.billetes_500 * 500 +
      cashCount.billetes_200 * 200 +
      cashCount.billetes_100 * 100 +
      cashCount.billetes_50 * 50 +
      cashCount.billetes_20 * 20 +
      cashCount.billetes_10 * 10 +
      cashCount.monedas_10 * 10 +
      cashCount.monedas_5 * 5 +
      cashCount.monedas_2 * 2 +
      cashCount.monedas_1 * 1 +
      cashCount.monedas_050 * 0.5 +
      cashCount.monedas_025 * 0.25
    );
  };

  const handleCerrarCaja = async () => {
    try {
      const token = localStorage.getItem('token');
      const montoReal = calculateCashCountTotal();
      
      const response = await fetch('http://localhost:8001/api/caja/cerrar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ monto_real: montoReal })
      });

      if (response.ok) {
        setShowCerrarModal(false);
        setCashCount(initialCashCount);
        await fetchEstadoCaja();
      } else {
        const error = await response.json();
        alert(error.detail || 'Error al cerrar caja');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cerrar caja');
    }
  };

  const handleRegistrarMovimiento = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/api/caja/movimiento', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: tipoMovimiento,
          monto: parseFloat(montoMovimiento),
          descripcion: descripcionMovimiento
        })
      });

      if (response.ok) {
        setShowMovimientoModal(false);
        setMontoMovimiento('');
        setDescripcionMovimiento('');
        await fetchEstadoCaja();
      } else {
        const error = await response.json();
        alert(error.detail || 'Error al registrar movimiento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar movimiento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const cajaAbierta = estadoCaja?.tiene_caja_abierta;
  const sesion = estadoCaja?.sesion;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Caja</h1>
          <p className="text-gray-600 mt-1">
            {cajaAbierta ? 'Sesión activa' : 'No hay sesión activa'}
          </p>
        </div>

        {!cajaAbierta ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAbrirModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700"
          >
            <DollarSign className="w-5 h-5" />
            Abrir Caja
          </motion.button>
        ) : (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowMovimientoModal(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Movimiento
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCerrarModal(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-red-700"
            >
              <CheckCircle className="w-5 h-5" />
              Cerrar Caja
            </motion.button>
          </div>
        )}
      </div>

      {cajaAbierta && sesion && (
        <>
          {/* Cards de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Apertura</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDateTime(sesion.fecha_apertura).split(' ')[1]}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatDateTime(sesion.fecha_apertura).split(' ')[0]}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Monto Inicial</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(sesion.monto_inicial)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Ingresos</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  sesion.movimientos
                    ?.filter(m => m.tipo === 'INGRESO')
                    .reduce((sum, m) => sum + m.monto, 0) || 0
                )}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Egresos</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  sesion.movimientos
                    ?.filter(m => m.tipo === 'EGRESO')
                    .reduce((sum, m) => sum + m.monto, 0) || 0
                )}
              </p>
            </motion.div>
          </div>

          {/* Movimientos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Movimientos del Turno</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {sesion.movimientos && sesion.movimientos.length > 0 ? (
                sesion.movimientos.map((mov) => (
                  <div key={mov.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        mov.tipo === 'INGRESO' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {mov.tipo === 'INGRESO' ? (
                          <TrendingUp className={`w-5 h-5 ${
                            mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{mov.descripcion}</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(mov.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mov.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.monto)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-gray-500">
                  No hay movimientos registrados
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!cajaAbierta && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay caja abierta</h2>
          <p className="text-gray-600 mb-6">Abre una sesión para comenzar a operar</p>
        </div>
      )}

      {/* Modal Abrir Caja */}
      <AnimatePresence>
        {showAbrirModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAbrirModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Abrir Caja</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Inicial (ARS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAbrirModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAbrirCaja}
                  disabled={!montoInicial || parseFloat(montoInicial) <= 0}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Abrir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Cerrar Caja */}
      <AnimatePresence>
        {showCerrarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowCerrarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-8 h-8 text-indigo-600" />
                <h3 className="text-2xl font-bold text-gray-900">Arqueo de Caja</h3>
              </div>

              {/* Billetes */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Billetes</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'billetes_1000', label: '$1000' },
                    { key: 'billetes_500', label: '$500' },
                    { key: 'billetes_200', label: '$200' },
                    { key: 'billetes_100', label: '$100' },
                    { key: 'billetes_50', label: '$50' },
                    { key: 'billetes_20', label: '$20' },
                    { key: 'billetes_10', label: '$10' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="w-16 text-sm font-medium text-gray-700">{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={cashCount[key as keyof CashCountInput]}
                        onChange={(e) => setCashCount({ ...cashCount, [key]: parseInt(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Monedas */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Monedas</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'monedas_10', label: '$10' },
                    { key: 'monedas_5', label: '$5' },
                    { key: 'monedas_2', label: '$2' },
                    { key: 'monedas_1', label: '$1' },
                    { key: 'monedas_050', label: '$0.50' },
                    { key: 'monedas_025', label: '$0.25' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="w-16 text-sm font-medium text-gray-700">{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={cashCount[key as keyof CashCountInput]}
                        onChange={(e) => setCashCount({ ...cashCount, [key]: parseInt(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Contado</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(calculateCashCountTotal())}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCerrarModal(false);
                    setCashCount(initialCashCount);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCerrarCaja}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Cerrar Caja
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Movimiento */}
      <AnimatePresence>
        {showMovimientoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMovimientoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Registrar Movimiento</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipoMovimiento('INGRESO')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold ${
                      tipoMovimiento === 'INGRESO'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Ingreso
                  </button>
                  <button
                    onClick={() => setTipoMovimiento('EGRESO')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold ${
                      tipoMovimiento === 'EGRESO'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Egreso
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoMovimiento}
                  onChange={(e) => setMontoMovimiento(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={descripcionMovimiento}
                  onChange={(e) => setDescripcionMovimiento(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Pago de servicios"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMovimientoModal(false);
                    setMontoMovimiento('');
                    setDescripcionMovimiento('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegistrarMovimiento}
                  disabled={!montoMovimiento || !descripcionMovimiento}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
