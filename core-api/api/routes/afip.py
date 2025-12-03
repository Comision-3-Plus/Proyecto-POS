"""
Endpoint para gestión de certificados AFIP
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from services.afip_certificate_monitor import (
    check_afip_certificates,
    get_certificate_alerts
)

router = APIRouter(prefix="/afip", tags=["AFIP"])


@router.get("/certificates/status")
async def get_certificates_status():
    """
    Obtiene el estado de todos los certificados AFIP
    
    Returns:
        - total_certificates: cantidad total
        - expired: certificados vencidos
        - critical: por vencer en < 7 días
        - warning: por vencer en 7-30 días
        - ok: válidos por > 30 días
        - certificates: lista con detalles
    """
    try:
        status = await check_afip_certificates()
        return status
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al verificar certificados: {str(e)}"
        )


@router.get("/certificates/alerts")
async def get_certificates_alerts():
    """
    Obtiene solo certificados que requieren atención
    (vencidos o próximos a vencer)
    """
    try:
        alerts = await get_certificate_alerts()
        return {
            "count": len(alerts),
            "alerts": alerts
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener alertas: {str(e)}"
        )
