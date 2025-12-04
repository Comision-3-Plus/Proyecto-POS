/**
 * WebSocket Context - Enterprise Real-time Infrastructure
 * Gestiona conexión WebSocket persistente con auto-reconnect y broadcasting
 * 
 * @module context/WebSocketContext
 * @description Proveedor de WebSocket con retry exponencial y gestión de estado
 * @author Tech Lead - Real-time Infrastructure
 * @version 1.0.0
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from './ToastContext';

// ==================== TYPES ====================

interface WebSocketMessage {
  type: string;
  topic?: string;
  shop_domain?: string;
  data?: Record<string, unknown>;
  tienda_id?: string;
  timestamp?: string;
  message?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: Record<string, unknown>) => void;
}

// ==================== CONTEXT ====================

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// ==================== PROVIDER ====================

interface WebSocketProviderProps {
  children: React.ReactNode;
  tiendaId: string;
  enabled?: boolean;
}

export function WebSocketProvider({ children, tiendaId, enabled = true }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttempts = useRef(0);
  const { success, info, error: showError } = useToast();

  // Configuración de reconexión
  const MAX_RECONNECT_ATTEMPTS = 10;
  const BASE_RECONNECT_DELAY = 1000; // 1 segundo
  const MAX_RECONNECT_DELAY = 30000; // 30 segundos

  /**
   * Calcula el delay de reconexión con exponential backoff
   */
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
      MAX_RECONNECT_DELAY
    );
    return delay + Math.random() * 1000; // Jitter para evitar thundering herd
  }, []);

  /**
   * Procesa mensajes específicos del servidor
   */
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_established':
        console.log('[WebSocket] Bienvenida recibida:', message.message);
        break;

      case 'new_order':
        success(`🎉 Nueva orden recibida: ${message.shop_domain}`);
        // TODO: Actualizar lista de órdenes en UI
        break;

      case 'stock_alert':
        showError(`⚠️ Stock bajo: ${message.data?.producto_nombre || 'Producto'}`);
        break;

      case 'sale_completed':
        success(`✅ Venta #${message.data?.venta_id} procesada`);
        break;

      case 'webhook_received':
        info(`📡 Evento ${message.topic} recibido`);
        break;

      default:
        console.log('[WebSocket] Mensaje no manejado:', message.type);
    }
  }, [success, showError, info]);

  /**
   * Conecta al WebSocket del backend
   */
  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Determinar URL del WebSocket (http -> ws, https -> wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8001/ws/${tiendaId}`;

    console.log(`[WebSocket] Conectando a ${wsUrl}...`);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Conexión establecida');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        if (reconnectAttempts.current > 0) {
          success('Conexión en tiempo real restaurada');
        } else {
          info('Sistema de notificaciones activado');
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Mensaje recibido:', message);
          setLastMessage(message);

          // Procesar mensajes específicos
          handleMessage(message);
        } catch (err) {
          console.error('[WebSocket] Error parseando mensaje:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Conexión cerrada:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Intentar reconectar si no fue cierre intencional
        if (event.code !== 1000 && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay();
          console.log(`[WebSocket] Reconectando en ${(delay / 1000).toFixed(1)}s... (intento ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
          showError('No se pudo conectar al sistema de notificaciones. Refresca la página.');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket] Error al crear conexión:', err);
    }
  }, [enabled, tiendaId, getReconnectDelay, success, info, showError, handleMessage]);

  /**
   * Envía un mensaje al servidor
   */
  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('[WebSocket] Mensaje enviado:', message);
    } else {
      console.warn('[WebSocket] No conectado, mensaje no enviado:', message);
    }
  }, []);

  /**
   * Efecto: Conectar al montar y desconectar al desmontar
   */
  useEffect(() => {
    connect();

    // Cleanup al desmontar
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [connect]);

  /**
   * Efecto: Ping periódico para mantener conexión viva
   */
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({
        type: 'ping',
        timestamp: new Date().toISOString()
      });
    }, 30000); // Ping cada 30 segundos

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    sendMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// ==================== HOOK ====================

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket debe usarse dentro de un WebSocketProvider');
  }
  return context;
}
