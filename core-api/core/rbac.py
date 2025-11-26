"""
Sistema de Permisos Granulares - Nexus POS Enterprise
RBAC (Role-Based Access Control) atómico

🎯 DIFERENCIAL COMPETITIVO:
- Clientes Pequeños: Roles predefinidos ("Dueño", "Vendedor", "Cajero")
- Clientes Grandes (Prune): Permisos personalizados por cargo
"""
from enum import Enum
from typing import List, Set
from pydantic import BaseModel


class Permission(str, Enum):
    """
    Permisos atómicos del sistema
    Naming convention: {RESOURCE}_{ACTION}
    """
    # ==================== PRODUCTOS ====================
    PRODUCTOS_VIEW = "productos:view"
    PRODUCTOS_CREATE = "productos:create"
    PRODUCTOS_UPDATE = "productos:update"
    PRODUCTOS_DELETE = "productos:delete"
    PRODUCTOS_VIEW_COST = "productos:view_cost"  # 💰 Sensible: Ver costo de compra
    PRODUCTOS_UPDATE_PRICE = "productos:update_price"  # 💰 Sensible: Cambiar precios
    
    # ==================== VENTAS ====================
    VENTAS_VIEW = "ventas:view"
    VENTAS_CREATE = "ventas:create"
    VENTAS_VOID = "ventas:void"  # 🚨 Crítico: Anular venta
    VENTAS_APPROVE_DISCOUNT = "ventas:approve_discount"  # 💰 Aprobar descuentos > 20%
    VENTAS_VIEW_ALL_STORES = "ventas:view_all_stores"  # 🏢 Multi-tienda
    VENTAS_EXPORT = "ventas:export"  # 📊 Exportar datos
    
    # ==================== CAJA ====================
    CAJA_OPEN = "caja:open"
    CAJA_CLOSE = "caja:close"
    CAJA_VIEW_BALANCE = "caja:view_balance"
    CAJA_ADD_CASH = "caja:add_cash"  # 💵 Agregar efectivo
    CAJA_REMOVE_CASH = "caja:remove_cash"  # 💸 Retirar efectivo
    CAJA_VIEW_HISTORY = "caja:view_history"
    
    # ==================== COMPRAS ====================
    COMPRAS_VIEW = "compras:view"
    COMPRAS_CREATE = "compras:create"
    COMPRAS_APPROVE = "compras:approve"  # ✅ Aprobar orden > $X
    COMPRAS_RECEIVE = "compras:receive"  # 📦 Recibir mercadería
    COMPRAS_CANCEL = "compras:cancel"
    
    # ==================== INVENTARIO ====================
    INVENTARIO_VIEW = "inventario:view"
    INVENTARIO_ADJUST = "inventario:adjust"  # 📝 Ajuste manual de stock
    INVENTARIO_TRANSFER = "inventario:transfer"  # 🚚 Transferencia entre tiendas
    INVENTARIO_VIEW_LEDGER = "inventario:view_ledger"  # 📚 Ver historial detallado
    
    # ==================== REPORTES ====================
    REPORTES_SALES = "reportes:sales"
    REPORTES_INVENTORY = "reportes:inventory"
    REPORTES_FINANCIAL = "reportes:financial"  # 💰 Reportes financieros
    REPORTES_AUDIT = "reportes:audit"  # 🔍 Logs de auditoría
    
    # ==================== USUARIOS ====================
    USERS_VIEW = "users:view"
    USERS_CREATE = "users:create"
    USERS_UPDATE = "users:update"
    USERS_DELETE = "users:delete"
    USERS_CHANGE_ROLE = "users:change_role"  # 🚨 Cambiar roles
    
    # ==================== CONFIGURACIÓN ====================
    CONFIG_VIEW = "config:view"
    CONFIG_UPDATE = "config:update"  # ⚙️ Cambiar configuración del sistema
    CONFIG_INTEGRATIONS = "config:integrations"  # 🔌 Configurar integraciones (AFIP, MP)
    
    # ==================== AFIP ====================
    AFIP_FACTURAR = "afip:facturar"
    AFIP_VIEW_CAE = "afip:view_cae"
    AFIP_CONTINGENCY = "afip:contingency"  # 🆘 Activar modo contingencia


class RoleDefinition(BaseModel):
    """Definición de un rol con sus permisos"""
    name: str
    display_name: str
    description: str
    permissions: Set[Permission]
    is_system: bool = True  # Roles del sistema no se pueden eliminar
    tier: str = "basic"  # basic, premium, enterprise


