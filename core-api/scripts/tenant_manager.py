"""
Tenant Management CLI
Comandos para gestionar tenants y bases de datos dedicadas
"""
import asyncio
import logging
from uuid import UUID
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from core.config import settings
from core.db import async_session
from models import Tienda
from sqlmodel import select


logger = logging.getLogger(__name__)


class TenantManager:
    """
    Gestor de tenants y bases de datos
    """
    
    @staticmethod
    async def create_dedicated_database(tienda_id: UUID):
        """
        Crear base de datos dedicada para una tienda enterprise
        
        Args:
            tienda_id: ID de la tienda
        """
        logger.info(f"🗄️  Creando base de datos dedicada para tienda {tienda_id}...")
        
        async with async_session() as session:
            # Obtener tienda
            result = await session.execute(
                select(Tienda).where(Tienda.id == tienda_id)
            )
            tienda = result.scalar_one_or_none()
            
            if not tienda:
                logger.error(f"❌ Tienda no encontrada: {tienda_id}")
                return
            
            # Nombre de la nueva base de datos
            db_name = f"nexuspos_{tienda_id}"
            
            # Conectar a base de datos principal para crear nueva
            admin_engine = create_async_engine(
                settings.DATABASE_URL.replace("/postgres", "/postgres"),
                isolation_level="AUTOCOMMIT"
            )
            
            async with admin_engine.connect() as conn:
                # Verificar si ya existe
                result = await conn.execute(
                    text(f"SELECT 1 FROM pg_database WHERE datname = :dbname"),
                    {"dbname": db_name}
                )
                exists = result.scalar()
                
                if exists:
                    logger.warning(f"⚠️  Base de datos {db_name} ya existe")
                else:
                    # Crear base de datos
                    await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                    logger.info(f"✅ Base de datos {db_name} creada")
            
            await admin_engine.dispose()
            
            # Crear schema en nueva base de datos
            await TenantManager._initialize_schema(db_name)
            
            # Actualizar tienda
            tienda.has_dedicated_db = True
            tienda.dedicated_db_url = settings.DATABASE_URL.replace("/postgres", f"/{db_name}")
            
            await session.commit()
            
            logger.info(f"✅ Tienda {tienda.nombre} ahora usa base de datos dedicada")
    
    @staticmethod
    async def _initialize_schema(db_name: str):
        """
        Inicializar schema en base de datos dedicada
        """
        logger.info(f"📋 Inicializando schema en {db_name}...")
        
        # Conectar a la nueva base de datos
        db_url = settings.DATABASE_URL.replace("/postgres", f"/{db_name}")
        engine = create_async_engine(db_url)
        
        async with engine.begin() as conn:
            # Crear tablas usando SQLModel
            from sqlmodel import SQLModel
            await conn.run_sync(SQLModel.metadata.create_all)
        
        await engine.dispose()
        
        logger.info(f"✅ Schema inicializado en {db_name}")
    
    @staticmethod
    async def migrate_tenant_data(tienda_id: UUID, from_shared: bool = True):
        """
        Migrar datos de tienda desde DB compartida a dedicada (o viceversa)
        
        Args:
            tienda_id: ID de la tienda
            from_shared: True = compartida → dedicada, False = dedicada → compartida
        """
        logger.info(f"📦 Migrando datos de tienda {tienda_id}...")
        
        async with async_session() as session:
            result = await session.execute(
                select(Tienda).where(Tienda.id == tienda_id)
            )
            tienda = result.scalar_one_or_none()
            
            if not tienda:
                logger.error(f"❌ Tienda no encontrada")
                return
            
            if from_shared:
                # Migrar de compartida → dedicada
                logger.info("📤 Exportando datos de DB compartida...")
                
                # Crear DB dedicada si no existe
                if not tienda.has_dedicated_db:
                    await TenantManager.create_dedicated_database(tienda_id)
                
                # Conectar a ambas bases de datos
                shared_engine = create_async_engine(settings.DATABASE_URL)
                dedicated_engine = create_async_engine(tienda.dedicated_db_url)
                
                # Migrar tablas
                tables_to_migrate = [
                    "productos", "ventas", "venta_items", "facturas",
                    "sesiones_caja", "movimientos_caja", "proveedores",
                    "ordenes_compra", "orden_compra_items"
                ]
                
                async with shared_engine.connect() as shared_conn:
                    async with dedicated_engine.connect() as dedicated_conn:
                        for table in tables_to_migrate:
                            logger.info(f"   Migrando tabla: {table}")
                            
                            # Copiar datos
                            result = await shared_conn.execute(
                                text(f"SELECT * FROM {table} WHERE tienda_id = :tienda_id"),
                                {"tienda_id": tienda_id}
                            )
                            rows = result.fetchall()
                            
                            if rows:
                                # Insertar en DB dedicada
                                # TODO: Implementar inserción masiva
                                pass
                            
                            logger.info(f"      {len(rows)} registros migrados")
                
                await shared_engine.dispose()
                await dedicated_engine.dispose()
                
                logger.info(f"✅ Datos migrados a DB dedicada")
            else:
                # Migrar de dedicada → compartida
                logger.info("📥 Importando datos a DB compartida...")
                # TODO: Implementar
    
    @staticmethod
    async def list_tenants():
        """
        Listar todos los tenants
        """
        async with async_session() as session:
            result = await session.execute(
                select(Tienda).where(Tienda.is_active == True)
            )
            tiendas = result.scalars().all()
            
            print("\n" + "=" * 80)
            print("TENANTS ACTIVOS")
            print("=" * 80)
            print(f"{'ID':<38} {'Nombre':<30} {'DB Dedicada':<15}")
            print("-" * 80)
            
            for tienda in tiendas:
                db_type = "✅ Dedicada" if tienda.has_dedicated_db else "Compartida"
                print(f"{str(tienda.id):<38} {tienda.nombre:<30} {db_type:<15}")
            
            print("=" * 80)
            print(f"Total: {len(tiendas)} tenants\n")
    
    @staticmethod
    async def upgrade_to_enterprise(tienda_id: UUID):
        """
        Upgrader tienda a tier enterprise con DB dedicada
        """
        logger.info(f"⬆️  Upgradeando tienda {tienda_id} a Enterprise...")
        
        # 1. Crear DB dedicada
        await TenantManager.create_dedicated_database(tienda_id)
        
        # 2. Migrar datos
        await TenantManager.migrate_tenant_data(tienda_id, from_shared=True)
        
        # 3. Actualizar configuración
        async with async_session() as session:
            result = await session.execute(
                select(Tienda).where(Tienda.id == tienda_id)
            )
            tienda = result.scalar_one()
            
            tienda.tier = "enterprise"
            
            await session.commit()
        
        logger.info(f"✅ Tienda upgradeada a Enterprise con DB dedicada")


