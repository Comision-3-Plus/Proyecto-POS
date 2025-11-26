"""
Middleware de Auditoría - Nexus POS Enterprise
Intercepta todas las operaciones de escritura y las registra
"""
import json
import logging
from typing import Optional, Callable
from uuid import uuid4
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import AsyncSessionLocal
from models_audit import AuditLog

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    🏛️ MIDDLEWARE DE AUDITORÍA EMPRESARIAL
    
    Intercepta requests y registra:
    - POST (CREATE)
    - PUT/PATCH (UPDATE)
    - DELETE (DELETE)
    
    No audita:
    - GET (lectura)
    - OPTIONS (preflight)
    - Health checks
    """
    
    # Endpoints que NO se auditan
    EXCLUDED_PATHS = [
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/metrics",
        "/favicon.ico"
    ]
    
    # Métodos HTTP auditables
    AUDITABLE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Intercepta el request, ejecuta la operación y audita
        """
        # Skip si no es auditable
        if not self._should_audit(request):
            return await call_next(request)
        
        # Extraer información del request
        request_id = str(uuid4())
        request.state.request_id = request_id
        
        # Capturar body original (para payload_before en updates)
        body = await self._get_request_body(request)
        
        # Ejecutar el request
        response = await call_next(request)
        
        # Auditar solo si fue exitoso (200-299)
        if 200 <= response.status_code < 300:
            try:
                await self._log_audit(request, response, body, request_id)
            except Exception as e:
                logger.error(f"Error al auditar: {e}")
                # No fallar el request por error de auditoría
        
        return response
    
    def _should_audit(self, request: Request) -> bool:
        """Determina si el request debe ser auditado"""
        # Excluir paths específicos
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return False
        
        # Solo métodos de escritura
        if request.method not in self.AUDITABLE_METHODS:
            return False
        
        return True
    
    async def _get_request_body(self, request: Request) -> Optional[dict]:
        """Extrae el body del request de forma segura"""
        try:
            body_bytes = await request.body()
            if body_bytes:
                return json.loads(body_bytes)
        except Exception as e:
            logger.warning(f"No se pudo parsear body del request: {e}")
        
        return None
    
    async def _log_audit(
        self,
        request: Request,
        response: Response,
        request_body: Optional[dict],
        request_id: str
    ):
        """
        Registra el evento de auditoría en la base de datos
        """
        # Extraer información del usuario autenticado
        user = getattr(request.state, "user", None)
        if not user:
            # No auditar requests sin autenticación
            return
        
        # Determinar acción
        action = self._map_method_to_action(request.method)
        
        # Extraer tipo de recurso del path
        resource_type = self._extract_resource_type(request.url.path)
        
        # Extraer ID del recurso si está en el path
        resource_id = self._extract_resource_id(request.url.path)
        
        # Extraer IP
        ip_address = self._get_client_ip(request)
        
        # Crear log de auditoría
        async with AsyncSessionLocal() as session:
            audit_log = AuditLog(
                user_id=user.id,
                user_email=user.email,
                user_rol=user.rol,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                timestamp=datetime.utcnow(),
                ip_address=ip_address,
                user_agent=request.headers.get("user-agent"),
                endpoint=request.url.path,
                method=request.method,
                request_id=request_id,
                payload_before=None if action == "CREATE" else request_body,
                payload_after=request_body if action in ["CREATE", "UPDATE"] else None,
                is_sensitive=self._is_sensitive_operation(resource_type, action),
                tienda_id=user.tienda_id
            )
            
            session.add(audit_log)
            await session.commit()
            
            logger.info(
                f"🔍 AUDIT: {user.email} ejecutó {action} en {resource_type} "
                f"(ID: {resource_id}) desde {ip_address}"
            )
    
    def _map_method_to_action(self, method: str) -> str:
        """Mapea método HTTP a acción de auditoría"""
        mapping = {
            "POST": "CREATE",
            "PUT": "UPDATE",
            "PATCH": "UPDATE",
            "DELETE": "DELETE"
        }
        return mapping.get(method, "UNKNOWN")
    
    def _extract_resource_type(self, path: str) -> str:
        """
        Extrae el tipo de recurso del path
        Ej: /api/v1/productos/123 -> productos
        """
        parts = [p for p in path.split('/') if p]
        
        # Buscar el recurso principal (después de /api/v1/)
        if len(parts) >= 3 and parts[0] == 'api' and parts[1] == 'v1':
            return parts[2]
        
        return "unknown"
    
    def _extract_resource_id(self, path: str) -> Optional[str]:
        """
        Extrae el ID del recurso del path
        Ej: /api/v1/productos/abc-123/activate -> abc-123
        """
        parts = [p for p in path.split('/') if p]
        
        # Si hay más de 3 partes, el 4to elemento suele ser el ID
        if len(parts) >= 4:
            # Verificar que parece un ID (UUID o número)
            potential_id = parts[3]
            if len(potential_id) > 10:  # Probablemente un UUID
                return potential_id
        
        return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtiene la IP real del cliente (considerando proxies)"""
        # Intentar obtener IP real detrás de proxies
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(',')[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback a la IP directa
        return request.client.host if request.client else "unknown"
    
    def _is_sensitive_operation(self, resource_type: str, action: str) -> bool:
        """
        Determina si la operación es sensible y requiere revisión especial
        """
        sensitive_resources = ["productos", "precios", "users", "facturas"]
        sensitive_actions = ["DELETE", "UPDATE"]
        
        return resource_type in sensitive_resources and action in sensitive_actions
