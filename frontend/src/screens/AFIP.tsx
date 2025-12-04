/**
 * AFIP Screen - Gestión de Certificados y Estado
 */

import { useQuery } from '@tanstack/react-query';
import { FileCheck, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import afipService from '@/services/afip.service';
import { formatDate } from '@/lib/format';

export default function AFIP() {
  const { data: estado } = useQuery({
    queryKey: ['afip-certificado-status'],
    queryFn: () => afipService.getCertificadoStatus(),
  });

  const diasRestantes = estado?.dias_restantes || null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileCheck className="w-8 h-8 text-primary-600" />
          AFIP - Certificados
        </h1>
        <p className="text-gray-600 mt-2">Gestión de certificados de facturación electrónica</p>
      </div>

      {/* Estado del Certificado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Estado del Certificado</h2>
        
        {diasRestantes !== null && diasRestantes <= 30 && (
          <Alert
            variant={diasRestantes <= 7 ? 'danger' : 'warning'}
            className="mb-4"
          >
            {diasRestantes <= 7
              ? `⚠️ El certificado vence en ${diasRestantes} días. ¡Renueva urgente!`
              : `El certificado vence en ${diasRestantes} días.`}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            {estado?.certificado_valido ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className="font-semibold">
                {estado?.certificado_valido ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-600" />
            <div>
              <p className="text-sm text-gray-500">Vencimiento</p>
              <p className="font-semibold">
                {estado?.fecha_vencimiento ? formatDate(estado.fecha_vencimiento) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Días Restantes</p>
              <p className="font-semibold">{diasRestantes !== null ? `${diasRestantes} días` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje del Sistema */}
      {estado?.mensaje && (
        <Alert variant="info">
          <p>{estado.mensaje}</p>
        </Alert>
      )}
    </div>
  );
}
