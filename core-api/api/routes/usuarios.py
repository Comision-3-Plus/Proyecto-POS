"""
Rutas de Usuarios - Gestión de empleados por tienda
Permite a los dueños invitar empleados a su tienda
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel, EmailStr
from core.db import get_session
from api.deps import CurrentUser
from models import User
from core.security import get_password_hash
from uuid import uuid4

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


# ==================== SCHEMAS ====================
class InvitarUsuarioRequest(BaseModel):
    """Schema para invitar un nuevo empleado a la tienda"""
    email: EmailStr
    full_name: str
    password: str
    rol: str = "cajero"  # cajero, vendedor, encargado, admin
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "juan@ejemplo.com",
                "full_name": "Juan Pérez",
                "password": "password123",
                "rol": "cajero"
            }
        }


class UsuarioResponse(BaseModel):
    """Schema de respuesta de usuario"""
    id: str
    email: str
    full_name: str
    rol: str
    tienda_id: str
    is_active: bool
    
    @classmethod
    def from_orm(cls, user: User):
        return cls(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            rol=user.rol,
            tienda_id=str(user.tienda_id),
            is_active=user.is_active
        )


# ==================== ENDPOINTS ====================
@router.get("", response_model=List[UsuarioResponse])
async def listar_empleados(
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    📋 Listar todos los empleados de MI tienda
    
    Requiere: Usuario autenticado (cualquier rol)
    Solo ve empleados de su propia tienda
    """
    result = await session.execute(
        select(User).where(User.tienda_id == current_user.tienda_id)
    )
    usuarios = result.scalars().all()
    return [UsuarioResponse.from_orm(u) for u in usuarios]


@router.post("/invitar", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def invitar_empleado(
    invitacion: InvitarUsuarioRequest,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    👥 Invitar un nuevo empleado a MI tienda
    
    Requiere: Rol 'owner' o 'admin'
    
    Roles disponibles:
    - cajero: Solo puede hacer ventas
    - vendedor: Ventas + gestión de clientes
    - encargado: Ventas + inventario + reportes
    - admin: Acceso completo (excepto invitar otros admins)
    """
    # Verificar permisos (solo owner y admin pueden invitar)
    if current_user.rol not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los dueños o administradores pueden invitar empleados"
        )
    
    # Verificar que el email no exista
    result = await session.execute(select(User).where(User.email == invitacion.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Validar rol
    roles_permitidos = ["cajero", "vendedor", "encargado", "admin"]
    if invitacion.rol not in roles_permitidos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Roles permitidos: {', '.join(roles_permitidos)}"
        )
    
    # Solo owner puede crear admin
    if invitacion.rol == "admin" and current_user.rol != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el dueño puede crear administradores"
        )
    
    # Crear el nuevo usuario
    nuevo_usuario = User(
        id=uuid4(),
        email=invitacion.email,
        hashed_password=get_password_hash(invitacion.password),
        full_name=invitacion.full_name,
        rol=invitacion.rol,
        tienda_id=current_user.tienda_id,  # Misma tienda que el que invita
        is_active=True
    )
    
    session.add(nuevo_usuario)
    await session.commit()
    await session.refresh(nuevo_usuario)
    
    return UsuarioResponse.from_orm(nuevo_usuario)


@router.patch("/{usuario_id}/rol")
async def cambiar_rol(
    usuario_id: str,
    nuevo_rol: str,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    🔄 Cambiar el rol de un empleado
    
    Requiere: Rol 'owner' o 'admin'
    """
    # Verificar permisos
    if current_user.rol not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para cambiar roles"
        )
    
    # Buscar el usuario
    result = await session.execute(select(User).where(User.id == usuario_id))
    usuario = result.scalar_one_or_none()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que sea de la misma tienda
    if usuario.tienda_id != current_user.tienda_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar usuarios de otra tienda"
        )
    
    # No puede modificarse a sí mismo
    if usuario.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes cambiar tu propio rol"
        )
    
    # Solo owner puede crear/modificar admin
    if nuevo_rol == "admin" and current_user.rol != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el dueño puede asignar el rol de administrador"
        )
    
    # Cambiar el rol
    usuario.rol = nuevo_rol
    await session.commit()
    
    return {"message": f"Rol actualizado a {nuevo_rol}"}


@router.delete("/{usuario_id}")
async def desactivar_empleado(
    usuario_id: str,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    🗑️ Desactivar un empleado (soft delete)
    
    Requiere: Rol 'owner' o 'admin'
    """
    # Verificar permisos
    if current_user.rol not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para desactivar empleados"
        )
    
    # Buscar el usuario
    result = await session.execute(select(User).where(User.id == usuario_id))
    usuario = result.scalar_one_or_none()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que sea de la misma tienda
    if usuario.tienda_id != current_user.tienda_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar usuarios de otra tienda"
        )
    
    # No puede desactivarse a sí mismo
    if usuario.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivarte a ti mismo"
        )
    
    # Desactivar
    usuario.is_active = False
    await session.commit()
    
    return {"message": "Empleado desactivado exitosamente"}


@router.patch("/{usuario_id}/reactivar")
async def reactivar_empleado(
    usuario_id: str,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    ✅ Reactivar un empleado desactivado
    
    Requiere: Rol 'owner' o 'admin'
    """
    # Verificar permisos
    if current_user.rol not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para reactivar empleados"
        )
    
    # Buscar el usuario
    result = await session.execute(select(User).where(User.id == usuario_id))
    usuario = result.scalar_one_or_none()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que sea de la misma tienda
    if usuario.tienda_id != current_user.tienda_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar usuarios de otra tienda"
        )
    
    # Reactivar
    usuario.is_active = True
    await session.commit()
    
    return {"message": "Empleado reactivado exitosamente"}
