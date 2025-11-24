"""
Configuración global de pytest para Nexus POS
Fixtures compartidas entre todos los tests
"""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from uuid import uuid4
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel, select
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Importaciones del proyecto
from main import app
from core.db import get_session
from core.security import get_password_hash
from models import Tienda, User, Producto, Venta, DetalleVenta
from core.config import settings

# ==================== DATABASE SETUP ====================

# URL de base de datos de testing (usa una DB separada)
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/nexus_pos_test"

# Motor de BD async para tests
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,  # True para debug SQL
    future=True,
    pool_pre_ping=True,
)

# Session maker para tests
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """
    Crea un event loop para toda la sesión de testing.
    Necesario para pytest-asyncio con scope='session'.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def session() -> AsyncGenerator[AsyncSession, None]:
    """
    Fixture que provee una sesión de BD limpia para cada test.
    Se hace rollback después de cada test para aislarlos.
    """
    async with test_engine.begin() as conn:
        # Crear todas las tablas
        await conn.run_sync(SQLModel.metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()  # Rollback después del test
    
    # Limpiar tablas después del test
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Fixture que provee un cliente HTTP async para testear endpoints.
    Sobrescribe la dependencia de get_session con la sesión de test.
    """
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield session
    
    app.dependency_overrides[get_session] = override_get_session
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


# ==================== DATA FIXTURES ====================

@pytest_asyncio.fixture
async def tienda_test(session: AsyncSession) -> Tienda:
    """
    Crea una tienda de prueba.
    """
    tienda = Tienda(
        id=uuid4(),
        nombre="Tienda Test",
        rubro="general",
        is_active=True,
    )
    session.add(tienda)
    await session.commit()
    await session.refresh(tienda)
    return tienda


@pytest_asyncio.fixture
async def tienda_ropa(session: AsyncSession) -> Tienda:
    """
    Crea una tienda de ropa para tests polimórficos.
    """
    tienda = Tienda(
        id=uuid4(),
        nombre="Boutique Fashion",
        rubro="ropa",
        is_active=True,
    )
    session.add(tienda)
    await session.commit()
    await session.refresh(tienda)
    return tienda


