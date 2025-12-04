/**
 * Integraciones Screen - Shopify, Webhooks y API Keys
 */

import { useState } from 'react';
import { Plug, Key, Webhook, ShoppingBag, Plus, Copy, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Input from '@/components/ui/Input';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/context/ToastContext';
import integrationsService, { APIKey } from '@/services/integrations.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/format';

export default function Integraciones() {
  const [activeTab, setActiveTab] = useState<'shopify' | 'api-keys' | 'webhooks'>('shopify');
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [shopUrl, setShopUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { success: showSuccess, error: showError } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => integrationsService.getAPIKeys(),
  });

  const createAPIKeyMutation = useMutation({
    mutationFn: (name: string) => integrationsService.createAPIKey({ name }),
    onSuccess: () => {
      showSuccess('API Key creada exitosamente');
      setShowCreateKeyModal(false);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: Error) => showError(error.message),
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showSuccess('API Key copiada');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const apiKeysColumns: Column<APIKey>[] = [
    { key: 'name', header: 'Nombre', render: (k) => <span className="font-medium">{k.name}</span> },
    {
      key: 'key',
      header: 'API Key',
      render: (k) => (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{k.key.substring(0, 20)}...</code>
          <Button variant="ghost" size="sm" onClick={() => handleCopyKey(k.key)}>
            {copiedKey === k.key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      ),
    },
    { key: 'created_at', header: 'Creada', render: (k) => formatDate(k.created_at) },
    {
      key: 'is_active',
      header: 'Estado',
      render: (k) => (
        <span className={`px-2 py-1 rounded-full text-xs ${k.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {k.is_active ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Plug className="w-8 h-8 text-primary-600" />
          Integraciones
        </h1>
        <p className="text-gray-600 mt-1">Conecta tu tienda con plataformas externas</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <Tabs
          tabs={[
            { id: 'shopify', label: 'Shopify', icon: ShoppingBag },
            { id: 'api-keys', label: 'API Keys', icon: Key },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
          ]}
          activeTab={activeTab}
          onChange={(tab: string) => setActiveTab(tab as 'shopify' | 'api-keys' | 'webhooks')}
        />

        <div className="p-6">
          {activeTab === 'shopify' && (
            <div className="space-y-4">
              <Alert variant="info">
                Conecta tu tienda Shopify para sincronizar productos y ventas automáticamente
              </Alert>
              <div className="flex gap-3">
                <Input
                  placeholder="mi-tienda.myshopify.com"
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => integrationsService.installShopify(shopUrl)}>
                  Conectar Shopify
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Crea API Keys para integraciones personalizadas</p>
                <Button onClick={() => setShowCreateKeyModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva API Key
                </Button>
              </div>
              <Table data={apiKeys} columns={apiKeysColumns} emptyMessage="No hay API Keys" keyExtractor={(key) => key.id} />
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <Alert variant="info">
                Los webhooks notifican eventos a URLs externas en tiempo real
              </Alert>
              <div className="text-center text-gray-500 py-8">
                Configuración de webhooks próximamente
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCreateKeyModal}
        onClose={() => setShowCreateKeyModal(false)}
        title="Nueva API Key"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createAPIKeyMutation.mutate(formData.get('name') as string);
          }}
          className="space-y-4"
        >
          <Input name="name" label="Nombre de la API Key" required />
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowCreateKeyModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
