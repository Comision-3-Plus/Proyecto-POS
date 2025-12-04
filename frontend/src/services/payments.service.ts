/**
 * Payments Service - Procesamiento de pagos y facturación
 */

import apiClient from './api/apiClient';

// Types
export interface PaymentLink {
  venta_id: string;
  payment_url: string;
  payment_id: string;
  expires_at: string;
}

export interface PaymentStatus {
  venta_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  payment_id: string | null;
  payment_method: string | null;
  amount: number;
  updated_at: string;
}

export interface FacturarRequest {
  tipo_factura: 'A' | 'B' | 'C';
  cliente_doc_tipo: string;
  cliente_doc_nro: string;
}

export interface Factura {
  id: string;
  venta_id: string;
  tipo_factura: string;
  punto_venta: number;
  numero_comprobante: number;
  cae: string;
  vencimiento_cae: string;
  cliente_doc_tipo: string;
  cliente_doc_nro: string;
  monto_neto: number;
  monto_iva: number;
  monto_total: number;
  url_pdf: string | null;
  fecha_emision: string;
}

class PaymentsService {
  /**
   * Generar link de pago (Mercado Pago)
   */
  async generatePaymentLink(ventaId: string) {
    const response = await apiClient.post<PaymentLink>(
      `/payments/generate/${ventaId}`
    );
    return response.data;
  }

  /**
   * Obtener estado de pago
   */
  async getPaymentStatus(ventaId: string) {
    const response = await apiClient.get<PaymentStatus>(
      `/payments/status/${ventaId}`
    );
    return response.data;
  }

  /**
   * Facturar venta (AFIP)
   */
  async facturarVenta(ventaId: string, data: FacturarRequest) {
    const response = await apiClient.post<Factura>(
      `/payments/facturar/${ventaId}`,
      data
    );
    return response.data;
  }
}

export default new PaymentsService();
