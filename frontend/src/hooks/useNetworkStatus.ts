/**
 * useNetworkStatus - Hook para detectar estado de conexión
 * 
 * @module hooks/useNetworkStatus
 * @description Hook personalizado para monitorear el estado de la red
 * 
 * @author Tech Lead - Enterprise POS System
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Hook para monitorear el estado de la conexión a internet
 * 
 * @returns {NetworkStatus} Estado actual de la red
 * 
 * @example
 * ```tsx
 * const { isOnline, wasOffline } = useNetworkStatus();
 * 
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Marcar que estuvo offline para mostrar mensaje de reconexión
      if (wasOffline) {
        console.log('🟢 Conexión restaurada');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.warn('🔴 Conexión perdida - Modo Offline activado');
    };

    // Agregar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}
