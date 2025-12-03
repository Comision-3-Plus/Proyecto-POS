"""
Servicio de Auditoría
Funciones helper para registrar acciones en audit_logs
"""
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from models_audit import AuditLog


async def log_audit(
    session: AsyncSession,
    user_id: UUID,
    user_email: str,
    tienda_id: UUID,
    action: str,
    entity_type: str,
    entity_id: str,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    description: Optional[str] = None,
    request: Optional[Request] = None,
) -> AuditLog:
    """
    Registra una acción en el log de auditoría
    
    Args:
        session: Sesión de base de datos
        user_id: ID del usuario que realizó la acción
        user_email: Email del usuario
        tienda_id: ID de la tienda
        action: Tipo de acción (CREATE, UPDATE, DELETE, etc)
        entity_type: Tipo de entidad (Product, Venta, Cliente, etc)
        entity_id: ID de la entidad
        old_values: Valores anteriores (para UPDATE/DELETE)
        new_values: Valores nuevos (para CREATE/UPDATE)
        description: Descripción legible de la acción
        request: Request de FastAPI para obtener IP y user agent
    
    Returns:
        AuditLog creado
    """
    # Extraer información de la request si está disponible
    ip_address = None
    user_agent = None
    
    if request:
        # Obtener IP del cliente (considerando proxies)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        else:
            ip_address = request.client.host if request.client else None
        
        # Obtener user agent
        user_agent = request.headers.get("User-Agent")
    
    # Crear registro de auditoría
    audit_log = AuditLog(
        user_id=user_id,
        user_email=user_email,
        tienda_id=tienda_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        user_agent=user_agent,
        description=description,
    )
    
    session.add(audit_log)
    await session.flush()
    
    return audit_log


async def log_product_creation(
    session: AsyncSession,
    user_id: UUID,
    user_email: str,
    tienda_id: UUID,
    product_id: UUID,
    product_data: Dict[str, Any],
    request: Optional[Request] = None,
):
    """Helper específico para creación de productos"""
    return await log_audit(
        session=session,
        user_id=user_id,
        user_email=user_email,
        tienda_id=tienda_id,
        action="CREATE",
        entity_type="Product",
        entity_id=str(product_id),
        new_values=product_data,
        description=f"Producto creado: {product_data.get('name', 'N/A')}",
        request=request,
    )


async def log_product_update(
    session: AsyncSession,
    user_id: UUID,
    user_email: str,
    tienda_id: UUID,
    product_id: UUID,
    old_data: Dict[str, Any],
    new_data: Dict[str, Any],
    request: Optional[Request] = None,
):
    """Helper específico para actualización de productos"""
    return await log_audit(
        session=session,
        user_id=user_id,
        user_email=user_email,
        tienda_id=tienda_id,
        action="UPDATE",
        entity_type="Product",
        entity_id=str(product_id),
        old_values=old_data,
        new_values=new_data,
        description=f"Producto actualizado: {new_data.get('name', 'N/A')}",
        request=request,
    )


async def log_product_deletion(
    session: AsyncSession,
    user_id: UUID,
    user_email: str,
    tienda_id: UUID,
    product_id: UUID,
    product_data: Dict[str, Any],
    soft_delete: bool = True,
    request: Optional[Request] = None,
):
    """Helper específico para eliminación de productos"""
    action = "SOFT_DELETE" if soft_delete else "DELETE"
    return await log_audit(
        session=session,
        user_id=user_id,
        user_email=user_email,
        tienda_id=tienda_id,
        action=action,
        entity_type="Product",
        entity_id=str(product_id),
        old_values=product_data,
        description=f"Producto {'desactivado' if soft_delete else 'eliminado'}: {product_data.get('name', 'N/A')}",
        request=request,
    )


async def log_price_change(
    session: AsyncSession,
    user_id: UUID,
    user_email: str,
    tienda_id: UUID,
    variant_id: UUID,
    old_price: float,
    new_price: float,
    request: Optional[Request] = None,
):
    """Helper específico para cambios de precio"""
    return await log_audit(
        session=session,
        user_id=user_id,
        user_email=user_email,
        tienda_id=tienda_id,
        action="UPDATE",
        entity_type="ProductVariant",
        entity_id=str(variant_id),
        old_values={"price": old_price},
        new_values={"price": new_price},
        description=f"Cambio de precio: ${old_price} -> ${new_price}",
        request=request,
    )


async def log_stock_adjustment(
    session: AsyncSession,
    user_id: UUID,
    user_email: str,
    tienda_id: UUID,
    variant_id: UUID,
    old_stock: float,
    new_stock: float,
    adjustment_type: str,
    request: Optional[Request] = None,
):
    """Helper específico para ajustes de stock"""
    return await log_audit(
        session=session,
        user_id=user_id,
        user_email=user_email,
        tienda_id=tienda_id,
        action="UPDATE",
        entity_type="Stock",
        entity_id=str(variant_id),
        old_values={"stock": old_stock},
        new_values={"stock": new_stock},
        description=f"Ajuste de stock ({adjustment_type}): {old_stock} -> {new_stock}",
        request=request,
    )
