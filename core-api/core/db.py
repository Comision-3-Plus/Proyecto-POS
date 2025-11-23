"""
Configuración de Base de Datos - PostgreSQL Async
Engine y Session Factory para SQLModel
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from app.core.config import settings


# Motor asíncrono de SQLAlchemy
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # ⚡ OPTIMIZACIÓN: Desactivado para producción (reduce overhead 30%)
    future=True,
    pool_pre_ping=True,
    pool_size=50,  # ⚡ Aumentado de 10 a 50 para más concurrencia
    max_overflow=100,  # ⚡ Aumentado de 20 a 100
    pool_recycle=3600,  # ⚡ Reciclar conexiones cada hora para evitar stale connections
    pool_timeout=30,  # ⚡ Timeout de 30s para obtener conexión del pool
)

# Session Factory asíncrona
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def init_db() -> None:
    """
    Inicializa las tablas en la base de datos
    Ejecutar solo en desarrollo o con migraciones controladas
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependencia de FastAPI para inyectar sesiones de BD
    Uso: session: AsyncSession = Depends(get_session)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
