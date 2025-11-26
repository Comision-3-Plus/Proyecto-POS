"""
Pytest Configuration and Fixtures
Configuración global de tests
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel
from uuid import uuid4

from main import app
from core.config import settings
from core.db import get_session
from models import Tienda, User, Producto
from core.security import get_password_hash


# =====================================================
# CONFIGURACIÓN DE PYTEST
# =====================================================

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# =====================================================
# DATABASE FIXTURES
# =====================================================

@pytest.fixture(scope="function")
async def db_engine():
    """
    Create test database engine
    Usa NullPool para evitar problemas con transacciones
    """
    # URL de test database (debe ser diferente a producción)
    TEST_DATABASE_URL = settings.DATABASE_URL.replace("/postgres", "/postgres_test")
    
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )
    
    # Crear todas las tablas
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    yield engine
    
    # Limpiar
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Create database session for tests
    Cada test tiene su propia transacción que se hace rollback
    """
    async_session = async_sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


# =====================================================
# HTTP CLIENT FIXTURES
# =====================================================

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create HTTP client for testing
    Override dependency injection para usar test database
    """
    async def override_get_session():
        yield db_session
    
    app.dependency_overrides[get_session] = override_get_session
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


# =====================================================
# AUTH FIXTURES
# =====================================================

@pytest.fixture(scope="function")
async def test_tienda(db_session: AsyncSession) -> Tienda:
    """Create test tienda"""
    tienda = Tienda(nombre="Test Store", rubro="general")
    db_session.add(tienda)
    await db_session.commit()
    await db_session.refresh(tienda)
    return tienda


@pytest.fixture(scope="function")
async def test_user_vendedor(db_session: AsyncSession, test_tienda: Tienda) -> User:
    """Create test user with vendedor role"""
    user = User(
        email="vendedor@test.com",
        hashed_password=get_password_hash("testpassword"),
        tienda_id=test_tienda.id,
        role="vendedor"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
async def test_user_encargado(db_session: AsyncSession, test_tienda: Tienda) -> User:
    """Create test user with encargado role"""
    user = User(
        email="encargado@test.com",
        hashed_password=get_password_hash("testpassword"),
        tienda_id=test_tienda.id,
        role="encargado"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
async def test_user_admin(db_session: AsyncSession, test_tienda: Tienda) -> User:
    """Create test user with admin role"""
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("testpassword"),
        tienda_id=test_tienda.id,
        role="admin"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
async def auth_headers_vendedor(client: AsyncClient, test_user_vendedor: User) -> dict:
    """Get auth headers for vendedor user"""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "vendedor@test.com", "password": "testpassword"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
async def auth_headers_encargado(client: AsyncClient, test_user_encargado: User) -> dict:
    """Get auth headers for encargado user"""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "encargado@test.com", "password": "testpassword"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
async def auth_headers_admin(client: AsyncClient, test_user_admin: User) -> dict:
    """Get auth headers for admin user"""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "testpassword"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# =====================================================
# DATA FIXTURES
# =====================================================

@pytest.fixture(scope="function")
async def test_producto(db_session: AsyncSession, test_tienda: Tienda) -> Producto:
    """Create test producto"""
    producto = Producto(
        nombre="Producto Test",
        precio=1000.0,
        stock=10,
        tienda_id=test_tienda.id
    )
    db_session.add(producto)
    await db_session.commit()
    await db_session.refresh(producto)
    return producto


@pytest.fixture(scope="function")
async def test_productos_list(db_session: AsyncSession, test_tienda: Tienda) -> list[Producto]:
    """Create list of test productos"""
    productos = [
        Producto(
            nombre=f"Producto {i}",
            precio=1000.0 * i,
            stock=10,
            tienda_id=test_tienda.id
        )
        for i in range(1, 6)
    ]
    
    for producto in productos:
        db_session.add(producto)
    
    await db_session.commit()
    
    for producto in productos:
        await db_session.refresh(producto)
    
    return productos