# =====================================================
# ROLES PREDEFINIDOS (Para clientes pequeños)
# =====================================================

ROLES: dict[str, RoleDefinition] = {
    # ==================== TIER: BASIC ====================
    "vendedor": RoleDefinition(
        name="vendedor",
        display_name="Vendedor",
        description="Puede hacer ventas y consultar stock",
        tier="basic",
        permissions={
            Permission.PRODUCTOS_VIEW,
            Permission.VENTAS_VIEW,
            Permission.VENTAS_CREATE,
            Permission.INVENTARIO_VIEW,
            Permission.CAJA_VIEW_BALANCE,
        }
    ),
    
    "cajero": RoleDefinition(
        name="cajero",
        display_name="Cajero",
        description="Vendedor + manejo de caja",
        tier="basic",
        permissions={
            Permission.PRODUCTOS_VIEW,
            Permission.VENTAS_VIEW,
            Permission.VENTAS_CREATE,
            Permission.INVENTARIO_VIEW,
            Permission.CAJA_OPEN,
            Permission.CAJA_CLOSE,
            Permission.CAJA_VIEW_BALANCE,
            Permission.CAJA_ADD_CASH,
            Permission.CAJA_VIEW_HISTORY,
        }
    ),
    
    "encargado": RoleDefinition(
        name="encargado",
        display_name="Encargado de Local",
        description="Cajero + gestión de productos y reportes básicos",
        tier="basic",
        permissions={
            Permission.PRODUCTOS_VIEW,
            Permission.PRODUCTOS_CREATE,
            Permission.PRODUCTOS_UPDATE,
            Permission.VENTAS_VIEW,
            Permission.VENTAS_CREATE,
            Permission.VENTAS_EXPORT,
            Permission.INVENTARIO_VIEW,
            Permission.INVENTARIO_ADJUST,
            Permission.CAJA_OPEN,
            Permission.CAJA_CLOSE,
            Permission.CAJA_VIEW_BALANCE,
            Permission.CAJA_ADD_CASH,
            Permission.CAJA_REMOVE_CASH,
            Permission.CAJA_VIEW_HISTORY,
            Permission.REPORTES_SALES,
            Permission.REPORTES_INVENTORY,
        }
    ),
    
    "dueño": RoleDefinition(
        name="dueño",
        display_name="Dueño",
        description="Acceso total al sistema (para negocios pequeños)",
        tier="basic",
        permissions=set(Permission)  # TODOS los permisos
    ),
    
    # ==================== TIER: PREMIUM ====================
    "supervisor": RoleDefinition(
        name="supervisor",
        display_name="Supervisor",
        description="Encargado + aprobaciones y anulaciones",
        tier="premium",
        permissions={
            Permission.PRODUCTOS_VIEW,
            Permission.PRODUCTOS_CREATE,
            Permission.PRODUCTOS_UPDATE,
            Permission.PRODUCTOS_VIEW_COST,
            Permission.VENTAS_VIEW,
            Permission.VENTAS_CREATE,
            Permission.VENTAS_VOID,  # 🔑 Puede anular ventas
            Permission.VENTAS_APPROVE_DISCOUNT,  # 🔑 Aprobar descuentos
            Permission.VENTAS_EXPORT,
            Permission.INVENTARIO_VIEW,
            Permission.INVENTARIO_ADJUST,
            Permission.INVENTARIO_VIEW_LEDGER,
            Permission.CAJA_OPEN,
            Permission.CAJA_CLOSE,
            Permission.CAJA_VIEW_BALANCE,
            Permission.CAJA_ADD_CASH,
            Permission.CAJA_REMOVE_CASH,
            Permission.CAJA_VIEW_HISTORY,
            Permission.COMPRAS_VIEW,
            Permission.COMPRAS_CREATE,
            Permission.COMPRAS_RECEIVE,
            Permission.REPORTES_SALES,
            Permission.REPORTES_INVENTORY,
            Permission.REPORTES_FINANCIAL,
        }
    ),
    
    # ==================== TIER: ENTERPRISE (Prune) ====================
    "gerente_regional": RoleDefinition(
        name="gerente_regional",
        display_name="Gerente Regional",
        description="Supervisor + multi-tienda y auditoría",
        tier="enterprise",
        permissions={
            Permission.PRODUCTOS_VIEW,
            Permission.PRODUCTOS_CREATE,
            Permission.PRODUCTOS_UPDATE,
            Permission.PRODUCTOS_DELETE,
            Permission.PRODUCTOS_VIEW_COST,
            Permission.PRODUCTOS_UPDATE_PRICE,
            Permission.VENTAS_VIEW,
            Permission.VENTAS_VIEW_ALL_STORES,  # 🔑 Multi-tienda
            Permission.VENTAS_VOID,
            Permission.VENTAS_APPROVE_DISCOUNT,
            Permission.VENTAS_EXPORT,
            Permission.INVENTARIO_VIEW,
            Permission.INVENTARIO_ADJUST,
            Permission.INVENTARIO_TRANSFER,  # 🔑 Transferencias
            Permission.INVENTARIO_VIEW_LEDGER,
            Permission.COMPRAS_VIEW,
            Permission.COMPRAS_CREATE,
            Permission.COMPRAS_APPROVE,  # 🔑 Aprobar compras
            Permission.COMPRAS_RECEIVE,
            Permission.REPORTES_SALES,
            Permission.REPORTES_INVENTORY,
            Permission.REPORTES_FINANCIAL,
            Permission.REPORTES_AUDIT,  # 🔑 Auditoría
            Permission.USERS_VIEW,
        }
    ),
    
    "admin": RoleDefinition(
        name="admin",
        display_name="Administrador del Sistema",
        description="Acceso total + gestión de usuarios y configuración",
        tier="enterprise",
        permissions=set(Permission)  # TODOS los permisos
    ),
}


