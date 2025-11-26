"""
Multi-Tenant Middleware
Routing dinámico según subdominio
"""
import logging
from typing import Optional
from uuid import UUID
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import select

from core.config import settings
from models import Tienda


logger = logging.getLogger(__name__)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware que detecta el tenant por subdominio y
    asigna la conexión de base de datos correspondiente
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.engine_cache = {}  # Cache de engines por tienda
    
    async def dispatch(self, request: Request, call_next):
        # Extraer subdomain
        host = request.headers.get("host", "")
        subdomain = self._extract_subdomain(host)
        
        if not subdomain:
            # Sin subdomain = usar DB compartida
            request.state.tenant_id = None
            request.state.db_session = None
            return await call_next(request)
        
        # Buscar tienda por subdomain
        tienda = await self._get_tienda_by_subdomain(subdomain)
        
        if not tienda:
            raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
        # Verificar si tiene DB dedicada
        if tienda.has_dedicated_db:
            # Crear/obtener engine dedicado
            engine = await self._get_dedicated_engine(tienda)
            request.state.db_engine = engine
        else:
            # Usar engine compartido con filtro por tenant_id
            request.state.db_engine = None  # Usará el global
        
        # Setear tenant_id en request
        request.state.tenant_id = tienda.id
        request.state.tienda = tienda
        
        logger.debug(f"🏢 Tenant: {tienda.nombre} (ID: {tienda.id})")
        
        return await call_next(request)
    
    def _extract_subdomain(self, host: str) -> Optional[str]:
        """
        Extraer subdomain de host
        
        Ejemplos:
        - prune.nexuspos.com → "prune"
        - zara.nexuspos.com → "zara"
        - nexuspos.com → None
        - localhost:8001 → None
        """
        # Remover puerto
        if ":" in host:
            host = host.split(":")[0]
        
        # Verificar si es localhost o IP
        if host in ["localhost", "127.0.0.1"] or host.replace(".", "").isdigit():
            return None
        
        # Split por puntos
        parts = host.split(".")
        
        # Si solo tiene 2 partes (domain.com), no hay subdomain
        if len(parts) <= 2:
            return None
        
        # Retornar primera parte como subdomain
        return parts[0]
    
    async def _get_tienda_by_subdomain(self, subdomain: str) -> Optional[Tienda]:
        """Buscar tienda por subdomain"""
        from core.db import async_session
        
        async with async_session() as session:
            result = await session.execute(
                select(Tienda).where(Tienda.subdomain == subdomain)
            )
            return result.scalar_one_or_none()
    
    async def _get_dedicated_engine(self, tienda: Tienda):
        """
        Obtener engine dedicado para tienda enterprise
        """
        cache_key = str(tienda.id)
        
        # Verificar cache
        if cache_key in self.engine_cache:
            return self.engine_cache[cache_key]
        
        # Crear engine dedicado
        dedicated_db_url = tienda.dedicated_db_url or self._build_dedicated_url(tienda)
        
        engine = create_async_engine(
            dedicated_db_url,
            echo=False,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=5,
        )
        
        # Guardar en cache
        self.engine_cache[cache_key] = engine
        
        logger.info(f"✅ Engine dedicado creado para tienda {tienda.nombre}")
        
        return engine
    
    def _build_dedicated_url(self, tienda: Tienda) -> str:
        """
        Construir URL de DB dedicada
        
        Formato: postgresql+asyncpg://user:pass@host:port/nexuspos_{tienda_id}
        """
        base_url = settings.DATABASE_URL
        
        # Reemplazar nombre de base de datos
        if "/" in base_url:
            base = base_url.rsplit("/", 1)[0]
            db_name = f"nexuspos_{tienda.id}"
            return f"{base}/{db_name}"
        
        return base_url


# =====================================================
# DEPENDENCY INJECTION
# =====================================================

async def get_tenant_session(request: Request) -> AsyncSession:
    """
    Dependency que retorna session de DB según tenant
    """
    # Verificar si tiene engine dedicado
    if hasattr(request.state, "db_engine") and request.state.db_engine:
        # Usar engine dedicado
        async_session_maker = async_sessionmaker(
            request.state.db_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        async with async_session_maker() as session:
            yield session
    else:
        # Usar engine compartido
        from core.db import async_session
        
        async with async_session() as session:
            # Aplicar filtro automático por tenant_id
            if hasattr(request.state, "tenant_id") and request.state.tenant_id:
                # TODO: Implementar filtro automático en queries
                pass
            
            yield session


async def get_current_tenant(request: Request) -> Optional[Tienda]:
    """
    Dependency que retorna el tenant actual
    """
    if hasattr(request.state, "tienda"):
        return request.state.tienda
    return None
