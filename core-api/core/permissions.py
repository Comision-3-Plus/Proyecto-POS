"""
Sistema de Permisos Granulares (RBAC con Scopes) - Nexus POS
Reemplaza el sistema de roles simples por permisos específicos
"""
from enum import Enum
from typing import List, Set
from functools import wraps
from fastapi import HTTPException, status
from models import User


class Permission(str, Enum):
    """
    Permisos granulares del sistema
    Formato: recurso:acción
    """
    # Productos
    PRODUCTOS_READ = "productos:read"
    PRODUCTOS_CREATE = "productos:create"
    PRODUCTOS_UPDATE = "productos:update"
    PRODUCTOS_DELETE = "productos:delete"
    PRODUCTOS_EXPORT = "productos:export"
    
    # Ventas
    VENTAS_READ = "ventas:read"
    VENTAS_CREATE = "ventas:create"
    VENTAS_UPDATE = "ventas:update"
    VENTAS_DELETE = "ventas:delete"  # Anular ventas
    VENTAS_EXPORT = "ventas:export"
    
    # Reportes
    REPORTES_BASICOS = "reportes:basicos"      # Ver reportes simples
    REPORTES_FINANCIEROS = "reportes:financieros"  # Ver reportes con ingresos/costos
    REPORTES_EXPORT = "reportes:export"        # Descargar reportes
    
    # Inventario
    INVENTARIO_READ = "inventario:read"
    INVENTARIO_AJUSTE = "inventario:ajuste"    # Ajustar stock manualmente
    
    # Usuarios (Administración)
    USERS_READ = "users:read"
    USERS_CREATE = "users:create"
    USERS_UPDATE = "users:update"
    USERS_DELETE = "users:delete"
    
    # Tienda (Configuración)
    TIENDA_READ = "tienda:read"
    TIENDA_UPDATE = "tienda:update"            # Modificar configuración de tienda
    
    # Pagos
    PAGOS_PROCESS = "pagos:process"            # Procesar pagos
    PAGOS_REFUND = "pagos:refund"              # Reembolsar pagos
    
    # Insights (IA/Analytics)
    INSIGHTS_READ = "insights:read"
    INSIGHTS_GENERATE = "insights:generate"


# Mapeo de roles a permisos (backward compatibility + nuevas capacidades)
ROLE_PERMISSIONS: dict[str, Set[Permission]] = {
    "super_admin": {
        # Super admin tiene TODOS los permisos
        *list(Permission)
    },
    
    "owner": {
        # Dueño tiene casi todos los permisos excepto gestión de super admins
        Permission.PRODUCTOS_READ,
        Permission.PRODUCTOS_CREATE,
        Permission.PRODUCTOS_UPDATE,
        Permission.PRODUCTOS_DELETE,
        Permission.PRODUCTOS_EXPORT,
        Permission.VENTAS_READ,
        Permission.VENTAS_CREATE,
        Permission.VENTAS_UPDATE,
        Permission.VENTAS_DELETE,
        Permission.VENTAS_EXPORT,
        Permission.REPORTES_BASICOS,
        Permission.REPORTES_FINANCIEROS,
        Permission.REPORTES_EXPORT,
        Permission.INVENTARIO_READ,
        Permission.INVENTARIO_AJUSTE,
        Permission.USERS_READ,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,
        Permission.TIENDA_READ,
        Permission.TIENDA_UPDATE,
        Permission.PAGOS_PROCESS,
        Permission.PAGOS_REFUND,
        Permission.INSIGHTS_READ,
        Permission.INSIGHTS_GENERATE,
    },
    
    "admin": {
        # Admin (encargado) - sin acceso a reportes financieros ni gestión de usuarios
        Permission.PRODUCTOS_READ,
        Permission.PRODUCTOS_CREATE,
        Permission.PRODUCTOS_UPDATE,
        Permission.VENTAS_READ,
        Permission.VENTAS_CREATE,
        Permission.VENTAS_UPDATE,
        Permission.REPORTES_BASICOS,
        Permission.INVENTARIO_READ,
        Permission.INVENTARIO_AJUSTE,
        Permission.TIENDA_READ,
        Permission.PAGOS_PROCESS,
        Permission.INSIGHTS_READ,
    },
    
    "cajero": {
        # Cajero - solo operaciones de venta y consulta
        Permission.PRODUCTOS_READ,
        Permission.VENTAS_READ,
        Permission.VENTAS_CREATE,
        Permission.INVENTARIO_READ,
        Permission.PAGOS_PROCESS,
    },
    
    "vendedor": {
        # Vendedor - similar a cajero pero sin procesar pagos
        Permission.PRODUCTOS_READ,
        Permission.VENTAS_READ,
        Permission.VENTAS_CREATE,
        Permission.INVENTARIO_READ,
    },
    
    "repositor": {
        # Repositor - solo gestión de inventario
        Permission.PRODUCTOS_READ,
        Permission.INVENTARIO_READ,
        Permission.INVENTARIO_AJUSTE,
    },
    
    "auditor": {
        # Auditor - solo lectura de todo
        Permission.PRODUCTOS_READ,
        Permission.VENTAS_READ,
        Permission.REPORTES_BASICOS,
        Permission.REPORTES_FINANCIEROS,
        Permission.REPORTES_EXPORT,
        Permission.INVENTARIO_READ,
        Permission.USERS_READ,
        Permission.TIENDA_READ,
        Permission.INSIGHTS_READ,
    },
}


