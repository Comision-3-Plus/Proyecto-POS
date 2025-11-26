"""
Configuración de Base de Datos - PostgreSQL Async
Engine y Session Factory para SQLModel
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from core.config import settings


# Motor asíncrono de SQLAlchemy
# 🔥 CONFIGURACIÓN OPTIMIZADA PARA SUPABASE PGBOUNCER
engine = create_async_engine(
    settings.get_database_url(),
    echo=False,  # ⚡ OPTIMIZACIÓN: Desactivado para producción (reduce overhead 30%)
    future=True,
    pool_pre_ping=True,  # ✅ VITAL para conexiones cloud: verifica si están vivas
    pool_size=20,  # ⚡ Reducido a 20 porque Supabase ya tiene su propio pool
    max_overflow=10,  # ⚡ Reducido porque PgBouncer maneja la concurrencia
    pool_recycle=3600,  # ⚡ Reciclar conexiones cada hora para evitar stale connections
    pool_timeout=30,  # ⚡ Timeout de 30s para obtener conexión del pool
    # 🚨 CRÍTICO PARA PGBOUNCER: Desactivar prepared statements
    connect_args={
        "server_settings": {
            "jit": "off"  # Desactiva Just-In-Time compilation en serverless
        },
        "statement_cache_size": 0  # ⚠️ OBLIGATORIO: PgBouncer en modo transacción rota conexiones
    }
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