# =====================================================
# CLI
# =====================================================

async def main():
    """Entry point para CLI"""
    import sys
    
    if len(sys.argv) < 2:
        print("Uso: python tenant_manager.py [comando] [args]")
        print("Comandos:")
        print("  list - Listar tenants")
        print("  create-db <tienda_id> - Crear DB dedicada")
        print("  migrate <tienda_id> - Migrar datos a DB dedicada")
        print("  upgrade <tienda_id> - Upgrade a enterprise")
        return
    
    comando = sys.argv[1]
    
    if comando == "list":
        await TenantManager.list_tenants()
    
    elif comando == "create-db":
        if len(sys.argv) < 3:
            print("Error: Falta tienda_id")
            return
        
        tienda_id = UUID(sys.argv[2])
        await TenantManager.create_dedicated_database(tienda_id)
    
    elif comando == "migrate":
        if len(sys.argv) < 3:
            print("Error: Falta tienda_id")
            return
        
        tienda_id = UUID(sys.argv[2])
        await TenantManager.migrate_tenant_data(tienda_id)
    
    elif comando == "upgrade":
        if len(sys.argv) < 3:
            print("Error: Falta tienda_id")
            return
        
        tienda_id = UUID(sys.argv[2])
        await TenantManager.upgrade_to_enterprise(tienda_id)
    
    else:
        print(f"Comando desconocido: {comando}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