@pytest_asyncio.fixture
async def user_owner(session: AsyncSession, tienda_test: Tienda) -> User:
    """
    Crea un usuario dueño de tienda.
    """
    user = User(
        id=uuid4(),
        email="owner@test.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Owner Test",
        rol="owner",
        tienda_id=tienda_test.id,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest_asyncio.fixture
async def user_cajero(session: AsyncSession, tienda_test: Tienda) -> User:
    """
    Crea un usuario cajero.
    """
    user = User(
        id=uuid4(),
        email="cajero@test.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Cajero Test",
        rol="cajero",
        tienda_id=tienda_test.id,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest_asyncio.fixture
async def producto_general(session: AsyncSession, tienda_test: Tienda) -> Producto:
    """
    Crea un producto general de prueba.
    """
    producto = Producto(
        id=uuid4(),
        nombre="Coca Cola 500ml",
        sku="COCA-500",
        descripcion="Gaseosa sabor cola",
        precio_venta=1500.0,
        precio_costo=900.0,
        stock_actual=100.0,
        unidad_medida="UNIDAD",
        tipo="general",
        tienda_id=tienda_test.id,
        is_active=True,
    )
    session.add(producto)
    await session.commit()
    await session.refresh(producto)
    return producto


@pytest_asyncio.fixture
async def producto_pesable(session: AsyncSession, tienda_test: Tienda) -> Producto:
    """
    Crea un producto pesable (carnicería).
    """
    producto = Producto(
        id=uuid4(),
        nombre="Carne Molida",
        sku="CARNE-001",
        descripcion="Carne molida especial",
        precio_venta=5000.0,  # Por kilo
        precio_costo=3500.0,
        stock_actual=25.5,  # 25.5 kilos
        unidad_medida="KILO",
        tipo="pesable",
        tienda_id=tienda_test.id,
        atributos={"corte": "molida", "categoria": "res"},
        is_active=True,
    )
    session.add(producto)
    await session.commit()
    await session.refresh(producto)
    return producto


@pytest_asyncio.fixture
async def producto_ropa(session: AsyncSession, tienda_ropa: Tienda) -> Producto:
    """
    Crea un producto de ropa con atributos polimórficos.
    """
    producto = Producto(
        id=uuid4(),
        nombre="Remera Nike",
        sku="NIKE-REM-001",
        descripcion="Remera deportiva",
        precio_venta=8500.0,
        precio_costo=4200.0,
        stock_actual=15.0,
        unidad_medida="UNIDAD",
        tipo="ropa",
        tienda_id=tienda_ropa.id,
        atributos={
            "talle": "M",
            "color": "Negro",
            "marca": "Nike",
            "genero": "Unisex"
        },
        is_active=True,
    )
    session.add(producto)
    await session.commit()
    await session.refresh(producto)
    return producto


@pytest_asyncio.fixture
async def venta_completada(
    session: AsyncSession, 
    tienda_test: Tienda,
    producto_general: Producto
) -> Venta:
    """
    Crea una venta completada para tests de consulta.
    """
    venta = Venta(
        id=uuid4(),
        tienda_id=tienda_test.id,
        total=3000.0,
        metodo_pago="efectivo",
        status_pago="pagado",
    )
    session.add(venta)
    await session.flush()
    
    # Agregar detalle
    detalle = DetalleVenta(
        id=uuid4(),
        venta_id=venta.id,
        producto_id=producto_general.id,
        cantidad=2.0,
        precio_unitario=1500.0,
        subtotal=3000.0,
    )
    session.add(detalle)
    await session.commit()
    await session.refresh(venta)
    return venta


# ==================== AUTH FIXTURES ====================

@pytest_asyncio.fixture
async def owner_token(client: AsyncClient, user_owner: User) -> str:
    """
    Obtiene un token JWT válido para un usuario owner.
    """
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email": user_owner.email,
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    return data["access_token"]


@pytest_asyncio.fixture
async def cajero_token(client: AsyncClient, user_cajero: User) -> str:
    """
    Obtiene un token JWT válido para un usuario cajero.
    """
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email": user_cajero.email,
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    return data["access_token"]


@pytest_asyncio.fixture
def auth_headers_owner(owner_token: str) -> dict:
    """
    Headers de autenticación para owner.
    """
    return {"Authorization": f"Bearer {owner_token}"}


@pytest_asyncio.fixture
def auth_headers_cajero(cajero_token: str) -> dict:
    """
    Headers de autenticación para cajero.
    """
    return {"Authorization": f"Bearer {cajero_token}"}


# ==================== MOCK FIXTURES ====================

@pytest.fixture
def mock_rabbitmq(monkeypatch):
    """
    Mockea la publicación de eventos a RabbitMQ para tests unitarios.
    Retorna una lista donde se almacenan los eventos publicados.
    """
    published_events = []
    
    async def fake_publish_event(routing_key: str, data: dict, request_id=None):
        published_events.append({
            "routing_key": routing_key,
            "data": data,
            "request_id": request_id
        })
    
    monkeypatch.setattr("core.event_bus.publish_event", fake_publish_event)
    return published_events


@pytest.fixture
def mock_mercadopago(monkeypatch):
    """
    Mockea las llamadas a Mercado Pago para tests de pagos.
    """
    class MockMP:
        def preference(self):
            return self
        
        def create(self, data):
            return {
                "status": 200,
                "response": {
                    "id": "test-preference-123",
                    "init_point": "https://www.mercadopago.com/test",
                    "sandbox_init_point": "https://sandbox.mercadopago.com/test"
                }
            }
    
    return MockMP()


@pytest.fixture
def mock_afip(monkeypatch):
    """
    Mockea las llamadas a AFIP para tests de facturación.
    """
    class MockAFIP:
        def generar_cae(self, venta_data):
            return {
                "cae": "12345678901234",
                "cae_vto": "2025-12-31"
            }
    
    return MockAFIP()
