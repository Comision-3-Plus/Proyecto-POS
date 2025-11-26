"""
Rutas de Admin - Gestión de Tiendas y Usuarios
Solo accesible para super_admin
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel, EmailStr
from core.db import get_session
from api.deps import get_current_user
from models import User, Tienda, Location, Size, Color
from core.security import get_password_hash
import uuid

router = APIRouter()


# ==================== SCHEMAS ====================
class TiendaCreate(BaseModel):
    nombre: str
    rubro: str  # CARNICERIA, VERDULERIA, FARMACIA, etc.


class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    rol: str = "cajero"  # cajero, admin, super_admin
    tienda_id: str  # UUID de la tienda


class TiendaResponse(BaseModel):
    id: str
    nombre: str
    rubro: str
    is_active: bool = True
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, tienda):
        return cls(
            id=str(tienda.id),
            nombre=tienda.nombre,
            rubro=tienda.rubro,
            is_active=tienda.is_active
        )


class UsuarioResponse(BaseModel):
    id: str
    email: str
    full_name: str
    rol: str
    tienda_id: str
    is_active: bool
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, usuario):
        return cls(
            id=str(usuario.id),
            email=usuario.email,
            full_name=usuario.full_name,
            rol=usuario.rol,
            tienda_id=str(usuario.tienda_id),
            is_active=usuario.is_active
        )


# ==================== DEPENDENCIAS ====================
async def require_super_admin(current_user: User = Depends(get_current_user)):
    """Verifica que el usuario sea super_admin"""
    if current_user.rol != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo super_admin puede acceder a este endpoint"
        )
    return current_user


# ==================== ENDPOINTS ====================
@router.get("/tiendas", response_model=List[TiendaResponse])
async def list_tiendas(
    db: AsyncSession = Depends(get_session),
    admin: User = Depends(require_super_admin)
):
    """Listar todas las tiendas del sistema"""
    result = await db.execute(select(Tienda))
    tiendas = result.scalars().all()
    return [TiendaResponse.from_orm(t) for t in tiendas]


@router.post("/tiendas", response_model=TiendaResponse)
async def create_tienda(
    tienda_data: TiendaCreate,
    db: AsyncSession = Depends(get_session),
    admin: User = Depends(require_super_admin)
):
    """
    Crear una nueva tienda con auto-provisioning de recursos básicos
    
    🚀 AUTO-CREACIÓN:
    - Location Default "Depósito Central"
    - Talles básicos: S, M, L, XL
    - Colores básicos: Negro, Blanco
    
    Esto previene el "zombi tenant" - tiendas sin ubicación default
    """
    try:
        # 1. Crear la Tienda
        nueva_tienda = Tienda(
            id=uuid.uuid4(),
            nombre=tienda_data.nombre,
            rubro=tienda_data.rubro.lower(),
            is_active=True
        )
        db.add(nueva_tienda)
        await db.flush()  # Obtener ID sin hacer commit aún
        
        # 2. OBLIGATORIO: Crear Location Default
        default_location = Location(
            tienda_id=nueva_tienda.id,
            name="Depósito Central",
            type="WAREHOUSE",
            is_default=True,
            address=tienda_data.nombre  # Usar nombre de tienda como dirección default
        )
        db.add(default_location)
        
        # 3. RECOMENDADO: Crear talles básicos para que el usuario no arranque en blanco
        sizes_basicos = ["S", "M", "L", "XL"]
        for i, s in enumerate(sizes_basicos):
            db.add(Size(
                tienda_id=nueva_tienda.id,
                name=s,
                sort_order=i
            ))
        
        # 4. RECOMENDADO: Crear colores básicos
        colores_basicos = [
            ("Negro", "#000000"),
            ("Blanco", "#FFFFFF")
        ]
        for c_name, c_hex in colores_basicos:
            db.add(Color(
                tienda_id=nueva_tienda.id,
                name=c_name,
                hex_code=c_hex
            ))
        
        # 5. Commit transaccional (si algo falla, se revierte todo)
        await db.commit()
        await db.refresh(nueva_tienda)
        
        return TiendaResponse.from_orm(nueva_tienda)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando tienda: {str(e)}"
        )


@router.get("/usuarios", response_model=List[UsuarioResponse])
async def list_usuarios(
    tienda_id: str | None = None,
    db: AsyncSession = Depends(get_session),
    admin: User = Depends(require_super_admin)
):
    """Listar usuarios (opcionalmente filtrados por tienda)"""
    query = select(User)
    if tienda_id:
        query = query.where(User.tienda_id == tienda_id)
    
    result = await db.execute(query)
    usuarios = result.scalars().all()
    return [UsuarioResponse.from_orm(u) for u in usuarios]


@router.post("/usuarios", response_model=UsuarioResponse)
async def create_usuario(
    usuario_data: UsuarioCreate,
    db: AsyncSession = Depends(get_session),
    admin: User = Depends(require_super_admin)
):
    """Crear un nuevo usuario para una tienda"""
    
    # Verificar que no exista el email
    result = await db.execute(select(User).where(User.email == usuario_data.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado"
        )
    
    # Verificar que la tienda existe
    result = await db.execute(select(Tienda).where(Tienda.id == usuario_data.tienda_id))
    tienda = result.scalar_one_or_none()
    if not tienda:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tienda no encontrada"
        )
    
    # Crear usuario
    nuevo_usuario = User(
        id=uuid.uuid4(),
        email=usuario_data.email,
        hashed_password=get_password_hash(usuario_data.password),
        full_name=usuario_data.full_name,
        rol=usuario_data.rol,
        tienda_id=uuid.UUID(usuario_data.tienda_id),
        is_active=True
    )
    db.add(nuevo_usuario)
    await db.commit()
    await db.refresh(nuevo_usuario)
    return UsuarioResponse.from_orm(nuevo_usuario)


@router.delete("/usuarios/{usuario_id}")
async def delete_usuario(
    usuario_id: str,
    db: AsyncSession = Depends(get_session),
    admin: User = Depends(require_super_admin)
):
    """Desactivar un usuario (soft delete)"""
    result = await db.execute(select(User).where(User.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    usuario.is_active = False
    await db.commit()
    return {"message": "Usuario desactivado exitosamente"}


@router.patch("/usuarios/{usuario_id}/activate")
async def activate_usuario(
    usuario_id: str,
    db: AsyncSession = Depends(get_session),
    admin: User = Depends(require_super_admin)
):
    """Reactivar un usuario desactivado"""
    result = await db.execute(select(User).where(User.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    usuario.is_active = True
    await db.commit()
    return {"message": "Usuario reactivado exitosamente"}


# ==================== ENDPOINT COMBINADO ====================
class OnboardingData(BaseModel):
    """Schema para crear tienda + usuario dueño en un solo paso"""
    # Datos de la tienda
    nombre_tienda: str
    rubro: str
    # Datos del usuario dueño
    email: EmailStr
    password: str
    nombre_completo: str
    rol: str = "admin"  # Por defecto admin de su tienda


class OnboardingResponse(BaseModel):
    tienda: TiendaResponse
    usuario: UsuarioResponse


@router.post("/onboarding", response_model=OnboardingResponse)
async def onboarding_tienda(
    data: OnboardingData,
    db: AsyncSession = Depends(get_session),
    admin: User = Depends(require_super_admin)
):
    """
    🎯 Endpoint combinado: Crear tienda + usuario dueño en un solo paso
    Ideal para dar de alta rápidamente a nuevos clientes como "Pedrito el verdulero"
    
    🚀 AUTO-CREACIÓN:
    - Location Default "Depósito Central"
    - Talles básicos: S, M, L, XL
    - Colores básicos: Negro, Blanco
    """
    
    try:
        # 1. Verificar que no exista el email
        result = await db.execute(select(User).where(User.email == data.email))
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El email {data.email} ya está registrado"
            )
        
        # 2. Crear la tienda
        nueva_tienda = Tienda(
            id=uuid.uuid4(),
            nombre=data.nombre_tienda,
            rubro=data.rubro.lower(),
            is_active=True
        )
        db.add(nueva_tienda)
        await db.flush()  # Flush para obtener el ID sin commit
        
        # 3. OBLIGATORIO: Crear Location Default
        default_location = Location(
            tienda_id=nueva_tienda.id,
            name="Depósito Central",
            type="WAREHOUSE",
            is_default=True,
            address=data.nombre_tienda
        )
        db.add(default_location)
        
        # 4. RECOMENDADO: Crear talles básicos
        sizes_basicos = ["S", "M", "L", "XL"]
        for i, s in enumerate(sizes_basicos):
            db.add(Size(
                tienda_id=nueva_tienda.id,
                name=s,
                sort_order=i
            ))
        
        # 5. RECOMENDADO: Crear colores básicos
        colores_basicos = [
            ("Negro", "#000000"),
            ("Blanco", "#FFFFFF")
        ]
        for c_name, c_hex in colores_basicos:
            db.add(Color(
                tienda_id=nueva_tienda.id,
                name=c_name,
                hex_code=c_hex
            ))
        
        # 6. Crear el usuario dueño
        nuevo_usuario = User(
            id=uuid.uuid4(),
            email=data.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.nombre_completo,
            rol=data.rol,
            tienda_id=nueva_tienda.id,
            is_active=True
        )
        db.add(nuevo_usuario)
        
        # 7. Commit transaccional (si algo falla, se revierte todo)
        await db.commit()
        await db.refresh(nueva_tienda)
        await db.refresh(nuevo_usuario)
        
        return OnboardingResponse(
            tienda=TiendaResponse(
                id=str(nueva_tienda.id),
                nombre=nueva_tienda.nombre,
                rubro=nueva_tienda.rubro,
                is_active=nueva_tienda.is_active
            ),
            usuario=UsuarioResponse(
                id=str(nuevo_usuario.id),
                email=nuevo_usuario.email,
                full_name=nuevo_usuario.full_name,
                rol=nuevo_usuario.rol,
                tienda_id=str(nuevo_usuario.tienda_id),
                is_active=nuevo_usuario.is_active
            )
        )
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en onboarding: {str(e)}"
        )
