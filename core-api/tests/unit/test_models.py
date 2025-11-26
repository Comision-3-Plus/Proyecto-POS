"""
Unit Tests - Modelos de Base de Datos
Coverage target: 100%
"""
import pytest
from datetime import datetime
from uuid import uuid4
from models import Tienda, User, Producto, Venta, VentaItem
from models_audit import AuditLog, PermissionAudit


class TestTiendaModel:
    """Tests para el modelo Tienda"""
    
    def test_create_tienda_minimal(self):
        """Crear tienda con campos mínimos requeridos"""
        tienda = Tienda(nombre="Boutique Test")
        
        assert tienda.nombre == "Boutique Test"
        assert tienda.rubro == "general"  # Default
        assert tienda.is_active is True
        assert tienda.id is not None
    
    def test_create_tienda_full(self):
        """Crear tienda con todos los campos"""
        tienda_id = uuid4()
        now = datetime.utcnow()
        
        tienda = Tienda(
            id=tienda_id,
            nombre="Prune Store",
            rubro="ropa",
            is_active=True,
            created_at=now
        )
        
        assert tienda.id == tienda_id
        assert tienda.nombre == "Prune Store"
        assert tienda.rubro == "ropa"
        assert tienda.is_active is True
        assert tienda.created_at == now
    
    def test_tienda_relationships(self):
        """Verificar que las relaciones están definidas"""
        tienda = Tienda(nombre="Test")
        
        # Verificar que los atributos de relación existen
        assert hasattr(tienda, 'users')
        assert hasattr(tienda, 'productos')
        assert hasattr(tienda, 'ventas')
        assert hasattr(tienda, 'insights')


class TestUserModel:
    """Tests para el modelo User"""
    
    def test_create_user(self):
        """Crear usuario con campos requeridos"""
        tienda_id = uuid4()
        user = User(
            email="vendedor@test.com",
            hashed_password="hashed_password_here",
            tienda_id=tienda_id,
            role="vendedor"
        )
        
        assert user.email == "vendedor@test.com"
        assert user.tienda_id == tienda_id
        assert user.role == "vendedor"
        assert user.is_active is True
    
    def test_user_default_values(self):
        """Verificar valores por defecto"""
        user = User(
            email="test@test.com",
            hashed_password="hash",
            tienda_id=uuid4()
        )
        
        assert user.is_active is True
        assert user.role == "vendedor"  # Default role


class TestProductoModel:
    """Tests para el modelo Producto"""
    
    def test_create_producto_minimal(self):
        """Crear producto con campos mínimos"""
        tienda_id = uuid4()
        producto = Producto(
            nombre="Campera",
            precio=15000.0,
            stock=10,
            tienda_id=tienda_id
        )
        
        assert producto.nombre == "Campera"
        assert producto.precio == 15000.0
        assert producto.stock == 10
        assert producto.tienda_id == tienda_id
    
    def test_create_producto_with_attributes(self):
        """Crear producto con atributos JSONB"""
        producto = Producto(
            nombre="Remera",
            precio=5000.0,
            stock=20,
            tienda_id=uuid4(),
            atributos={
                "talle": "M",
                "color": "Azul",
                "marca": "Adidas"
            }
        )
        
        assert producto.atributos["talle"] == "M"
        assert producto.atributos["color"] == "Azul"
        assert producto.atributos["marca"] == "Adidas"
    
    def test_producto_with_unidad_medida(self):
        """Producto con unidad de medida"""
        producto = Producto(
            nombre="Carne Picada",
            precio=3500.0,
            stock=50,
            unidad_medida="kg",
            tienda_id=uuid4()
        )
        
        assert producto.unidad_medida == "kg"


class TestVentaModel:
    """Tests para el modelo Venta"""
    
    def test_create_venta(self):
        """Crear venta con campos requeridos"""
        tienda_id = uuid4()
        user_id = uuid4()
        
        venta = Venta(
            total=25000.0,
            tienda_id=tienda_id,
            user_id=user_id,
            metodo_pago="efectivo"
        )
        
        assert venta.total == 25000.0
        assert venta.tienda_id == tienda_id
        assert venta.user_id == user_id
        assert venta.metodo_pago == "efectivo"
    
    def test_venta_with_discount(self):
        """Venta con descuento aplicado"""
        venta = Venta(
            total=10000.0,
            descuento=2000.0,
            tienda_id=uuid4(),
            user_id=uuid4(),
            metodo_pago="tarjeta"
        )
        
        assert venta.total == 10000.0
        assert venta.descuento == 2000.0
        assert venta.metodo_pago == "tarjeta"


class TestAuditLogModel:
    """Tests para el modelo AuditLog"""
    
    def test_create_audit_log(self):
        """Crear registro de auditoría"""
        user_id = uuid4()
        tienda_id = uuid4()
        
        audit = AuditLog(
            user_id=user_id,
            tienda_id=tienda_id,
            action="CREATE",
            resource_type="productos",
            resource_id=uuid4(),
            ip_address="192.168.1.100",
            user_agent="Mozilla/5.0"
        )
        
        assert audit.user_id == user_id
        assert audit.action == "CREATE"
        assert audit.resource_type == "productos"
        assert audit.ip_address == "192.168.1.100"
    
    def test_audit_log_with_payload(self):
        """Audit log con datos de antes/después"""
        audit = AuditLog(
            user_id=uuid4(),
            tienda_id=uuid4(),
            action="UPDATE",
            resource_type="productos",
            resource_id=uuid4(),
            ip_address="10.0.0.1",
            user_agent="curl",
            payload_before={"precio": 1000},
            payload_after={"precio": 1500}
        )
        
        assert audit.payload_before == {"precio": 1000}
        assert audit.payload_after == {"precio": 1500}
    
    def test_audit_log_sensitive_flag(self):
        """Marcar operación como sensible"""
        audit = AuditLog(
            user_id=uuid4(),
            tienda_id=uuid4(),
            action="DELETE",
            resource_type="ventas",
            resource_id=uuid4(),
            ip_address="127.0.0.1",
            user_agent="test",
            is_sensitive=True
        )
        
        assert audit.is_sensitive is True


class TestPermissionAuditModel:
    """Tests para el modelo PermissionAudit"""
    
    def test_create_permission_audit(self):
        """Crear registro de cambio de permisos"""
        admin_id = uuid4()
        target_user_id = uuid4()
        tienda_id = uuid4()
        
        perm_audit = PermissionAudit(
            admin_user_id=admin_id,
            target_user_id=target_user_id,
            tienda_id=tienda_id,
            action="GRANT",
            permission="ventas:approve_discount",
            reason="Cliente grande requiere aprobación de descuentos"
        )
        
        assert perm_audit.admin_user_id == admin_id
        assert perm_audit.target_user_id == target_user_id
        assert perm_audit.action == "GRANT"
        assert perm_audit.permission == "ventas:approve_discount"
        assert "Cliente grande" in perm_audit.reason
    
    def test_permission_audit_revoke(self):
        """Revocar permiso"""
        perm_audit = PermissionAudit(
            admin_user_id=uuid4(),
            target_user_id=uuid4(),
            tienda_id=uuid4(),
            action="REVOKE",
            permission="productos:delete",
            reason="Usuario cambió de rol"
        )
        
        assert perm_audit.action == "REVOKE"