# =====================================================
# HELPERS
# =====================================================

def get_role_permissions(role_name: str) -> Set[Permission]:
    """Obtiene los permisos de un rol"""
    role = ROLES.get(role_name)
    if not role:
        return set()
    return role.permissions


def has_permission(user_permissions: Set[Permission], required: Permission) -> bool:
    """Verifica si un conjunto de permisos incluye el requerido"""
    return required in user_permissions


def check_permissions(user_permissions: Set[Permission], required: List[Permission]) -> bool:
    """Verifica si un conjunto de permisos incluye TODOS los requeridos"""
    return all(perm in user_permissions for perm in required)


def get_missing_permissions(
    user_permissions: Set[Permission],
    required: List[Permission]
) -> List[Permission]:
    """Retorna los permisos que faltan"""
    return [perm for perm in required if perm not in user_permissions]


def merge_permissions(*permission_sets: Set[Permission]) -> Set[Permission]:
    """Combina múltiples conjuntos de permisos"""
    result = set()
    for perm_set in permission_sets:
        result.update(perm_set)
    return result


# =====================================================
# MATRIZ DE PERMISOS (Para debugging)
# =====================================================

def print_permission_matrix():
    """
    Imprime una tabla de permisos por rol
    Útil para debugging y documentación
    """
    import pandas as pd
    
    # Crear matriz
    all_permissions = list(Permission)
    matrix = []
    
    for role_name, role_def in ROLES.items():
        row = {
            "Rol": role_def.display_name,
            "Tier": role_def.tier
        }
        for perm in all_permissions:
            row[perm.value] = "✅" if perm in role_def.permissions else "❌"
        matrix.append(row)
    
    df = pd.DataFrame(matrix)
    print(df.to_string(index=False))


# =====================================================
# VALIDACIÓN DE PERMISOS CUSTOM
# =====================================================

class PermissionChecker:
    """
    Helper class para validar permisos con lógica de negocio
    """
    
    @staticmethod
    def can_approve_discount(user_permissions: Set[Permission], discount_percent: float) -> bool:
        """
        Lógica de negocio: Descuentos > 20% requieren aprobación
        """
        if discount_percent <= 20:
            return True  # Cualquiera puede dar hasta 20%
        
        return Permission.VENTAS_APPROVE_DISCOUNT in user_permissions
    
    @staticmethod
    def can_approve_purchase(user_permissions: Set[Permission], amount: float) -> bool:
        """
        Lógica de negocio: Compras > $100k requieren aprobación de gerente
        """
        if amount <= 100000:
            return Permission.COMPRAS_CREATE in user_permissions
        
        return Permission.COMPRAS_APPROVE in user_permissions
    
    @staticmethod
    def can_void_sale(user_permissions: Set[Permission], hours_since_sale: int) -> bool:
        """
        Lógica de negocio: Solo se pueden anular ventas < 24hs
        """
        if hours_since_sale > 24:
            return False
        
        return Permission.VENTAS_VOID in user_permissions
