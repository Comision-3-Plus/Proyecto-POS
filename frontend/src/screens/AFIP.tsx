/**
 * AFIP Screen - Gestión de Certificados y Estado
 */

import { useQuery } from '@tanstack/react-query';
import { FileCheck, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import afipService, { AFIPCertificate } from '@/services/afip.service';
import { formatDate } from '@/lib/format';

export default function AFIP() {
  const { data: certificados = [] } = useQuery({
    queryKey: ['afip-certificados'],
    queryFn: () => afipService.getCertificados(),
  });

  const { data: estado } = useQuery({
    queryKey: ['afip-estado'],
    queryFn: () => afipService.getEstado(),
  });

  const certificadoActivo = certificados.find((c) => c.activo);
  const diasRestantes = certificadoActivo
    ? Math.floor((new Date(certificadoActivo.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileCheck className="w-8 h-8 text-green-600" />
          AFIP - Facturación Electrónica
        </h1>
        <p className="text-gray-600 mt-1">Estado de certificados y configuración</p>
      </div>

      {certificadoActivo && diasRestantes !== null && (
        <Alert variant={diasRestantes < 30 ? 'warning' : 'success'}>
          <div className="flex items-center gap-3">
            {diasRestantes < 30 ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <div>
              <p className="font-semibold">
                {diasRestantes < 30 ? 'Certificado por Vencer' : 'Certificado Activo'}
              </p>
              <p className="text-sm">
                Vence en {diasRestantes} días ({formatDate(certificadoActivo.fecha_vencimiento)})
              </p>
            </div>
          </div>
        </Alert>
      )}

      {!certificadoActivo && (
        <Alert variant="danger">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Sin Certificado Activo</p>
            <p className="text-sm">No se pueden emitir facturas electrónicas</p>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={FileCheck}
          label="Certificados Activos"
          value={certificados.filter((c) => c.activo).length}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Días Restantes"
          value={diasRestantes ?? 0}
          color={diasRestantes && diasRestantes < 30 ? 'orange' : 'green'}
        />
        <StatCard
          icon={CheckCircle}
          label="Estado Conexión"
          value={estado?.conectado ? 'Conectado' : 'Desconectado'}
          color={estado?.conectado ? 'green' : 'red'}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Certificados</h2>
        </div>
        <div className="p-6">
          {certificados.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay certificados registrados</p>
          ) : (
            <div className="space-y-3">
              {certificados.map((cert) => (
                <CertificadoCard key={cert.id} certificado={cert} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-6 h-6 ${colors[color]}`} />
        <p className="text-sm text-gray-600">{label}</p>
      </div>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function CertificadoCard({ certificado }: { certificado: AFIPCertificate }) {
  const diasRestantes = Math.floor(
    (new Date(certificado.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`border rounded-lg p-4 ${certificado.activo ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{certificado.nombre}</p>
          <p className="text-sm text-gray-600">CUIT: {certificado.cuit}</p>
          <p className="text-sm text-gray-600">
            Vence: {formatDate(certificado.fecha_vencimiento)} ({diasRestantes} días)
          </p>
        </div>
        {certificado.activo && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Activo
          </span>
        )}
      </div>
    </div>
  );
}
