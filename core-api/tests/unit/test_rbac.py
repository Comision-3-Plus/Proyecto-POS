"""
Unit Tests - Sistema RBAC
Coverage target: 100%
"""
import pytest
from uuid import uuid4
from core.rbac import (
    Permission,
    RoleDefinition,
    ROLES,
    get_role_permissions,
    check_permissions,
    PermissionChecker
)


class TestPermissionEnum:
    """Tests para el enum de permisos"""
    
    def test_permission_values(self):
        """Verificar que los permisos tienen valores correctos"""
        assert Permission.PRODUCTOS_CREATE.value == "productos:create"
        assert Permission.VENTAS_APPROVE_DISCOUNT.value == "ventas:approve_discount"
        assert Permission.REPORTES_AUDIT.value == "reportes:audit"
    
    def test_all_permissions_exist(self):
        """Verificar que todos los permisos críticos existen"""
        critical_permissions = [
            "productos:create",
            "productos:view",
            "productos:edit",
            "productos:delete",
            "ventas:create",
            "ventas:void",
            "caja:open",
            "caja:close",
            "reportes:audit"
        ]
        
        permission_values = [p.value for p in Permission]
        for perm in critical_permissions:
            assert perm in permission_values


class TestRoleDefinitions:
    """Tests para las definiciones de roles"""
    
    def test_vendedor_role(self):
        """Vendedor tiene permisos básicos"""
        vendedor = ROLES["vendedor"]
        
        assert vendedor.tier == "basic"
        assert Permission.PRODUCTOS_VIEW in vendedor.permissions
        assert Permission.VENTAS_CREATE in vendedor.permissions
        # No puede aprobar descuentos
        assert Permission.VENTAS_APPROVE_DISCOUNT not in vendedor.permissions
    
    def test_cajero_role(self):
        """Cajero tiene permisos de vendedor + caja"""
        cajero = ROLES["cajero"]
        
        assert cajero.tier == "basic"
        assert Permission.VENTAS_CREATE in cajero.permissions
        assert Permission.CAJA_OPEN in cajero.permissions
        assert Permission.CAJA_CLOSE in cajero.permissions
    
    def test_encargado_role(self):
        """Encargado puede gestionar productos"""
        encargado = ROLES["encargado"]
        
        assert encargado.tier == "basic"
        assert Permission.PRODUCTOS_CREATE in encargado.permissions
        assert Permission.PRODUCTOS_EDIT in encargado.permissions
        assert Permission.PRODUCTOS_DELETE in encargado.permissions
    
    def test_dueno_role(self):
        """Dueño tiene acceso total"""
        dueno = ROLES["dueño"]
        
        assert dueno.tier == "basic"
        assert Permission.VENTAS_APPROVE_DISCOUNT in dueno.permissions
        assert Permission.REPORTES_FINANCIERO in dueno.permissions
        assert Permission.COMPRAS_APPROVE in dueno.permissions
    
    def test_supervisor_role(self):
        """Supervisor puede anular ventas"""
        supervisor = ROLES["supervisor"]
        
        assert supervisor.tier == "premium"
        assert Permission.VENTAS_VOID in supervisor.permissions
        assert Permission.VENTAS_APPROVE_DISCOUNT in supervisor.permissions
    
    def test_gerente_regional_role(self):
        """Gerente regional tiene permisos enterprise"""
        gerente = ROLES["gerente_regional"]
        
        assert gerente.tier == "enterprise"
        assert Permission.INVENTARIO_TRANSFER in gerente.permissions
        assert Permission.REPORTES_AUDIT in gerente.permissions
        assert Permission.USUARIOS_MANAGE in gerente.permissions
    
    def test_admin_role(self):
        """Admin tiene todos los permisos"""
        admin = ROLES["admin"]
        
        assert admin.tier == "enterprise"
        assert Permission.ADMIN_FULL_ACCESS in admin.permissions


class TestGetRolePermissions:
    """Tests para la función get_role_permissions"""
    
    def test_get_vendedor_permissions(self):
        """Obtener permisos de vendedor"""
        perms = get_role_permissions("vendedor")
        
        assert Permission.PRODUCTOS_VIEW in perms
        assert Permission.VENTAS_CREATE in perms
        assert len(perms) > 0
    
    def test_get_invalid_role(self):
        """Rol inválido retorna set vacío"""
        perms = get_role_permissions("rol_inexistente")
        
        assert perms == set()
    
    def test_get_admin_permissions(self):
        """Admin tiene muchos permisos"""
        perms = get_role_permissions("admin")
        
        assert len(perms) > 20  # Admin tiene 20+ permisos


