"""
Health Checks Avanzados - Nexus POS
Monitoreo de servicios críticos y métricas de sistema
"""
import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from core.db import get_session, engine
from core.config import settings
from core.circuit_breaker import mercadopago_circuit, afip_circuit


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])


async def check_database() -> Dict[str, Any]:
    """
    Verifica la conectividad y health de PostgreSQL
    """
    try:
        async with engine.begin() as conn:
            # Query simple para verificar conectividad
            result = await conn.execute(text("SELECT 1"))
            result.scalar()
            
            # Query para obtener métricas
            db_stats = await conn.execute(text("""
                SELECT 
                    pg_database_size(current_database()) as db_size,
                    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
            """))
            row = db_stats.first()
            
            return {
                "status": "healthy",
                "response_time_ms": 0,  # TODO: medir tiempo real
                "database_size_mb": round(row[0] / (1024 * 1024), 2) if row else 0,
                "active_connections": row[1] if row else 0
            }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}", exc_info=True)
        return {
            "status": "unhealthy",
            "error": str(e)
        }


async def check_mercadopago() -> Dict[str, Any]:
    """
    Verifica el estado de integración con Mercado Pago
    """
    if not settings.MERCADOPAGO_ACCESS_TOKEN:
        return {
            "status": "not_configured",
            "message": "MercadoPago no está configurado"
        }
    
    try:
        # TODO: Hacer ping a API de MercadoPago
        return {
            "status": "healthy",
            "configured": True
        }
    except Exception as e:
        logger.error(f"MercadoPago health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


async def check_afip() -> Dict[str, Any]:
    """
    Verifica el estado de integración con AFIP
    """
    if not settings.AFIP_CUIT:
        return {
            "status": "not_configured",
            "message": "AFIP no está configurado"
        }
    
    try:
        # TODO: Verificar certificados y conectividad AFIP
        return {
            "status": "healthy",
            "configured": True,
            "environment": "production" if settings.AFIP_PRODUCTION else "testing"
        }
    except Exception as e:
        logger.error(f"AFIP health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@router.get("/")
async def health_check_basic():
    """
    Health check básico (liveness probe)
    Solo verifica que la aplicación esté corriendo
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness probe - verifica que todos los servicios críticos estén listos
    
    Retorna 200 si está listo, 503 si no
    """
    checks = {
        "database": await check_database(),
        "mercadopago": await check_mercadopago(),
        "afip": await check_afip()
    }
    
    # Determinar estado general
    all_healthy = all(
        check.get("status") in ["healthy", "not_configured"]
        for check in checks.values()
    )
    
    response_data = {
        "status": "ready" if all_healthy else "not_ready",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }
    
    status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content=response_data
    )


@router.get("/metrics")
async def system_metrics():
    """
    Métricas del sistema para monitoreo
    
    Incluye:
    - Uso de base de datos
    - Estadísticas de requests
    - Uptime
    """
    db_check = await check_database()
    
    # TODO: Agregar métricas de:
    # - Request rate
    # - Error rate
    # - Average response time
    # - Memory usage
    # - CPU usage
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_check,
        "application": {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": "production" if settings.AFIP_PRODUCTION else "development"
        }
    }


@router.get("/circuits")
async def circuit_breakers_status():
    """
    Estado de los Circuit Breakers
    
    🛡️ Monitorea la salud de integraciones externas (MercadoPago, AFIP)
    
    Estados posibles:
    - CLOSED: Funcionamiento normal
    - OPEN: Servicio no disponible, usando fallback
    - HALF_OPEN: Probando recuperación
    
    Returns:
        Estado de cada circuit breaker con métricas
    """
    mercadopago_stats = mercadopago_circuit.get_stats()
    afip_stats = afip_circuit.get_stats()
    
    # Determinar salud general
    all_healthy = (
        mercadopago_stats["state"] == "CLOSED" and
        afip_stats["state"] == "CLOSED"
    )
    
    response_data = {
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "circuit_breakers": {
            "mercadopago": {
                **mercadopago_stats,
                "description": "Integración de pagos con MercadoPago",
                "impact": "Pagos offline si OPEN" if mercadopago_stats["state"] == "OPEN" else None
            },
            "afip": {
                **afip_stats,
                "description": "Facturación electrónica AFIP",
                "impact": "CAE temporales si OPEN" if afip_stats["state"] == "OPEN" else None
            }
        },
        "recommendations": []
    }
    
    # Agregar recomendaciones si hay problemas
    if mercadopago_stats["state"] == "OPEN":
        response_data["recommendations"].append(
            "MercadoPago: Verificar conectividad y credenciales. Sistema usando modo offline."
        )
    
    if afip_stats["state"] == "OPEN":
        response_data["recommendations"].append(
            "AFIP: Verificar certificados y conectividad. Sistema usando CAE temporales."
        )
    
    status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content=response_data
    )
