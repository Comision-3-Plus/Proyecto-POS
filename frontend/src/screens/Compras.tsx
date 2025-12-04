/**
 * Compras Screen - Gestión de Proveedores y Órdenes de Compra
 * Control completo del flujo de compras y recepción de mercadería
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Plus,
  Search,
  Package,
  TruckIcon,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import comprasService, {
  Proveedor,
  OrdenCompra,
  ProveedorCreate,
} from '@/services/compras.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/format';

export default function Compras() {
  const [activeTab, setActiveTab] = useState<'proveedores' | 'ordenes'>('proveedores');
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { success: showSuccess, error: showError } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: proveedores = [], isLoading: loadingProveedores } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => comprasService.getProveedores(),
  });

  const { data: ordenes = [], isLoading: loadingOrdenes } = useQuery({
    queryKey: ['ordenes-compra'],
    queryFn: () => comprasService.getOrdenes(),
  });

  // Mutations
  const crearProveedorMutation = useMutation({
    mutationFn: (data: ProveedorCreate) => comprasService.createProveedor(data),
    onSuccess: () => {
      showSuccess('Proveedor creado exitosamente');
      setShowProveedorModal(false);
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
    onError: (error: Error) => {
      showError(error.message || 'Error al crear proveedor');
    },
  });

  const recibirOrdenMutation = useMutation({
    mutationFn: (ordenId: string) => comprasService.recibirOrden(ordenId),
    onSuccess: (data) => {
      showSuccess(data.mensaje);
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
    onError: (error: Error) => {
      showError(error.message || 'Error al recibir orden');
    },
  });

  const cancelarOrdenMutation = useMutation({
    mutationFn: (ordenId: string) => comprasService.cancelarOrden(ordenId),
    onSuccess: () => {
      showSuccess('Orden cancelada');
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
    },
    onError: (error: Error) => {
      showError(error.message || 'Error al cancelar orden');
    },
  });

  // Filtros
  const filteredProveedores = proveedores.filter((p) =>
    p.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.cuit.includes(searchQuery)
  );

  const filteredOrdenes = ordenes.filter((o) =>
    o.proveedor_razon_social.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Columnas Proveedores
  const proveedoresColumns: Column<Proveedor>[] = [
    {
      key: 'razon_social',
      header: 'Razón Social',
      render: (p) => (
        <div>
          <div className="font-medium text-gray-900">{p.razon_social}</div>
          <div className="text-sm text-gray-500">CUIT: {p.cuit}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contacto',
      render: (p) => (
        <div>
          {p.email && <div className="text-sm text-gray-900">{p.email}</div>}
          {p.telefono && <div className="text-sm text-gray-500">{p.telefono}</div>}
        </div>
      ),
    },
    {
      key: 'direccion',
      header: 'Dirección',
      render: (p) => <span className="text-sm text-gray-600">{p.direccion || '-'}</span>,
    },
  ];

  // Columnas Órdenes
  const ordenesColumns: Column<OrdenCompra>[] = [
    {
      key: 'fecha_emision',
      header: 'Fecha',
      render: (o) => (
        <div className="text-sm text-gray-900">
          {formatDate(o.fecha_emision)}
        </div>
      ),
    },
    {
      key: 'proveedor',
      header: 'Proveedor',
      render: (o) => (
        <div className="font-medium text-gray-900">{o.proveedor_razon_social}</div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (o) => (
        <div className="font-semibold text-gray-900">
          {formatCurrency(o.total)}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (o) => {
        const colors = {
          PENDIENTE: 'bg-yellow-100 text-yellow-800',
          RECIBIDA: 'bg-green-100 text-green-800',
          CANCELADA: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors[o.estado]}`}>
            {o.estado}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (o) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedOrden(o)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {o.estado === 'PENDIENTE' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => recibirOrdenMutation.mutate(o.id)}
                disabled={recibirOrdenMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelarOrdenMutation.mutate(o.id)}
                disabled={cancelarOrdenMutation.isPending}
              >
                <XCircle className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Stats
  const stats = {
    totalProveedores: proveedores.length,
    ordenesPendientes: ordenes.filter((o) => o.estado === 'PENDIENTE').length,
    ordenesRecibidas: ordenes.filter((o) => o.estado === 'RECIBIDA').length,
    totalComprado: ordenes
      .filter((o) => o.estado === 'RECIBIDA')
      .reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary-600" />
            Compras y Proveedores
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona proveedores y órdenes de compra
          </p>
        </div>
        <Button
          onClick={() =>
            activeTab === 'proveedores'
              ? setShowProveedorModal(true)
              : null
          }
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {activeTab === 'proveedores' ? 'Nuevo Proveedor' : 'Nueva Orden'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          label="Total Proveedores"
          value={stats.totalProveedores.toString()}
          icon={Package}
          color="primary"
        />
        <StatsCard
          label="Órdenes Pendientes"
          value={stats.ordenesPendientes.toString()}
          icon={TruckIcon}
          color="warning"
        />
        <StatsCard
          label="Órdenes Recibidas"
          value={stats.ordenesRecibidas.toString()}
          icon={CheckCircle2}
          color="success"
        />
        <StatsCard
          label="Total Comprado"
          value={formatCurrency(stats.totalComprado)}
          icon={FileText}
          color="accent"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <Tabs
          tabs={[
            { id: 'proveedores', label: 'Proveedores', icon: Package },
            { id: 'ordenes', label: 'Órdenes de Compra', icon: FileText },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as 'proveedores' | 'ordenes')}
        />

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={`Buscar ${activeTab === 'proveedores' ? 'proveedores' : 'órdenes'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'proveedores' ? (
            <Table
              data={filteredProveedores}
              columns={proveedoresColumns}
              keyExtractor={(p) => p.id}
              isLoading={loadingProveedores}
              emptyMessage="No hay proveedores registrados"
            />
          ) : (
            <Table
              data={filteredOrdenes}
              columns={ordenesColumns}
              keyExtractor={(o) => o.id}
              isLoading={loadingOrdenes}
              emptyMessage="No hay órdenes de compra"
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateProveedorModal
        isOpen={showProveedorModal}
        onClose={() => setShowProveedorModal(false)}
        onSubmit={(data) => crearProveedorMutation.mutate(data)}
        isLoading={crearProveedorMutation.isPending}
      />

      <OrdenDetalleModal
        isOpen={!!selectedOrden}
        onClose={() => setSelectedOrden(null)}
        orden={selectedOrden}
      />
    </div>
  );
}

// Stats Card Component
function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: 'primary' | 'success' | 'warning' | 'accent';
}) {
  const colors = {
    primary: 'text-primary-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    accent: 'text-accent-500',
  };

  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${colors[color]}`} />
      </div>
    </motion.div>
  );
}

// Modal Crear Proveedor
function CreateProveedorModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProveedorCreate) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<ProveedorCreate>({
    razon_social: '',
    cuit: '',
    email: '',
    telefono: '',
    direccion: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Proveedor">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Razón Social"
          value={formData.razon_social}
          onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
          required
        />
        <Input
          label="CUIT"
          value={formData.cuit}
          onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="Teléfono"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
        />
        <Input
          label="Dirección"
          value={formData.direccion}
          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Creando...' : 'Crear Proveedor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Modal Detalle Orden
function OrdenDetalleModal({
  isOpen,
  onClose,
  orden,
}: {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenCompra | null;
}) {
  if (!orden) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Orden de Compra">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Proveedor</p>
            <p className="font-medium text-gray-900">{orden.proveedor_razon_social}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha de Emisión</p>
            <p className="font-medium text-gray-900">{formatDate(orden.fecha_emision)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estado</p>
            <p className="font-medium text-gray-900">{orden.estado}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="font-medium text-gray-900">{formatCurrency(orden.total)}</p>
          </div>
        </div>

        {orden.observaciones && (
          <div>
            <p className="text-sm text-gray-600">Observaciones</p>
            <p className="text-gray-900">{orden.observaciones}</p>
          </div>
        )}

        {orden.detalles && orden.detalles.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Productos</p>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Cantidad
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orden.detalles.map((detalle) => (
                    <tr key={detalle.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {detalle.cantidad}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatCurrency(detalle.precio_costo_unitario)}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {formatCurrency(detalle.subtotal || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
