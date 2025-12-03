/**
 * Clientes Screen - Gestión de Clientes con datos reales
 * CRM completo conectado a la API
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Search, Mail, Phone, MapPin, Edit, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useClientes, useCreateCliente, useUpdateCliente, useDeactivateCliente, useTopClientes } from '@/hooks/useClientesQuery';
import type { Cliente, ClienteCreate } from '@/services/clientes.service';
import ClienteModal from '@/components/clientes/ClienteModal';

export default function Clientes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const { data: clientes = [], isLoading } = useClientes({ search: searchQuery, limit: 100 });
  const { data: topClientes = [] } = useTopClientes(5);
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const deactivateMutation = useDeactivateCliente();

  const handleCreate = (formData: ClienteCreate) => {
    createMutation.mutate(formData, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  const handleUpdate = (clienteId: string, updates: Partial<ClienteCreate>) => {
    updateMutation.mutate({ clienteId, updates }, {
      onSuccess: () => {
        setShowEditModal(false);
        setSelectedCliente(null);
      },
    });
  };

  const handleDeactivate = (clienteId: string) => {
    if (confirm('¿Está seguro de desactivar este cliente?')) {
      deactivateMutation.mutate(clienteId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/30 via-white/10 to-gray-100/20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/85 backdrop-blur-2xl shadow-sm">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Clientes</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <UserPlus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
        {/* Top Clientes */}
        {topClientes.length > 0 && (
          <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
            <h3 className="text-sm font-semibold mb-4">Top Clientes</h3>
            <div className="space-y-3">
              {topClientes.map((cliente: any) => (
                <div key={cliente.cliente_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                      {cliente.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{cliente.nombre} {cliente.apellido}</p>
                      <p className="text-xs text-gray-500">{cliente.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${cliente.total_gastado?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{cliente.total_compras} compras</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="bg-white/95 rounded-2xl p-6 border border-gray-200/60">
          <h3 className="text-sm font-semibold mb-4">Todos los Clientes</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">
                {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientes.map((cliente) => (
                <motion.div
                  key={cliente.cliente_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-lg">
                        {cliente.nombre.charAt(0)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{cliente.nombre} {cliente.apellido}</h4>
                          {!cliente.is_active && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">Inactivo</span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                          {cliente.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{cliente.email}</span>
                            </div>
                          )}
                          {cliente.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{cliente.telefono}</span>
                            </div>
                          )}
                          {cliente.ciudad && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{cliente.ciudad}</span>
                            </div>
                          )}
                          {cliente.documento_numero && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">DNI:</span>
                              <span>{cliente.documento_numero}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-white rounded-lg"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      {cliente.is_active && (
                        <button
                          onClick={() => handleDeactivate(cliente.cliente_id)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="Desactivar"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <ClienteModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {showEditModal && selectedCliente && (
        <ClienteModal
          mode="edit"
          cliente={selectedCliente}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCliente(null);
          }}
          onSubmit={(data) => handleUpdate(selectedCliente.cliente_id, data)}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
