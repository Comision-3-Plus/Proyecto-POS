/**
 * Configuración Screen - Settings con Tabs
 * Estilo Notion: AFIP, Integraciones, RBAC, General
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Link2,
  Shield,
  Globe,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Key,
  Mail,
  User,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Tab = 'afip' | 'integraciones' | 'rbac' | 'general';

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState<Tab>('afip');

  const tabs = [
    { id: 'afip' as Tab, label: 'AFIP', icon: FileText },
    { id: 'integraciones' as Tab, label: 'Integraciones', icon: Link2 },
    { id: 'rbac' as Tab, label: 'Roles y Permisos', icon: Shield },
    { id: 'general' as Tab, label: 'General', icon: Globe },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/30 via-white/10 to-gray-100/20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/85 backdrop-blur-2xl shadow-sm shadow-gray-200/20">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                Configuración
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Ajustes del sistema y integraciones
              </p>
            </div>
            <Button variant="primary" size="sm">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Premium */}
      <div className="border-b border-gray-200/50 bg-gradient-to-r from-white/95 to-gray-50/50 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center gap-2.5 px-5 py-3.5 text-sm font-semibold transition-all rounded-t-xl ${
                activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-br from-primary-500 to-cyan-500 shadow-lg shadow-primary-500/30' 
                  : 'bg-gray-100'
              }`}>
                <tab.icon className={`w-4 h-4 ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-500'
                }`} />
              </div>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-cyan-500 to-primary-500 rounded-t-lg"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {activeTab === 'afip' && <AFIPConfig />}
          {activeTab === 'integraciones' && <IntegracionesConfig />}
          {activeTab === 'rbac' && <RBACConfig />}
          {activeTab === 'general' && <GeneralConfig />}
        </div>
      </div>
    </div>
  );
}

// AFIP Configuration
function AFIPConfig() {
  const [autoCAEA, setAutoCAEA] = useState(true);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-xl shadow-gray-200/20">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
          Estado de Conexión AFIP
        </h3>
        <div className="relative flex items-center gap-4 p-5 bg-gradient-to-br from-success-50 to-emerald-50 rounded-xl border border-success-200/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-success-500/5 to-emerald-500/5" />
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-success-500/40">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 relative">
            <p className="text-base font-bold text-success-900">Conectado</p>
            <p className="text-xs text-success-700 mt-1 font-medium">
              Último chequeo: hace 5 minutos
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-xl shadow-gray-200/20">
        <h3 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wider">
          Certificados y Credenciales
        </h3>
        <div className="space-y-5">
          <Input label="CUIT" placeholder="20-12345678-9" />
          <Input label="Punto de Venta" type="number" placeholder="0001" />
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Certificado (.crt)
            </label>
            <div className="relative group">
              <input
                type="file"
                accept=".crt"
                className="flex-1 text-sm text-gray-600 w-full file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-primary-50 file:to-cyan-50 file:text-primary-700 hover:file:from-primary-100 hover:file:to-cyan-100 file:transition-all file:shadow-md hover:file:shadow-lg border border-gray-200 rounded-xl p-3 bg-gray-50/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Clave Privada (.key)
            </label>
            <div className="relative group">
              <input
                type="file"
                accept=".key"
                className="flex-1 text-sm text-gray-600 w-full file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-primary-50 file:to-cyan-50 file:text-primary-700 hover:file:from-primary-100 hover:file:to-cyan-100 file:transition-all file:shadow-md hover:file:shadow-lg border border-gray-200 rounded-xl p-3 bg-gray-50/50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-xl shadow-gray-200/20">
        <h3 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wider">
          Configuración CAEA
        </h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-cyan-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Solicitar CAEA automáticamente cada 15 días
              </span>
            </div>
            <button
              onClick={() => setAutoCAEA(!autoCAEA)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                autoCAEA 
                  ? 'bg-gradient-to-r from-primary-500 to-cyan-500 shadow-lg shadow-primary-500/40' 
                  : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: autoCAEA ? 30 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
              />
            </button>
          </div>
          <Input
            label="Días de anticipación"
            type="number"
            placeholder="2"
            helpText="Días antes del inicio de la quincena para solicitar CAEA"
          />
        </div>
      </div>
    </motion.div>
  );
}

// Integraciones E-commerce
function IntegracionesConfig() {
  const platforms = [
    {
      name: 'Shopify',
      connected: true,
      lastSync: '2024-01-15 10:30',
      icon: '🛍️',
    },
    {
      name: 'Mercado Libre',
      connected: true,
      lastSync: '2024-01-15 10:25',
      icon: '📦',
    },
    {
      name: 'TiendaNube',
      connected: false,
      lastSync: null,
      icon: '☁️',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Plataformas E-commerce
        </h3>
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {platform.name}
                  </p>
                  {platform.connected && platform.lastSync && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Última sincronización: {platform.lastSync}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {platform.connected ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                      <span className="text-xs font-medium text-success-700">
                        Conectado
                      </span>
                    </div>
                    <Button variant="secondary" size="sm">
                      Configurar
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" size="sm">
                    <Plus className="w-3.5 h-3.5" />
                    Conectar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Configuración de Sincronización
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia de Sincronización
            </label>
            <select className="w-full h-10 px-3 pr-8 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
              <option>Cada 5 minutos</option>
              <option>Cada 15 minutos</option>
              <option>Cada 30 minutos</option>
              <option>Cada hora</option>
            </select>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Sincronizar inventario automáticamente
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Notificar cuando se reciben nuevas órdenes
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// RBAC Configuration
function RBACConfig() {
  const roles = [
    { name: 'Administrador', users: 3, permissions: 'Todos los permisos' },
    { name: 'Vendedor', users: 12, permissions: 'Ventas, Productos (solo lectura)' },
    { name: 'Supervisor', users: 5, permissions: 'Ventas, Productos, Reportes' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Roles</h3>
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            Nuevo Rol
          </Button>
        </div>
        <div className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.name}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{role.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{role.permissions}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{role.users} usuarios</span>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
                <button className="p-1.5 text-gray-400 hover:text-danger-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Usuarios del Sistema
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((user) => (
            <div
              key={user}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Usuario {user}
                  </p>
                  <p className="text-xs text-gray-500">usuario{user}@nexuspos.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-700">
                  {user === 1 ? 'Administrador' : user === 2 ? 'Vendedor' : 'Supervisor'}
                </span>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// General Configuration
function GeneralConfig() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Información de la Empresa
        </h3>
        <div className="space-y-4">
          <Input label="Nombre de la Empresa" placeholder="NexusPOS S.A." />
          <Input label="CUIT" placeholder="30-12345678-9" />
          <Input label="Dirección" placeholder="Av. Corrientes 1234" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ciudad" placeholder="Buenos Aires" />
            <Input label="Código Postal" placeholder="C1043" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Configuración Regional
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zona Horaria
            </label>
            <select className="w-full h-10 px-3 pr-8 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
              <option>America/Argentina/Buenos_Aires (GMT-3)</option>
              <option>America/Argentina/Cordoba (GMT-3)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <select className="w-full h-10 px-3 pr-8 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
              <option>ARS - Peso Argentino</option>
              <option>USD - Dólar Estadounidense</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Notificaciones</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">
                Notificaciones por email
              </span>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">Alertas de seguridad</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
