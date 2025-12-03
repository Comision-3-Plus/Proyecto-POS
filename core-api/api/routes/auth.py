"""
Rutas de Autenticación - Nexus POS
Endpoints para login y gestión de tokens
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from core.db import get_session
from core.security import verify_password, create_access_token
from models import User
from schemas import Token, LoginRequest, RegisterRequest
from api.deps import CurrentUser, CurrentTienda


router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> Token:
    """
    Endpoint de Login - OAuth2 Password Flow
    
    Validaciones:
    1. Usuario existe por email
    2. Password es correcto
    3. Usuario está activo
    
    Returns:
        Token JWT con el user_id en el payload (sub)
    """
    # Buscar usuario por email
    statement = select(User).where(User.email == login_data.email)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    # Validar existencia y password
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validar que esté activo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear token JWT
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Cargar la tienda del usuario para devolverla en el login
    await session.refresh(user, ["tienda"])
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "rol": user.rol,
            "tienda_id": str(user.tienda_id),
            "tienda": {
                "id": str(user.tienda.id),
                "nombre": user.tienda.nombre,
                "rubro": user.tienda.rubro,
            } if user.tienda else None
        }
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    registro: RegisterRequest,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> Token:
    """
    🎯 REGISTRO PÚBLICO - Crear cuenta y tienda en un solo paso
    
    Cualquier persona puede registrarse y crear su negocio.
    Se crea automáticamente:
    - ✅ Usuario con rol 'owner' (dueño de la tienda)
    - ✅ Tienda activa
    - ✅ Ubicación default "Local Principal"
    - ✅ Talles básicos (S, M, L, XL)
    - ✅ Colores básicos (Negro, Blanco)
    
    El usuario queda listo para:
    - Invitar empleados a su tienda
    - Cargar productos
    - Realizar ventas
    """
    from core.security import get_password_hash
    from models import Tienda, Location, Size, Color
    from uuid import uuid4
    
    try:
        # 1. Verificar que el email no exista
        result = await session.execute(select(User).where(User.email == registro.email))
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        
        # 2. Crear la Tienda
        tienda = Tienda(
            id=uuid4(),
            nombre=registro.tienda_nombre,
            rubro=registro.tienda_rubro.lower(),
            is_active=True
        )
        session.add(tienda)
        await session.flush()  # Obtener ID para relaciones
        
        # 3. Crear Ubicación Default (OBLIGATORIO para inventario)
        location = Location(
            location_id=uuid4(),
            tienda_id=tienda.id,
            name="Local Principal",
            type="STORE",
            address=registro.tienda_nombre,  # Usar nombre de tienda por defecto
            is_default=True
        )
        session.add(location)
        await session.flush()
        
        # 4. Crear Usuario Dueño
        user = User(
            id=uuid4(),
            email=registro.email,
            hashed_password=get_password_hash(registro.password),
            full_name=registro.full_name,
            documento_tipo="DNI",
            documento_numero=registro.dni,  # Usar dni del schema
            rol="owner",  # Dueño de la tienda
            tienda_id=tienda.id,
            is_active=True
        )
        session.add(user)
        
        # 5. Commit transaccional
        await session.commit()
        await session.refresh(user)
        await session.refresh(user, ["tienda"])
        
        # 8. Crear token de acceso
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "rol": user.rol,
                "tienda_id": str(user.tienda_id),
                "tienda": {
                    "id": str(user.tienda.id),
                    "nombre": user.tienda.nombre,
                    "rubro": user.tienda.rubro,
                } if user.tienda else None
            }
        )
        
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el registro: {str(e)}"
        )


@router.post("/login/form", response_model=Token)
async def login_form(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> Token:
    """
    Login alternativo compatible con OAuth2PasswordRequestForm
    Útil para Swagger UI y herramientas OAuth2 estándar
    """
    # Buscar usuario por email (username en el form)
    statement = select(User).where(User.email == form_data.username)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Cargar la tienda del usuario para devolverla en el login
    await session.refresh(user, ["tienda"])
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "rol": user.rol,
            "tienda_id": str(user.tienda_id),
            "tienda": {
                "id": str(user.tienda.id),
                "nombre": user.tienda.nombre,
                "rubro": user.tienda.rubro,
            } if user.tienda else None
        }
    )


@router.get("/me")
async def get_current_user_info(
    current_user: CurrentUser,
    current_tienda: CurrentTienda
) -> dict:
    """
    Endpoint para obtener información del usuario autenticado
    Incluye datos de la tienda (Multi-Tenant)
    
    Demuestra el uso de las dependencias Multi-Tenant
    """
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "rol": current_user.rol,
        "is_active": current_user.is_active,
        "tienda_id": str(current_tienda.id),
        "tienda": {
            "id": str(current_tienda.id),
            "nombre": current_tienda.nombre,
            "rubro": current_tienda.rubro,
            "is_active": current_tienda.is_active
        }
    }
