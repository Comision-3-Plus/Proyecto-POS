/**
 * Empleados Screen - Gestión de Equipo
 * Administración de empleados con invitaciones y roles
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Trash2,
  RefreshCw,
  Edit,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/context/ToastContext';
import usuariosService, { Usuario, InvitarUsuarioRequest } from '@/services/usuarios.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Empleados() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRol, setFilterRol] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showEditRolModal, setShowEditRolModal] = useState(false);

  const { success: showSuccess, error: showError } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener empleados
  const { data: empleados = [], isLoading, error } = useQuery({
    queryKey: ['empleados'],
    queryFn: () => usuariosService.getEmpleados(),
  });

  // Mutation para invitar empleado
  const invitarMutation = useMutation({
    mutationFn: (data: InvitarUsuarioRequest) => usuariosService.invitarEmpleado(data),
    onSuccess: () => {
      showSuccess('Empleado invitado exitosamente');
      setShowInviteModal(false);
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
    onError: (error: Error) => {
      showError(error.message || 'Error al invitar empleado');
    },
  });

  // Mutation para cambiar rol
  const cambiarRolMutation = useMutation({
    mutationFn: ({ usuarioId, rol }: { usuarioId: string; rol: string }) =>
      usuariosService.cambiarRol(usuarioId, { nuevo_rol: rol as any }),
    onSuccess: () => {
      showSuccess('Rol actualizado exitosamente');
      setShowEditRolModal(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
    onError: (error: Error) => {
      showError(error.message || 'Error al cambiar rol');
    },
  });

  // Mutation para desactivar empleado
  const desactivarMutation = useMutation({
    mutationFn: (usuarioId: string) => usuariosService.eliminarEmpleado(usuarioId),
    onSuccess: () => {
      showSuccess('Empleado desactivado');
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
    onError: (error: Error) => {
      showError(error.message || 'Error al desactivar empleado');
    },
  });

  // Mutation para reactivar empleado
  const reactivarMutation = useMutation({
    mutationFn: (usuarioId: string) => usuariosService.reactivarEmpleado(usuarioId),
    onSuccess: () => {
      showSuccess('Empleado reactivado');
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
    onError: (error: Error) => {
      showError(error.message || 'Error al reactivar empleado');
    },
  });

  // Filtrar empleados
  const filteredEmpleados = empleados.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRol = filterRol === 'all' || emp.rol === filterRol;
    return matchesSearch && matchesRol;
  });

  const getRolBadgeColor = (rol: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      encargado: 'bg-blue-100 text-blue-800',
      vendedor: 'bg-green-100 text-green-800',
      cajero: 'bg-gray-100 text-gray-800',
    };
    return colors[rol] || 'bg-gray-100 text-gray-800';
  };

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      owner: 'Dueño',
      admin: 'Administrador',
      encargado: 'Encargado',
      vendedor: 'Vendedor',
      cajero: 'Cajero',
    };
    return labels[rol] || rol;
  };

  const columns: Column<Usuario>[] = [
    {
      key: 'full_name',
      header: 'Nombre',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.full_name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (user) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRolBadgeColor(user.rol)}`}>
          <Shield className="w-3 h-3 mr-1" />
          {getRolLabel(user.rol)}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (user) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            user.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (user) => (
        <div className="flex items-center gap-2">
          {user.rol !== 'owner' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedUser(user);
                  setShowEditRolModal(true);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              {user.is_active ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => desactivarMutation.mutate(user.id)}
                  disabled={desactivarMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reactivarMutation.mutate(user.id)}
                  disabled={reactivarMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 text-green-500" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-600" />
            Gestión de Empleados
          </h1>
          <p className="text-gray-600 mt-1">
            Administra tu equipo de trabajo
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} size="lg">
          <UserPlus className="w-5 h-5 mr-2" />
          Invitar Empleado
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Empleados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {empleados.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {empleados.filter((e) => e.is_active).length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {empleados.filter((e) => e.rol === 'admin').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cajeros</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">
                {empleados.filter((e) => e.rol === 'cajero').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-gray-500" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="w-full md:w-48"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="encargado">Encargado</option>
            <option value="vendedor">Vendedor</option>
            <option value="cajero">Cajero</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {error && (
          <Alert variant="danger" className="m-6">
            Error al cargar empleados
          </Alert>
        )}
        <Table
          data={filteredEmpleados}
          columns={columns}
          keyExtractor={(u) => u.id}
          isLoading={isLoading}
          emptyMessage="No hay empleados registrados"
        />
      </div>

      {/* Modal Invitar Empleado */}
      <InviteEmployeeModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSubmit={(data) => invitarMutation.mutate(data)}
        isLoading={invitarMutation.isPending}
      />

      {/* Modal Editar Rol */}
      <EditRolModal
        isOpen={showEditRolModal}
        onClose={() => {
          setShowEditRolModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSubmit={(rol) => {
          if (selectedUser) {
            cambiarRolMutation.mutate({ usuarioId: selectedUser.id, rol });
          }
        }}
        isLoading={cambiarRolMutation.isPending}
      />
    </div>
  );
}

// Modal para invitar empleado
function InviteEmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InvitarUsuarioRequest) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<InvitarUsuarioRequest>({
    email: '',
    full_name: '',
    password: '',
    rol: 'cajero',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invitar Nuevo Empleado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre Completo"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={6}
        />
        <Select
          label="Rol"
          value={formData.rol}
          onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
        >
          <option value="cajero">Cajero</option>
          <option value="vendedor">Vendedor</option>
          <option value="encargado">Encargado</option>
          <option value="admin">Administrador</option>
        </Select>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Invitando...' : 'Invitar Empleado'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Modal para editar rol
function EditRolModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: Usuario | null;
  onSubmit: (rol: string) => void;
  isLoading: boolean;
}) {
  const [selectedRol, setSelectedRol] = useState(user?.rol || 'cajero');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedRol);
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Rol de Empleado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Empleado</p>
          <p className="font-medium text-gray-900">{user.full_name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        <Select
          label="Nuevo Rol"
          value={selectedRol}
          onChange={(e) => setSelectedRol(e.target.value as any)}
        >
          <option value="cajero">Cajero</option>
          <option value="vendedor">Vendedor</option>
          <option value="encargado">Encargado</option>
          <option value="admin">Administrador</option>
        </Select>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Guardando...' : 'Cambiar Rol'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
