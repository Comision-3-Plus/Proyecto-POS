"""
WebSocket Connection Manager - Enterprise Edition
Gestiona conexiones WebSocket bidireccionales para notificaciones en tiempo real

@module core/websockets
@description Sistema de pub/sub con auto-reconnect y broadcasting por tienda
@author Tech Lead - Real-time Infrastructure
@version 1.0.0
"""

from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Gestor centralizado de conexiones WebSocket con soporte para broadcasting por tienda.
    
    Features:
    - Conexiones organizadas por tienda_id
    - Broadcasting selectivo a tiendas específicas
    - Manejo automático de desconexiones
    - Logging detallado de eventos
    - Soporte para múltiples clientes por tienda
    
    Attributes:
        active_connections: Dict[tienda_id, Set[WebSocket]] - Mapeo de tiendas a conexiones activas
    """
    
    def __init__(self):
        # Estructura: {tienda_id: {websocket1, websocket2, ...}}
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        logger.info("WebSocket ConnectionManager initialized")
    
    async def connect(self, websocket: WebSocket, tienda_id: str):
        """
        Acepta una nueva conexión WebSocket y la asocia a una tienda.
        
        Args:
            websocket: Instancia de WebSocket de FastAPI
            tienda_id: ID de la tienda a la que pertenece el cliente
        """
        await websocket.accept()
        
        if tienda_id not in self.active_connections:
            self.active_connections[tienda_id] = set()
        
        self.active_connections[tienda_id].add(websocket)
        
        connection_count = len(self.active_connections[tienda_id])
        logger.info(
            f"WebSocket connected - tienda_id={tienda_id}, "
            f"total_connections={connection_count}"
        )
        
        # Enviar mensaje de bienvenida
        await websocket.send_json({
            "type": "connection_established",
            "tienda_id": tienda_id,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Conectado al sistema de notificaciones en tiempo real"
        })
    
    def disconnect(self, websocket: WebSocket, tienda_id: str):
        """
        Desconecta un WebSocket y limpia la estructura de datos.
        
        Args:
            websocket: Instancia de WebSocket a desconectar
            tienda_id: ID de la tienda asociada
        """
        if tienda_id in self.active_connections:
            self.active_connections[tienda_id].discard(websocket)
            
            # Limpiar si no quedan conexiones
            if not self.active_connections[tienda_id]:
                del self.active_connections[tienda_id]
                logger.info(f"All connections closed for tienda_id={tienda_id}")
            else:
                logger.info(
                    f"WebSocket disconnected - tienda_id={tienda_id}, "
                    f"remaining={len(self.active_connections[tienda_id])}"
                )
    
    async def send_to_tienda(
        self,
        tienda_id: str,
        message: dict,
        exclude: Optional[WebSocket] = None
    ):
        """
        Envía un mensaje a todas las conexiones de una tienda específica.
        
        Args:
            tienda_id: ID de la tienda objetivo
            message: Dict con el payload del mensaje
            exclude: WebSocket a excluir del broadcast (opcional)
        """
        if tienda_id not in self.active_connections:
            logger.warning(f"No active connections for tienda_id={tienda_id}")
            return
        
        # Agregar metadata
        message["tienda_id"] = tienda_id
        message["timestamp"] = datetime.utcnow().isoformat()
        
        disconnected = set()
        
        for connection in self.active_connections[tienda_id]:
            if exclude and connection == exclude:
                continue
            
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                logger.warning(f"Connection closed during broadcast - tienda_id={tienda_id}")
                disconnected.add(connection)
            except Exception as e:
                logger.error(f"Error sending message to WebSocket: {e}")
                disconnected.add(connection)
        
        # Limpiar conexiones muertas
        for conn in disconnected:
            self.disconnect(conn, tienda_id)
        
        logger.info(
            f"Broadcast sent - tienda_id={tienda_id}, "
            f"recipients={len(self.active_connections.get(tienda_id, set()))}, "
            f"type={message.get('type', 'unknown')}"
        )
    
    async def broadcast_all(self, message: dict):
        """
        Envía un mensaje a TODAS las conexiones activas (todas las tiendas).
        
        Args:
            message: Dict con el payload del mensaje
        """
        message["timestamp"] = datetime.utcnow().isoformat()
        
        total_sent = 0
        for tienda_id in list(self.active_connections.keys()):
            await self.send_to_tienda(tienda_id, message.copy())
            total_sent += len(self.active_connections.get(tienda_id, set()))
        
        logger.info(f"Global broadcast sent - total_recipients={total_sent}")
    
    def get_stats(self) -> dict:
        """
        Retorna estadísticas de conexiones activas.
        
        Returns:
            Dict con stats: total_connections, connections_by_tienda
        """
        total = sum(len(connections) for connections in self.active_connections.values())
        
        return {
            "total_connections": total,
            "total_tiendas": len(self.active_connections),
            "connections_by_tienda": {
                tienda_id: len(connections)
                for tienda_id, connections in self.active_connections.items()
            }
        }


# Instancia global del ConnectionManager (singleton)
manager = ConnectionManager()
