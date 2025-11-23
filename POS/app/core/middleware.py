"""
Middleware para Request ID y logging de requests
Agrega correlación de requests y logging automático
"""
import time
import uuid
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware que agrega un ID único a cada request
    para facilitar el tracking y debugging
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generar o usar request_id existente del header
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Agregar request_id al estado del request
        request.state.request_id = request_id
        
        # Procesar request y agregar header a response
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware que loggea requests/responses con métricas de performance
    ⚡ OPTIMIZADO: Solo loggea requests lentos (>500ms) y errores
    """
    
    def __init__(self, app: ASGIApp, log_body: bool = False):
        super().__init__(app)
        self.log_body = log_body
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        request_id = getattr(request.state, "request_id", "unknown")
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # ⚡ OPTIMIZACIÓN: Solo loggear requests lentos (>500ms) o con errores
            if process_time > 0.5 or response.status_code >= 400:
                logger.info(
                    f"Response: {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)",
                    extra={
                        "request_id": request_id,
                        "status_code": response.status_code,
                        "process_time": process_time
                    }
                )
            
            # Agregar header de performance
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as exc:
            process_time = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path} - {str(exc)}",
                extra={
                    "request_id": request_id,
                    "process_time": process_time
                },
                exc_info=True
            )
            raise
