import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { formatDate } from '../../lib/format';

interface Certificate {
  alias: string;
  subject: string;
  valid_to: string;
  days_until_expiry: number;
  status: string;
  is_expired: boolean;
  is_near_expiry: boolean;
}

interface CertificateAlertsProps {
  onClose?: () => void;
}

export default function AFIPCertificateAlerts({ onClose }: CertificateAlertsProps) {
  const [alerts, setAlerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/api/afip/certificates/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error al obtener alertas de certificados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (alerts.length === 0) return null;

  const getSeverityColor = (cert: Certificate) => {
    if (cert.is_expired) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-900',
        badge: 'bg-red-100 text-red-800',
      };
    } else if (cert.days_until_expiry <= 7) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-900',
        badge: 'bg-orange-100 text-orange-800',
      };
    } else {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-900',
        badge: 'bg-amber-100 text-amber-800',
      };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-6 z-40 w-96"
      >
        <div className="bg-white rounded-xl shadow-xl border-2 border-amber-300">
          <div className="flex items-center justify-between p-4 border-b border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900">
                Alerta de Certificados AFIP
              </h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-amber-600 hover:text-amber-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {alerts.map((cert: Certificate) => {
              const colors = getSeverityColor(cert);
              
              return (
                <div
                  key={cert.alias}
                  className={`p-4 border-b ${colors.bg} ${colors.border} border-l-4`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-sm">{cert.alias}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}>
                      {cert.status}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-1">{cert.subject}</p>
                  
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className={colors.text}>
                      Vence: {formatDate(cert.valid_to)}
                    </span>
                    <span className="font-bold">
                      {cert.is_expired 
                        ? 'VENCIDO' 
                        : `${cert.days_until_expiry} días restantes`
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Renovar certificados en <a href="https://www.afip.gob.ar" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">AFIP</a>
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
