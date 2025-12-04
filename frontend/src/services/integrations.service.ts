/**
 * Integrations Service - Shopify y webhooks
 */

import apiClient from './api/apiClient';

// Types
export interface APIKey {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface APIKeyCreate {
  name: string;
  scopes?: string[];
}

export interface Webhook {
  id: string;
  event_type: string;
  url: string;
  secret: string;
  is_active: boolean;
  created_at: string;
}

export interface WebhookCreate {
  event_type: string;
  url: string;
}

export interface ShopifyConfig {
  shop_url: string;
  access_token: string | null;
  is_connected: boolean;
}

class IntegrationsService {
  /**
   * Instalar integración de Shopify
   */
  async installShopify(shopUrl: string) {
    const response = await apiClient.get('/integrations/shopify/install', {
      params: { shop: shopUrl }
    });
    // Redirigir a Shopify OAuth
    if (response.data.authorization_url) {
      window.location.href = response.data.authorization_url;
    }
    return response.data;
  }

  /**
   * Crear API Key para integraciones custom
   */
  async createAPIKey(data: APIKeyCreate) {
    const response = await apiClient.post<APIKey>('/integrations/api-keys', data);
    return response.data;
  }

  /**
   * Listar API Keys
   */
  async getAPIKeys() {
    const response = await apiClient.get<APIKey[]>('/integrations/api-keys');
    return response.data;
  }

  /**
   * Crear webhook
   */
  async createWebhook(data: WebhookCreate) {
    const response = await apiClient.post<Webhook>('/integrations/webhooks', data);
    return response.data;
  }

  /**
   * Listar webhooks
   */
  async getWebhooks() {
    const response = await apiClient.get<Webhook[]>('/integrations/webhooks');
    return response.data;
  }

  /**
   * Obtener productos para API pública (sin auth)
   */
  async getPublicProducts(apiKey: string) {
    const response = await apiClient.get('/integrations/public/products', {
      headers: {
        'X-API-Key': apiKey
      }
    });
    return response.data;
  }
}

export default new IntegrationsService();
