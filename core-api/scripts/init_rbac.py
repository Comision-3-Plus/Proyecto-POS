"""
Script de inicialización de permisos RBAC
Ejecutar una sola vez para poblar la base de datos
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from core.config import settings
from services.permission_service import PermissionService


async def init_rbac():
    """Inicializa permisos y roles del sistema"""
    # Crear engine y session
    engine = create_async_engine(settings.get_database_url())
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        print("🔐 Inicializando sistema RBAC...")
        
        # 1. Crear permisos
        print("\n📝 Creando permisos del sistema...")
        await PermissionService.initialize_system_permissions(session)
        print("✅ Permisos creados")
        
        # 2. Crear roles predefinidos
        print("\n👥 Creando roles del sistema...")
        await PermissionService.initialize_system_roles(session)
        print("✅ Roles creados")
        
        print("\n🎉 Sistema RBAC inicializado correctamente!")
        print("\nRoles disponibles:")
        print("- Super Administrador: Acceso total")
        print("- Administrador de Tienda: Gestión completa de tienda")
        print("- Vendedor: Operación de ventas y POS")
        print("- Cajero: Solo operación de caja")
        print("- Repositor: Gestión de stock")


if __name__ == "__main__":
    asyncio.run(init_rbac())
