"""
Servicio de gestión de permisos RBAC
"""
from typing import List, Set, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from models_rbac import Permission, Role, RolePermission, SYSTEM_PERMISSIONS, SYSTEM_ROLES
from models import Usuario


class PermissionService:
    """Servicio para verificar y gestionar permisos"""
    
    @staticmethod
    async def user_has_permission(
        db: AsyncSession,
        user_id: UUID,
        permission_code: str
    ) -> bool:
        """
        Verifica si un usuario tiene un permiso específico
        Considera herencia de roles
        """
        # Obtener usuario con su rol
        result = await db.execute(
            select(Usuario).where(Usuario.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.role_id:
            return False
        
        # Obtener permisos del rol (incluyendo heredados)
        permissions = await PermissionService.get_role_permissions(
            db, user.role_id
        )
        
        return permission_code in permissions
    
    @staticmethod
    async def get_role_permissions(
        db: AsyncSession,
        role_id: UUID,
        include_inherited: bool = True
    ) -> Set[str]:
        """
        Obtiene todos los permisos de un rol
        Incluye permisos heredados del rol padre si corresponde
        """
        permissions = set()
        
        # Obtener rol
        result = await db.execute(
            select(Role).where(Role.id == role_id)
        )
        role = result.scalar_one_or_none()
        
        if not role:
            return permissions
        
        # Si tiene rol padre, obtener permisos heredados
        if include_inherited and role.parent_role_id:
            parent_permissions = await PermissionService.get_role_permissions(
                db, role.parent_role_id, include_inherited=True
            )
            permissions.update(parent_permissions)
        
        # Obtener permisos directos del rol
        result = await db.execute(
            select(Permission).join(RolePermission).where(
                and_(
                    RolePermission.role_id == role_id,
                    RolePermission.granted == True
                )
            )
        )
        
        for perm in result.scalars().all():
            permissions.add(perm.code)
        
        # Remover permisos explícitamente denegados
        result = await db.execute(
            select(Permission).join(RolePermission).where(
                and_(
                    RolePermission.role_id == role_id,
                    RolePermission.granted == False
                )
            )
        )
        
        for perm in result.scalars().all():
            permissions.discard(perm.code)
        
        return permissions
    
    @staticmethod
    async def get_user_permissions(
        db: AsyncSession,
        user_id: UUID
    ) -> Set[str]:
        """Obtiene todos los permisos de un usuario"""
        result = await db.execute(
            select(Usuario).where(Usuario.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.role_id:
            return set()
        
        return await PermissionService.get_role_permissions(db, user.role_id)
    
    @staticmethod
    async def initialize_system_permissions(db: AsyncSession):
        """Inicializa los permisos del sistema en la BD"""
        for code, data in SYSTEM_PERMISSIONS.items():
            # Verificar si ya existe
            result = await db.execute(
                select(Permission).where(Permission.code == code)
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                perm = Permission(
                    code=code,
                    name=data["name"],
                    module=data["module"]
                )
                db.add(perm)
        
        await db.commit()
    
    @staticmethod
    async def initialize_system_roles(db: AsyncSession, tienda_id: Optional[UUID] = None):
        """Inicializa los roles del sistema en la BD"""
        for role_code, data in SYSTEM_ROLES.items():
            # Verificar si ya existe
            result = await db.execute(
                select(Role).where(
                    and_(
                        Role.name == data["name"],
                        Role.tienda_id == tienda_id
                    )
                )
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                role = Role(
                    name=data["name"],
                    description=data["description"],
                    is_system=True,
                    tienda_id=tienda_id
                )
                db.add(role)
                await db.flush()
                
                # Agregar permisos al rol
                for perm_code in data["permissions"]:
                    result = await db.execute(
                        select(Permission).where(Permission.code == perm_code)
                    )
                    perm = result.scalar_one_or_none()
                    
                    if perm:
                        role_perm = RolePermission(
                            role_id=role.id,
                            permission_id=perm.id,
                            granted=True
                        )
                        db.add(role_perm)
        
        await db.commit()


# Dependency para verificar permisos
async def require_permission(permission_code: str):
    """
    Dependency para rutas que requieren un permiso específico
    
    Uso:
    @router.post("/productos")
    async def create_product(
        ...,
        _: None = Depends(require_permission("productos.crear"))
    ):
    """
    from fastapi import Depends, HTTPException, status
    from core.database import get_session
    from core.auth import get_current_user
    
    async def permission_checker(
        db: AsyncSession = Depends(get_session),
        current_user: Usuario = Depends(get_current_user)
    ):
        has_permission = await PermissionService.user_has_permission(
            db, current_user.id, permission_code
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes el permiso requerido: {permission_code}"
            )
    
    return permission_checker
