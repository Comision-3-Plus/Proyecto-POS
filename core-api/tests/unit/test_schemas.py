"""
Tests unitarios para Schemas y Validaciones
Valida que los DTOs funcionen correctamente
"""
import pytest
from uuid import uuid4
from pydantic import ValidationError
from schemas import TiendaCreate, TiendaUpdate, UserCreate, LoginRequest
from schemas_models.ventas import VentaCreate, ItemVentaInput, ProductoScanRead


class TestTiendaSchemas:
    """Tests para schemas de Tienda"""
    
    def test_tienda_create_valid(self):
        """Debe crear una tienda con datos válidos"""
        data = {
            "nombre": "Mi Tienda",
            "rubro": "almacen"
        }
        tienda = TiendaCreate(**data)
        assert tienda.nombre == "Mi Tienda"
        assert tienda.rubro == "almacen"
    
    def test_tienda_create_invalid_empty_name(self):
        """Debe fallar si el nombre está vacío"""
        with pytest.raises(ValidationError) as exc_info:
            TiendaCreate(nombre="", rubro="almacen")
        
        errors = exc_info.value.errors()
        assert any(e['loc'] == ('nombre',) for e in errors)
    
    def test_tienda_update_partial(self):
        """Debe permitir actualización parcial"""
        update = TiendaUpdate(nombre="Nuevo Nombre")
        assert update.nombre == "Nuevo Nombre"
        assert update.rubro is None
        assert update.is_active is None


class TestUserSchemas:
    """Tests para schemas de Usuario"""
    
    def test_user_create_valid(self):
        """Debe crear un usuario con datos válidos"""
        tienda_id = uuid4()
        data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "rol": "cajero",
            "password": "securepass123",
            "tienda_id": tienda_id
        }
        user = UserCreate(**data)
        assert user.email == "test@example.com"
        assert user.rol == "cajero"
        assert user.tienda_id == tienda_id
    
    def test_user_create_invalid_email(self):
        """Debe fallar con email inválido"""
        with pytest.raises(ValidationError):
            UserCreate(
                email="not-an-email",
                full_name="Test",
                rol="cajero",
                password="pass123",
                tienda_id=uuid4()
            )
    
    def test_user_create_invalid_rol(self):
        """Debe fallar con rol inválido"""
        with pytest.raises(ValidationError):
            UserCreate(
                email="test@example.com",
                full_name="Test",
                rol="superadmin",  # Rol no permitido
                password="pass123",
                tienda_id=uuid4()
            )
    
    def test_user_create_short_password(self):
        """Debe fallar con password corta"""
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(
                email="test@example.com",
                full_name="Test",
                rol="cajero",
                password="short",  # < 8 caracteres
                tienda_id=uuid4()
            )
        
        errors = exc_info.value.errors()
        assert any(e['loc'] == ('password',) for e in errors)


class TestVentaSchemas:
    """Tests para schemas de Ventas"""
    
    def test_item_venta_create_valid(self):
        """Debe crear un item de venta válido"""
        item = ItemVentaInput(
            producto_id=uuid4(),
            cantidad=2.5
        )
        assert item.cantidad == 2.5
    
    def test_item_venta_create_invalid_cantidad_negativa(self):
        """Debe fallar con cantidad negativa"""
        with pytest.raises(ValidationError):
            ItemVentaInput(
                producto_id=uuid4(),
                cantidad=-1.0
            )
    
    def test_item_venta_create_invalid_cantidad_cero(self):
        """Debe fallar con cantidad cero"""
        with pytest.raises(ValidationError):
            ItemVentaInput(
                producto_id=uuid4(),
                cantidad=0.0
            )
    
    def test_venta_create_valid(self):
        """Debe crear una venta válida"""
        venta = VentaCreate(
            items=[
                ItemVentaInput(producto_id=uuid4(), cantidad=2),
                ItemVentaInput(producto_id=uuid4(), cantidad=1.5)
            ],
            metodo_pago="efectivo"
        )
        assert len(venta.items) == 2
        assert venta.metodo_pago == "efectivo"
    
    def test_venta_create_invalid_metodo_pago(self):
        """Debe fallar con método de pago inválido"""
        with pytest.raises(ValidationError):
            VentaCreate(
                items=[ItemVentaInput(producto_id=uuid4(), cantidad=1)],
                metodo_pago="bitcoin"  # No permitido
            )
    
    def test_venta_create_empty_items(self):
        """Debe fallar si no hay items"""
        with pytest.raises(ValidationError):
            VentaCreate(
                items=[],
                metodo_pago="efectivo"
            )


class TestProductoScanRead:
    """Tests para el schema de escaneo rápido"""
    
    def test_producto_scan_read_tiene_stock_true(self):
        """Debe calcular tiene_stock=True cuando hay stock"""
        producto = ProductoScanRead(
            id=uuid4(),
            nombre="Producto Test",
            sku="TEST-001",
            precio_venta=100.0,
            stock_actual=50.0,
            tipo="general",
            tiene_stock=True
        )
        assert producto.tiene_stock is True
    
    def test_producto_scan_read_tiene_stock_false(self):
        """Debe calcular tiene_stock=False cuando no hay stock"""
        producto = ProductoScanRead(
            id=uuid4(),
            nombre="Producto Sin Stock",
            sku="TEST-002",
            precio_venta=100.0,
            stock_actual=0.0,
            tipo="general",
            tiene_stock=False
        )
        assert producto.tiene_stock is False


class TestLoginRequest:
    """Tests para el schema de login"""
    
    def test_login_request_valid(self):
        """Debe validar un request de login válido"""
        login = LoginRequest(
            email="user@example.com",
            password="mypassword123"
        )
        assert login.email == "user@example.com"
        assert login.password == "mypassword123"
    
    def test_login_request_invalid_email(self):
        """Debe fallar con email inválido"""
        with pytest.raises(ValidationError):
            LoginRequest(
                email="invalid-email",
                password="password123"
            )
