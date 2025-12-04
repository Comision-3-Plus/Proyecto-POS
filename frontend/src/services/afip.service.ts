/**
 * AFIP Service - Gestión de certificados y facturación electrónica
 */

import apiClient from './api/apiClient';

// Types
export interface CertificadoStatus {
  certificado_valido: boolean;
  fecha_vencimiento: string | null;
  dias_restantes: number | null;
  mensaje: string;
}

export interface AlertaCertificado {
  nivel: 'INFO' | 'WARNING' | 'ERROR';
  mensaje: string;
  dias_restantes: number | null;
  requiere_accion: boolean;
}

class AFIPService {
  /**
   * Obtener estado del certificado AFIP
   */
  async getCertificadoStatus() {
    const response = await apiClient.get<CertificadoStatus>(
      '/afip/certificates/status'
    );
    return response.data;
  }

  /**
   * Obtener alertas sobre certificados
   */
  async getAlertasCertificados() {
    const response = await apiClient.get<AlertaCertificado[]>(
      '/afip/certificates/alerts'
    );
    return response.data;
  }
}

export default new AFIPService();
