"""
Decorators y Dependencies para RBAC - Nexus POS Enterprise
Integración con FastAPI
"""
from typing import List, Callable
from functools import wraps
from fastapi import HTTPException, Depends, status
from core.rbac import Permission, get_role_permissions, get_missing_permissions
from api.deps import get_current_user
from models import User


def require_permissions(*required_permissions: Permission):
    """
    Decorator para endpoints que requieren permisos específicos
    
    Uso:
    ```python
    @router.delete("/productos/{id}")
    @require_permissions(Permission.PRODUCTOS_DELETE)
    async def delete_producto(...):
        ...
    ```
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Obtener usuario del context
            current_user: User = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado"
                )
            
            # Obtener permisos del rol del usuario
            user_permissions = get_role_permissions(current_user.rol)
            
            # Verificar permisos
            missing = get_missing_permissions(user_permissions, list(required_permissions))
            
            if missing:
                missing_names = [perm.value for perm in missing]
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "message": "Permisos insuficientes",
                        "required_permissions": [p.value for p in required_permissions],
                        "missing_permissions": missing_names,
                        "user_role": current_user.rol
                    }
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def check_permission_dependency(
    permission: Permission,
    current_user: User = Depends(get_current_user)
):
    """
    Dependency para verificar un solo permiso
    
    Uso:
    ```python
    @router.get("/costos")
    async def view_costs(
        _: None = Depends(check_permission_dependency(Permission.PRODUCTOS_VIEW_COST))
    ):
        ...
    ```
    """
    user_permissions = get_role_permissions(current_user.rol)
    
    if permission not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": f"Permiso requerido: {permission.value}",
                "user_role": current_user.rol
            }
        )


class PermissionChecker:
    """
    Dependency class para verificar múltiples permisos
    
    Uso:
    ```python
    @router.post("/ventas")
    async def create_venta(
        checker: PermissionChecker = Depends()
    ):
        checker.require(Permission.VENTAS_CREATE)
        
        if discount > 20:
            checker.require(Permission.VENTAS_APPROVE_DISCOUNT)
        
        ...
    ```
    """
    def __init__(self, current_user: User = Depends(get_current_user)):
        self.user = current_user
        self.permissions = get_role_permissions(current_user.rol)
    
    def has(self, permission: Permission) -> bool:
        """Verifica si tiene un permiso (sin lanzar excepción)"""
        return permission in self.permissions
    
    def require(self, permission: Permission):
        """Verifica si tiene un permiso (lanza excepción si no)"""
        if not self.has(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": f"Permiso requerido: {permission.value}",
                    "user_role": self.user.rol
                }
            )
    
    def require_any(self, *permissions: Permission):
        """Requiere al menos uno de los permisos listados"""
        if not any(self.has(perm) for perm in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "Se requiere al menos uno de los siguientes permisos",
                    "required_permissions": [p.value for p in permissions],
                    "user_role": self.user.rol
                }
            )
    
    def require_all(self, *permissions: Permission):
        """Requiere TODOS los permisos listados"""
        missing = [p for p in permissions if not self.has(p)]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "Permisos insuficientes",
                    "missing_permissions": [p.value for p in missing],
                    "user_role": self.user.rol
                }
            )


# =====================================================
# HELPERS PARA CASOS DE USO ESPECÍFICOS
# =====================================================

async def require_owner_or_permission(
    resource_owner_id: str,
    permission: Permission,
    current_user: User = Depends(get_current_user)
):
    """
    Verifica que el usuario sea el dueño del recurso
    O que tenga el permiso requerido
    
    Uso: Un vendedor puede ver sus propias ventas,
         pero un gerente puede ver todas
    """
    is_owner = str(current_user.id) == resource_owner_id
    user_permissions = get_role_permissions(current_user.rol)
    has_permission = permission in user_permissions
    
    if not (is_owner or has_permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este recurso"
        )


def require_discount_approval(discount_percent: float, checker: PermissionChecker):
    """
    Helper para validar descuentos según lógica de negocio
    """
    if discount_percent > 20:
        checker.require(Permission.VENTAS_APPROVE_DISCOUNT)


def require_purchase_approval(amount: float, checker: PermissionChecker):
    """
    Helper para validar aprobación de compras según monto
    """
    if amount > 100000:
        checker.require(Permission.COMPRAS_APPROVE)
