"""
Modelos de Auditoría - Nexus POS Enterprise
Sistema de audit trails inmutables para compliance
"""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import DateTime, func, Index
from sqlalchemy.dialects.postgresql import JSONB


class AuditLog(SQLModel, table=True):
    """
    🏛️ PILAR 1: AUDITORÍA INMUTABLE
    
    Tabla de logs de auditoría que NUNCA se borra.
    Cumple con requisitos de compliance para empresas grandes.
    
    Casos de Uso:
    - "¿Quién cambió el precio de la campera el martes a las 3 AM?"
    - Auditoría interna
    - Compliance regulatorio (AFIP, ARBA)
    - Detección de fraude
    - Resolución de disputas
    """
    __tablename__ = "audit_logs"
    
    # Primary Key
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    
    # Who (Usuario que ejecutó la acción)
    user_id: UUID = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
        description="Usuario que ejecutó la acción"
    )
    user_email: str = Field(
        max_length=255,
        nullable=False,
        description="Email del usuario (denormalizado para prevenir pérdida de datos)"
    )
    user_rol: str = Field(
        max_length=50,
        nullable=False,
        description="Rol del usuario al momento de la acción"
    )
    
    # What (Qué se hizo)
    action: str = Field(
        max_length=50,
        nullable=False,
        index=True,
        description="Tipo de acción: CREATE, UPDATE, DELETE, VOID, APPROVE"
    )
    resource_type: str = Field(
        max_length=100,
        nullable=False,
        index=True,
        description="Tipo de recurso: Producto, Venta, Precio, Usuario, etc."
    )
    resource_id: Optional[str] = Field(
        default=None,
        max_length=255,
        nullable=True,
        index=True,
        description="ID del recurso afectado"
    )
    
    # When (Cuándo)
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now()),
        description="Timestamp UTC de la acción"
    )
    
    # Where (Desde dónde)
    ip_address: Optional[str] = Field(
        default=None,
        max_length=45,  # IPv6 tiene hasta 45 caracteres
        nullable=True,
        description="IP desde la que se ejecutó la acción"
    )
    user_agent: Optional[str] = Field(
        default=None,
        nullable=True,
        description="User Agent del navegador/cliente"
    )
    
    # Context (Contexto de la operación)
    endpoint: str = Field(
        max_length=255,
        nullable=False,
        description="Endpoint HTTP que ejecutó la acción"
    )
    method: str = Field(
        max_length=10,
        nullable=False,
        description="Método HTTP: GET, POST, PUT, DELETE, PATCH"
    )
    request_id: Optional[str] = Field(
        default=None,
        max_length=100,
        nullable=True,
        index=True,
        description="Request ID para correlacionar logs"
    )
    
    # Payload (Qué cambió)
    payload_before: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Estado del recurso ANTES de la modificación (NULL para CREATE)"
    )
    payload_after: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="Estado del recurso DESPUÉS de la modificación (NULL para DELETE)"
    )
    
    # Metadata adicional
    reason: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Razón de la acción (ej: 'Corrección de inventario', 'Solicitud de cliente')"
    )
    is_sensitive: bool = Field(
        default=False,
        nullable=False,
        description="Flag para operaciones sensibles (cambio de precios, eliminaciones)"
    )
    
    # Multi-Tenant
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True,
        description="ID de la tienda (aislamiento multi-tenant)"
    )
    
    __table_args__ = (
        # Índice compuesto para búsquedas frecuentes
        Index('idx_audit_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_tienda_timestamp', 'tienda_id', 'timestamp'),
        Index('idx_audit_action_sensitive', 'action', 'is_sensitive'),
        # Índice GIN para búsqueda en JSON
        Index('idx_audit_payload_before', 'payload_before', postgresql_using='gin'),
        Index('idx_audit_payload_after', 'payload_after', postgresql_using='gin'),
    )


class PermissionAudit(SQLModel, table=True):
    """
    Auditoría de cambios en permisos
    Para detectar escalación de privilegios
    """
    __tablename__ = "permission_audits"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True
    )
    
    user_id: UUID = Field(
        foreign_key="users.id",
        nullable=False,
        index=True
    )
    
    changed_by_user_id: UUID = Field(
        foreign_key="users.id",
        nullable=False,
        description="Usuario que modificó los permisos"
    )
    
    permission_before: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        description="Permisos antes del cambio"
    )
    
    permission_after: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        description="Permisos después del cambio"
    )
    
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    
    reason: Optional[str] = Field(
        default=None,
        description="Justificación del cambio de permisos"
    )
    
    tienda_id: UUID = Field(
        foreign_key="tiendas.id",
        nullable=False,
        index=True
    )
