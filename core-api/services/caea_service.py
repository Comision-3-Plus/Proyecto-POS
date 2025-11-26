"""
Servicio de CAEA (Código de Autorización Electrónico Anticipado)
Gestiona CAEAs quincenales para modo contingencia
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from models import CAEA


logger = logging.getLogger(__name__)


class CAEAService:
    """
    Servicio para gestionar CAEAs quincenales
    """
    
    @staticmethod
    async def solicitar_caea_quincenal(
        tienda_id: UUID,
        periodo: int,  # 1 o 2 (primera o segunda quincena)
        session: AsyncSession
    ) -> str:
        """
        Solicitar CAEA quincenal a AFIP
        
        Args:
            tienda_id: ID de la tienda
            periodo: 1 (días 1-15) o 2 (días 16-fin de mes)
            session: Session de base de datos
        
        Returns:
            CAEA obtenido
        """
        logger.info(f"📡 Solicitando CAEA quincenal para tienda {tienda_id}, periodo {periodo}")
        
        # Calcular fechas
        now = datetime.utcnow()
        
        if periodo == 1:
            fecha_desde = datetime(now.year, now.month, 1)
            fecha_hasta = datetime(now.year, now.month, 15, 23, 59, 59)
        else:
            fecha_desde = datetime(now.year, now.month, 16)
            # Último día del mes
            if now.month == 12:
                fecha_hasta = datetime(now.year, 12, 31, 23, 59, 59)
            else:
                fecha_hasta = datetime(now.year, now.month + 1, 1) - timedelta(seconds=1)
        
        # Verificar si ya existe CAEA para este periodo
        result = await session.execute(
            select(CAEA).where(
                CAEA.tienda_id == tienda_id,
                CAEA.periodo == periodo,
                CAEA.fecha_desde == fecha_desde.date()
            )
        )
        existing_caea = result.scalar_one_or_none()
        
        if existing_caea:
            logger.info(f"✅ CAEA ya existe: {existing_caea.caea}")
            return existing_caea.caea
        
        # Solicitar a AFIP (simulado)
        # En producción: usar librería pyafipws
        caea_numero = f"{now.year}{now.month:02d}{periodo}{''.join([str(i) for i in range(8)])}"
        
        # Guardar en DB
        caea = CAEA(
            tienda_id=tienda_id,
            caea=caea_numero,
            periodo=periodo,
            fecha_desde=fecha_desde.date(),
            fecha_hasta=fecha_hasta.date(),
            fecha_solicitud=datetime.utcnow(),
            orden=1,  # Número de orden dentro del periodo
        )
        
        session.add(caea)
        await session.commit()
        
        logger.info(f"✅ CAEA obtenido: {caea_numero}")
        logger.info(f"   Válido desde {fecha_desde.date()} hasta {fecha_hasta.date()}")
        
        return caea_numero
    
    @staticmethod
    async def obtener_caea_vigente(
        tienda_id: UUID,
        session: AsyncSession
    ) -> Optional[CAEA]:
        """
        Obtener CAEA vigente para la fecha actual
        
        Args:
            tienda_id: ID de la tienda
            session: Session de base de datos
        
        Returns:
            CAEA vigente o None
        """
        now = datetime.utcnow()
        
        result = await session.execute(
            select(CAEA).where(
                CAEA.tienda_id == tienda_id,
                CAEA.fecha_desde <= now.date(),
                CAEA.fecha_hasta >= now.date()
            ).order_by(CAEA.fecha_solicitud.desc())
        )
        
        return result.scalar_one_or_none()
    
    @staticmethod
    async def solicitar_caeas_automatico(
        tienda_id: UUID,
        session: AsyncSession
    ):
        """
        Solicitar CAEAs automáticamente para los próximos 2 periodos
        
        Esta función debe ejecutarse:
        - El día 1 de cada mes (para periodo 1)
        - El día 16 de cada mes (para periodo 2)
        """
        now = datetime.utcnow()
        
        # Determinar periodos a solicitar
        periodos = []
        
        if now.day <= 15:
            # Solicitar CAEA para primera quincena
            periodos.append(1)
        else:
            # Solicitar CAEA para segunda quincena
            periodos.append(2)
        
        # También solicitar el siguiente periodo (anticipado)
        if now.day <= 15:
            periodos.append(2)
        else:
            # Próximo mes, periodo 1
            # TODO: Implementar lógica para mes siguiente
            pass
        
        for periodo in periodos:
            try:
                await CAEAService.solicitar_caea_quincenal(tienda_id, periodo, session)
            except Exception as e:
                logger.error(f"❌ Error solicitando CAEA periodo {periodo}: {e}")
    
    @staticmethod
    async def informar_caeas_no_utilizados(
        tienda_id: UUID,
        session: AsyncSession
    ):
        """
        Informar a AFIP sobre CAEAs no utilizados
        
        Esta función debe ejecutarse:
        - El día 16 de cada mes (informar CAEAs de periodo 1)
        - El día 1 del mes siguiente (informar CAEAs de periodo 2)
        """
        logger.info(f"📡 Informando CAEAs no utilizados para tienda {tienda_id}")
        
        # Obtener CAEAs del periodo anterior que no se usaron
        now = datetime.utcnow()
        
        # Determinar periodo a informar
        if now.day >= 16:
            periodo = 1
        else:
            periodo = 2
        
        result = await session.execute(
            select(CAEA).where(
                CAEA.tienda_id == tienda_id,
                CAEA.periodo == periodo,
                CAEA.fecha_hasta < now.date(),
                CAEA.informado == False
            )
        )
        
        caeas = result.scalars().all()
        
        for caea in caeas:
            # Informar a AFIP (simulado)
            # En producción: usar pyafipws
            
            logger.info(f"📤 Informando CAEA no utilizado: {caea.caea}")
            
            # Marcar como informado
            caea.informado = True
        
        await session.commit()
        
        logger.info(f"✅ Informados {len(caeas)} CAEAs no utilizados")


# =====================================================
# MODELO CAEA (agregar a models.py)
# =====================================================

# class CAEA(SQLModel, table=True):
#     """
#     Modelo de CAEA - Código de Autorización Electrónico Anticipado
#     Se solicitan quincenalmente para modo contingencia
#     """
#     __tablename__ = "caeas"
#     
#     id: UUID = Field(default_factory=uuid4, primary_key=True)
#     tienda_id: UUID = Field(foreign_key="tiendas.id", nullable=False, index=True)
#     caea: str = Field(max_length=14, nullable=False, index=True)  # CAEA de 14 dígitos
#     periodo: int = Field(nullable=False)  # 1 o 2 (quincena)
#     fecha_desde: date = Field(nullable=False)
#     fecha_hasta: date = Field(nullable=False)
#     fecha_solicitud: datetime = Field(default_factory=datetime.utcnow, nullable=False)
#     orden: int = Field(nullable=False)  # Orden dentro del periodo
#     informado: bool = Field(default=False, nullable=False)  # Si se informó a AFIP
#     created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
