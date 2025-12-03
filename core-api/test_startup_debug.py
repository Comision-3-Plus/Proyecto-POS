"""
Script de diagnóstico para identificar por qué el servidor se cierra
"""
import asyncio
import logging
from core.config import settings
from core.db import engine, AsyncSessionLocal
from sqlmodel import select, text

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def test_db_connection():
    """Probar la conexión a la base de datos"""
    try:
        logger.info("🔍 Probando conexión a la base de datos...")
        logger.info(f"DATABASE_URL: {settings.get_database_url()}")
        
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            logger.info(f"✅ Conexión exitosa: {result.scalar()}")
            
            # Probar una query más compleja
            result = await session.execute(text("SELECT current_database(), current_user"))
            db, user = result.fetchone()
            logger.info(f"✅ Base de datos: {db}, Usuario: {user}")
            
    except Exception as e:
        logger.error(f"❌ Error de conexión: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

async def test_engine():
    """Probar el motor de SQLAlchemy"""
    try:
        logger.info("🔍 Probando engine...")
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            logger.info(f"✅ PostgreSQL version: {version}")
    except Exception as e:
        logger.error(f"❌ Error en engine: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

async def main():
    logger.info("=" * 60)
    logger.info("DIAGNÓSTICO DE STARTUP")
    logger.info("=" * 60)
    
    await test_db_connection()
    await test_engine()
    
    logger.info("=" * 60)
    logger.info("✅ Diagnóstico completado")
    logger.info("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