def get_user_permissions(user: User) -> Set[Permission]:
    """
    Obtiene todos los permisos de un usuario según su rol
    
    Args:
        user: Usuario del sistema
    
    Returns:
        Set de permisos que tiene el usuario
    """
    return ROLE_PERMISSIONS.get(user.rol, set())


def has_permission(user: User, required_permission: Permission) -> bool:
    """
    Verifica si un usuario tiene un permiso específico
    
    Args:
        user: Usuario del sistema
        required_permission: Permiso requerido
    
    Returns:
        True si el usuario tiene el permiso, False en caso contrario
    """
    user_permissions = get_user_permissions(user)
    return required_permission in user_permissions


def require_permission(permission: Permission):
    """
    Decorador para proteger endpoints con permisos granulares
    
    Uso:
        @router.delete("/ventas/{venta_id}")
        @require_permission(Permission.VENTAS_DELETE)
        async def anular_venta(venta_id: UUID, current_user: CurrentUser):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Obtener current_user de los kwargs
            current_user = kwargs.get('current_user')
            if current_user is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="current_user not found in function arguments"
                )
            
            # Verificar permiso
            if not has_permission(current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No tienes permiso para: {permission.value}. Tu rol '{current_user.rol}' no tiene este acceso."
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(*permissions: Permission):
    """
    Decorador que requiere AL MENOS UNO de los permisos especificados
    
    Uso:
        @require_any_permission(Permission.REPORTES_BASICOS, Permission.REPORTES_FINANCIEROS)
        async def ver_reporte(current_user: CurrentUser):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if current_user is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="current_user not found in function arguments"
                )
            
            user_permissions = get_user_permissions(current_user)
            if not any(perm in user_permissions for perm in permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requieres uno de estos permisos: {[p.value for p in permissions]}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_all_permissions(*permissions: Permission):
    """
    Decorador que requiere TODOS los permisos especificados
    
    Uso:
        @require_all_permissions(Permission.REPORTES_FINANCIEROS, Permission.REPORTES_EXPORT)
        async def descargar_reporte_financiero(current_user: CurrentUser):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if current_user is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="current_user not found in function arguments"
                )
            
            user_permissions = get_user_permissions(current_user)
            missing_permissions = [p for p in permissions if p not in user_permissions]
            
            if missing_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Te faltan estos permisos: {[p.value for p in missing_permissions]}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