class TestCheckPermissions:
    """Tests para la función check_permissions"""
    
    def test_check_single_permission_granted(self):
        """Usuario tiene el permiso requerido"""
        user_perms = {Permission.PRODUCTOS_VIEW, Permission.VENTAS_CREATE}
        required = {Permission.PRODUCTOS_VIEW}
        
        assert check_permissions(user_perms, required) is True
    
    def test_check_single_permission_denied(self):
        """Usuario NO tiene el permiso requerido"""
        user_perms = {Permission.PRODUCTOS_VIEW}
        required = {Permission.PRODUCTOS_DELETE}
        
        assert check_permissions(user_perms, required) is False
    
    def test_check_multiple_permissions_all_granted(self):
        """Usuario tiene todos los permisos requeridos"""
        user_perms = {
            Permission.PRODUCTOS_VIEW,
            Permission.PRODUCTOS_EDIT,
            Permission.PRODUCTOS_DELETE
        }
        required = {Permission.PRODUCTOS_VIEW, Permission.PRODUCTOS_EDIT}
        
        assert check_permissions(user_perms, required) is True
    
    def test_check_multiple_permissions_partial(self):
        """Usuario solo tiene algunos permisos (debe fallar)"""
        user_perms = {Permission.PRODUCTOS_VIEW}
        required = {Permission.PRODUCTOS_VIEW, Permission.PRODUCTOS_DELETE}
        
        assert check_permissions(user_perms, required) is False
    
    def test_check_empty_required(self):
        """Sin permisos requeridos siempre retorna True"""
        user_perms = {Permission.PRODUCTOS_VIEW}
        required = set()
        
        assert check_permissions(user_perms, required) is True


class TestPermissionChecker:
    """Tests para la clase PermissionChecker"""
    
    def test_can_approve_discount_small(self):
        """Descuento pequeño (< 20%) no requiere aprobación"""
        perms = get_role_permissions("vendedor")
        
        # Vendedor NO tiene VENTAS_APPROVE_DISCOUNT
        assert Permission.VENTAS_APPROVE_DISCOUNT not in perms
        
        # Pero puede hacer descuentos < 20%
        assert PermissionChecker.can_approve_discount(perms, 15) is True
    
    def test_can_approve_discount_large(self):
        """Descuento grande (> 20%) requiere aprobación"""
        vendedor_perms = get_role_permissions("vendedor")
        dueno_perms = get_role_permissions("dueño")
        
        # Vendedor NO puede aprobar > 20%
        assert PermissionChecker.can_approve_discount(vendedor_perms, 25) is False
        
        # Dueño SÍ puede
        assert PermissionChecker.can_approve_discount(dueno_perms, 25) is True
    
    def test_can_approve_discount_exact_20(self):
        """Descuento exacto de 20% no requiere aprobación"""
        perms = get_role_permissions("vendedor")
        
        assert PermissionChecker.can_approve_discount(perms, 20) is True
    
    def test_can_approve_purchase_small(self):
        """Compra pequeña (< 100k) no requiere aprobación"""
        perms = get_role_permissions("encargado")
        
        assert PermissionChecker.can_approve_purchase(perms, 50000) is True
    
    def test_can_approve_purchase_large(self):
        """Compra grande (> 100k) requiere aprobación"""
        encargado_perms = get_role_permissions("encargado")
        dueno_perms = get_role_permissions("dueño")
        
        # Encargado NO puede aprobar > 100k
        assert PermissionChecker.can_approve_purchase(encargado_perms, 150000) is False
        
        # Dueño SÍ puede
        assert PermissionChecker.can_approve_purchase(dueno_perms, 150000) is True
    
    def test_can_void_sale_recent(self):
        """Venta reciente (< 24hs) puede anularse con permiso"""
        supervisor_perms = get_role_permissions("supervisor")
        vendedor_perms = get_role_permissions("vendedor")
        
        # Supervisor SÍ puede anular
        assert PermissionChecker.can_void_sale(supervisor_perms, hours_ago=12) is True
        
        # Vendedor NO puede
        assert PermissionChecker.can_void_sale(vendedor_perms, hours_ago=12) is False
    
    def test_can_void_sale_old(self):
        """Venta antigua (> 24hs) no puede anularse"""
        supervisor_perms = get_role_permissions("supervisor")
        
        # Ni siquiera supervisor puede anular > 24hs
        assert PermissionChecker.can_void_sale(supervisor_perms, hours_ago=48) is False
    
    def test_can_transfer_inventory(self):
        """Solo gerente regional puede transferir inventario"""
        vendedor_perms = get_role_permissions("vendedor")
        gerente_perms = get_role_permissions("gerente_regional")
        
        assert PermissionChecker.can_transfer_inventory(vendedor_perms) is False
        assert PermissionChecker.can_transfer_inventory(gerente_perms) is True


class TestRoleHierarchy:
    """Tests para verificar jerarquía de roles"""
    
    def test_tier_progression(self):
        """Tiers progresan correctamente"""
        assert ROLES["vendedor"].tier == "basic"
        assert ROLES["supervisor"].tier == "premium"
        assert ROLES["gerente_regional"].tier == "enterprise"
    
    def test_permission_inheritance_concept(self):
        """Roles superiores tienen más permisos que inferiores"""
        vendedor_count = len(ROLES["vendedor"].permissions)
        cajero_count = len(ROLES["cajero"].permissions)
        encargado_count = len(ROLES["encargado"].permissions)
        dueno_count = len(ROLES["dueño"].permissions)
        
        # Cajero >= Vendedor
        assert cajero_count >= vendedor_count
        
        # Encargado >= Cajero
        assert encargado_count >= cajero_count
        
        # Dueño tiene los más
        assert dueno_count >= encargado_count
