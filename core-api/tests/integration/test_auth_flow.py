"""
Integration Tests - Auth Flow
Tests de flujo completo de autenticación
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from models import User, Tienda
from core.security import get_password_hash


@pytest.mark.asyncio
class TestAuthFlow:
    """Tests de flujo de autenticación completo"""
    
    async def test_register_login_flow(self, client: AsyncClient, db_session: AsyncSession):
        """Flujo: Registrar tienda → Crear usuario → Login → Request autenticado"""
        
        # 1. Crear tienda
        tienda = Tienda(nombre="Test Store", rubro="ropa")
        db_session.add(tienda)
        await db_session.commit()
        await db_session.refresh(tienda)
        
        # 2. Crear usuario
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            tienda_id=tienda.id,
            role="vendedor"
        )
        db_session.add(user)
        await db_session.commit()
        
        # 3. Login
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "password123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        token = data["access_token"]
        
        # 4. Request autenticado
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == "test@example.com"
        assert user_data["role"] == "vendedor"
    
    async def test_login_invalid_credentials(self, client: AsyncClient, db_session: AsyncSession):
        """Login con credenciales inválidas debe fallar"""
        
        # Crear tienda y usuario
        tienda = Tienda(nombre="Test Store")
        db_session.add(tienda)
        await db_session.commit()
        await db_session.refresh(tienda)
        
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("correct_password"),
            tienda_id=tienda.id
        )
        db_session.add(user)
        await db_session.commit()
        
        # Intentar login con password incorrecta
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "wrong_password"}
        )
        
        assert response.status_code == 401
    
    async def test_protected_endpoint_without_token(self, client: AsyncClient):
        """Endpoint protegido sin token debe retornar 401"""
        
        response = await client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
    
    async def test_protected_endpoint_invalid_token(self, client: AsyncClient):
        """Endpoint protegido con token inválido debe retornar 401"""
        
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        
        assert response.status_code == 401


@pytest.mark.asyncio
class TestCheckoutFlow:
    """Tests de flujo de checkout completo"""
    
    async def test_complete_sale_flow(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict
    ):
        """Flujo: Crear producto → Agregar a venta → Checkout → Verificar stock"""
        
        # Este test requiere fixtures de autenticación
        # Se implementará en la fase de integration testing
        pass


@pytest.mark.asyncio
class TestAuditFlow:
    """Tests de flujo de auditoría"""
    
    async def test_create_product_audit_logged(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict
    ):
        """Crear producto debe generar audit log automáticamente"""
        
        # Crear producto
        response = await client.post(
            "/api/v1/productos",
            headers=auth_headers,
            json={
                "nombre": "Test Product",
                "precio": 1000.0,
                "stock": 10
            }
        )
        
        assert response.status_code == 201
        
        # Verificar que se creó audit log
        from models_audit import AuditLog
        from sqlmodel import select
        
        result = await db_session.execute(
            select(AuditLog).where(
                AuditLog.resource_type == "productos",
                AuditLog.action == "CREATE"
            ).order_by(AuditLog.timestamp.desc()).limit(1)
        )
        audit_log = result.scalar_one_or_none()
        
        assert audit_log is not None
        assert audit_log.action == "CREATE"
        assert audit_log.resource_type == "productos"
        assert audit_log.payload_after is not None


@pytest.mark.asyncio
class TestRBACFlow:
    """Tests de flujo de permisos RBAC"""
    
    async def test_vendedor_cannot_delete_product(
        self,
        client: AsyncClient,
        db_session: AsyncSession
    ):
        """Vendedor NO puede eliminar productos"""
        
        # Crear tienda y usuario vendedor
        tienda = Tienda(nombre="Test Store")
        db_session.add(tienda)
        await db_session.commit()
        await db_session.refresh(tienda)
        
        vendedor = User(
            email="vendedor@test.com",
            hashed_password=get_password_hash("password"),
            tienda_id=tienda.id,
            role="vendedor"
        )
        db_session.add(vendedor)
        await db_session.commit()
        
        # Login como vendedor
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "vendedor@test.com", "password": "password"}
        )
        token = response.json()["access_token"]
        
        # Intentar eliminar producto (debe fallar con 403)
        producto_id = uuid4()
        response = await client.delete(
            f"/api/v1/productos/{producto_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403
    
    async def test_encargado_can_delete_product(
        self,
        client: AsyncClient,
        db_session: AsyncSession
    ):
        """Encargado SÍ puede eliminar productos"""
        
        # Crear tienda y usuario encargado
        tienda = Tienda(nombre="Test Store")
        db_session.add(tienda)
        await db_session.commit()
        await db_session.refresh(tienda)
        
        encargado = User(
            email="encargado@test.com",
            hashed_password=get_password_hash("password"),
            tienda_id=tienda.id,
            role="encargado"
        )
        db_session.add(encargado)
        await db_session.commit()
        
        # Login como encargado
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "encargado@test.com", "password": "password"}
        )
        token = response.json()["access_token"]
        
        # Crear producto para eliminar
        from models import Producto
        producto = Producto(
            nombre="Producto Test",
            precio=1000.0,
            stock=5,
            tienda_id=tienda.id
        )
        db_session.add(producto)
        await db_session.commit()
        await db_session.refresh(producto)
        
        # Intentar eliminar producto (debe funcionar)
        response = await client.delete(
            f"/api/v1/productos/{producto.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Puede retornar 200 o 204 dependiendo de la implementación
        assert response.status_code in [200, 204]
