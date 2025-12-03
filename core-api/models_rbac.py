"""
Modelos para RBAC (Role-Based Access Control) Granular
Sistema de permisos con tabla N:N para máxima flexibilidad
"""
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4


class Permission(SQLModel, table=True):
    """Permisos del sistema"""
    __tablename__ = "permissions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Identificador único
    code: str = Field(unique=True, index=True, max_length=100)  # Ej: "productos.crear", "ventas.anular"
    name: str = Field(max_length=200)  # Nombre legible
    description: Optional[str] = Field(default=None)
    
    # Categoría para agrupar
    module: str = Field(max_length=50)  # productos, ventas, stock, caja, reportes, admin
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    roles: List["RolePermission"] = Relationship(back_populates="permission")


class RolePermission(SQLModel, table=True):
    """Tabla N:N entre Roles y Permisos"""
    __tablename__ = "role_permissions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    role_id: UUID = Field(foreign_key="roles.id", index=True)
    permission_id: UUID = Field(foreign_key="permissions.id", index=True)
    
    # Permite denegar explícitamente un permiso heredado
    granted: bool = Field(default=True)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    role: "Role" = Relationship(back_populates="permissions")
    permission: Permission = Relationship(back_populates="roles")


class Role(SQLModel, table=True):
    """Roles del sistema"""
    __tablename__ = "roles"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Datos básicos
    name: str = Field(unique=True, index=True, max_length=100)
    description: Optional[str] = Field(default=None)
    
    # Jerarquía (un rol puede heredar de otro)
    parent_role_id: Optional[UUID] = Field(default=None, foreign_key="roles.id")
    
    # Sistema
    is_system: bool = Field(default=False)  # Roles del sistema no se pueden eliminar
    is_active: bool = Field(default=True)
    
    # Multi-tenant
    tienda_id: Optional[UUID] = Field(default=None, foreign_key="tiendas.id", index=True)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    permissions: List[RolePermission] = Relationship(back_populates="role")
    users: List["Usuario"] = Relationship(back_populates="role")


# Permisos predefinidos del sistema
SYSTEM_PERMISSIONS = {
    # Productos
    "productos.ver": {"name": "Ver productos", "module": "productos"},
    "productos.crear": {"name": "Crear productos", "module": "productos"},
    "productos.editar": {"name": "Editar productos", "module": "productos"},
    "productos.eliminar": {"name": "Eliminar productos", "module": "productos"},
    "productos.importar": {"name": "Importar productos masivamente", "module": "productos"},
    "productos.exportar": {"name": "Exportar productos", "module": "productos"},
    
    # Ventas
    "ventas.ver": {"name": "Ver ventas", "module": "ventas"},
    "ventas.crear": {"name": "Crear ventas", "module": "ventas"},
    "ventas.anular": {"name": "Anular ventas", "module": "ventas"},
    "ventas.descuentos": {"name": "Aplicar descuentos", "module": "ventas"},
    "ventas.descuentos_ilimitados": {"name": "Descuentos sin límite", "module": "ventas"},
    
    # Stock
    "stock.ver": {"name": "Ver inventario", "module": "stock"},
    "stock.ajustar": {"name": "Ajustar stock", "module": "stock"},
    "stock.transferir": {"name": "Transferir entre tiendas", "module": "stock"},
    
    # Caja
    "caja.abrir": {"name": "Abrir caja", "module": "caja"},
    "caja.cerrar": {"name": "Cerrar caja", "module": "caja"},
    "caja.movimientos": {"name": "Registrar movimientos", "module": "caja"},
    "caja.ver_otras": {"name": "Ver cajas de otros usuarios", "module": "caja"},
    
    # Reportes
    "reportes.ver": {"name": "Ver reportes", "module": "reportes"},
    "reportes.avanzados": {"name": "Reportes avanzados", "module": "reportes"},
    "reportes.exportar": {"name": "Exportar reportes", "module": "reportes"},
    
    # Clientes
    "clientes.ver": {"name": "Ver clientes", "module": "clientes"},
    "clientes.crear": {"name": "Crear clientes", "module": "clientes"},
    "clientes.editar": {"name": "Editar clientes", "module": "clientes"},
    "clientes.eliminar": {"name": "Eliminar clientes", "module": "clientes"},
    
    # Usuarios
    "usuarios.ver": {"name": "Ver usuarios", "module": "usuarios"},
    "usuarios.crear": {"name": "Crear usuarios", "module": "usuarios"},
    "usuarios.editar": {"name": "Editar usuarios", "module": "usuarios"},
    "usuarios.eliminar": {"name": "Eliminar usuarios", "module": "usuarios"},
    
    # Admin
    "admin.configuracion": {"name": "Configuración general", "module": "admin"},
    "admin.tiendas": {"name": "Gestionar tiendas", "module": "admin"},
    "admin.integraciones": {"name": "Configurar integraciones", "module": "admin"},
    "admin.logs": {"name": "Ver logs del sistema", "module": "admin"},
}

# Roles predefinidos
SYSTEM_ROLES = {
    "super_admin": {
        "name": "Super Administrador",
        "description": "Acceso total al sistema",
        "permissions": list(SYSTEM_PERMISSIONS.keys())
    },
    "admin_tienda": {
        "name": "Administrador de Tienda",
        "description": "Gestión completa de la tienda",
        "permissions": [
            "productos.ver", "productos.crear", "productos.editar",
            "ventas.ver", "ventas.crear", "ventas.anular", "ventas.descuentos",
            "stock.ver", "stock.ajustar", "stock.transferir",
            "caja.abrir", "caja.cerrar", "caja.movimientos", "caja.ver_otras",
            "reportes.ver", "reportes.avanzados", "reportes.exportar",
            "clientes.ver", "clientes.crear", "clientes.editar",
            "usuarios.ver",
        ]
    },
    "vendedor": {
        "name": "Vendedor",
        "description": "Operación de ventas y POS",
        "permissions": [
            "productos.ver",
            "ventas.ver", "ventas.crear", "ventas.descuentos",
            "stock.ver",
            "caja.abrir", "caja.cerrar", "caja.movimientos",
            "clientes.ver", "clientes.crear",
        ]
    },
    "cajero": {
        "name": "Cajero",
        "description": "Solo operación de caja",
        "permissions": [
            "ventas.ver", "ventas.crear",
            "caja.abrir", "caja.cerrar", "caja.movimientos",
        ]
    },
    "repositor": {
        "name": "Repositor",
        "description": "Gestión de stock",
        "permissions": [
            "productos.ver",
            "stock.ver", "stock.ajustar",
        ]
    },
}
