"""
Scheduler para tareas programadas de AFIP
Ejecuta solicitud automática de CAEAs e informes
"""
import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import async_session
from services.caea_service import CAEAService
from models import Tienda
from sqlmodel import select


logger = logging.getLogger(__name__)


class AFIPScheduler:
    """
    Scheduler para tareas AFIP automáticas
    """
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
    
    def start(self):
        """Iniciar scheduler"""
        logger.info("🕐 Iniciando AFIP Scheduler...")
        
        # Tarea 1: Solicitar CAEAs el día 1 de cada mes (primera quincena)
        self.scheduler.add_job(
            self._solicitar_caeas_periodo_1,
            trigger=CronTrigger(day=1, hour=2, minute=0),  # Día 1 a las 2 AM
            id="solicitar_caeas_periodo_1",
            name="Solicitar CAEAs Periodo 1",
            replace_existing=True
        )
        
        # Tarea 2: Solicitar CAEAs el día 16 de cada mes (segunda quincena)
        self.scheduler.add_job(
            self._solicitar_caeas_periodo_2,
            trigger=CronTrigger(day=16, hour=2, minute=0),  # Día 16 a las 2 AM
            id="solicitar_caeas_periodo_2",
            name="Solicitar CAEAs Periodo 2",
            replace_existing=True
        )
        
        # Tarea 3: Informar CAEAs no utilizados del periodo 1
        self.scheduler.add_job(
            self._informar_caeas_periodo_1,
            trigger=CronTrigger(day=16, hour=3, minute=0),  # Día 16 a las 3 AM
            id="informar_caeas_periodo_1",
            name="Informar CAEAs no utilizados Periodo 1",
            replace_existing=True
        )
        
        # Tarea 4: Informar CAEAs no utilizados del periodo 2
        self.scheduler.add_job(
            self._informar_caeas_periodo_2,
            trigger=CronTrigger(day=1, hour=3, minute=0),  # Día 1 a las 3 AM (mes siguiente)
            id="informar_caeas_periodo_2",
            name="Informar CAEAs no utilizados Periodo 2",
            replace_existing=True
        )
        
        # Tarea 5: Health check AFIP cada 5 minutos
        self.scheduler.add_job(
            self._check_afip_health,
            trigger="interval",
            minutes=5,
            id="afip_health_check",
            name="AFIP Health Check",
            replace_existing=True
        )
        
        self.scheduler.start()
        logger.info("✅ Scheduler iniciado correctamente")
        logger.info(f"   Jobs programados: {len(self.scheduler.get_jobs())}")
    
    def stop(self):
        """Detener scheduler"""
        logger.info("🛑 Deteniendo scheduler...")
        self.scheduler.shutdown()
        logger.info("✅ Scheduler detenido")
    
    async def _solicitar_caeas_periodo_1(self):
        """Solicitar CAEAs para primera quincena (día 1)"""
        logger.info("🗓️  Ejecutando: Solicitar CAEAs Periodo 1")
        
        async with async_session() as session:
            # Obtener todas las tiendas activas
            result = await session.execute(
                select(Tienda).where(Tienda.is_active == True)
            )
            tiendas = result.scalars().all()
            
            for tienda in tiendas:
                try:
                    await CAEAService.solicitar_caea_quincenal(tienda.id, periodo=1, session=session)
                except Exception as e:
                    logger.error(f"❌ Error solicitando CAEA para tienda {tienda.id}: {e}")
        
        logger.info("✅ CAEAs Periodo 1 solicitados")
    
    async def _solicitar_caeas_periodo_2(self):
        """Solicitar CAEAs para segunda quincena (día 16)"""
        logger.info("🗓️  Ejecutando: Solicitar CAEAs Periodo 2")
        
        async with async_session() as session:
            result = await session.execute(
                select(Tienda).where(Tienda.is_active == True)
            )
            tiendas = result.scalars().all()
            
            for tienda in tiendas:
                try:
                    await CAEAService.solicitar_caea_quincenal(tienda.id, periodo=2, session=session)
                except Exception as e:
                    logger.error(f"❌ Error solicitando CAEA para tienda {tienda.id}: {e}")
        
        logger.info("✅ CAEAs Periodo 2 solicitados")
    
    async def _informar_caeas_periodo_1(self):
        """Informar CAEAs no utilizados de periodo 1 (día 16)"""
        logger.info("📤 Ejecutando: Informar CAEAs Periodo 1")
        
        async with async_session() as session:
            result = await session.execute(
                select(Tienda).where(Tienda.is_active == True)
            )
            tiendas = result.scalars().all()
            
            for tienda in tiendas:
                try:
                    await CAEAService.informar_caeas_no_utilizados(tienda.id, session)
                except Exception as e:
                    logger.error(f"❌ Error informando CAEAs para tienda {tienda.id}: {e}")
        
        logger.info("✅ CAEAs Periodo 1 informados")
    
    async def _informar_caeas_periodo_2(self):
        """Informar CAEAs no utilizados de periodo 2 (día 1 del mes siguiente)"""
        logger.info("📤 Ejecutando: Informar CAEAs Periodo 2")
        
        async with async_session() as session:
            result = await session.execute(
                select(Tienda).where(Tienda.is_active == True)
            )
            tiendas = result.scalars().all()
            
            for tienda in tiendas:
                try:
                    await CAEAService.informar_caeas_no_utilizados(tienda.id, session)
                except Exception as e:
                    logger.error(f"❌ Error informando CAEAs para tienda {tienda.id}: {e}")
        
        logger.info("✅ CAEAs Periodo 2 informados")
    
    async def _check_afip_health(self):
        """Health check de AFIP"""
        try:
            from services.afip_service import AFIPService
            
            afip = AFIPService()
            is_online = await afip.check_afip_status()
            
            if is_online:
                logger.debug("✅ AFIP online")
            else:
                logger.warning("⚠️  AFIP offline - Modo CAEA activado")
                
                # TODO: Notificar a administradores
                
        except Exception as e:
            logger.error(f"❌ Error en health check AFIP: {e}")


# =====================================================
# CLI para ejecutar scheduler
# =====================================================

async def main():
    """Entry point"""
    scheduler = AFIPScheduler()
    scheduler.start()
    
    logger.info("⏳ Scheduler corriendo... (Ctrl+C para salir)")
    
    try:
        # Mantener vivo
        await asyncio.Future()
    except KeyboardInterrupt:
        logger.info("👋 Scheduler detenido por usuario")
    finally:
        scheduler.stop()


if __name__ == "__main__":
    import sys
    
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("afip_scheduler.log"),
        ]
    )
    
    # Run scheduler
    asyncio.run(main())
