"""
🔥 ENDPOINTS DE CACHE - WARMUP Y GESTIÓN DE REDIS

Permite pre-cachear stock de productos en Redis
antes de comenzar operaciones de venta
"""

from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as redis
from core.db import get_session
from api.deps import CurrentTienda
from models import Producto
from core.redis_scripts import WARMUP_STOCK_SCRIPT, generate_stock_key
from core.config import settings
from pydantic import BaseModel


router = APIRouter(prefix="/cache", tags=["Cache"])


class WarmupResponse(BaseModel):
    """Respuesta del warmup de cache"""
    productos_cacheados: int
    mensaje: str


class CacheStatsResponse(BaseModel):
    """Estadísticas de cache de Redis"""
    total_keys: int
    memoria_usada_mb: float
    hits: int
    misses: int
    hit_rate: float


@router.post("/warmup", response_model=WarmupResponse)
async def warmup_cache(
    current_tienda: CurrentTienda,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> WarmupResponse:
    """
    🔥 WARMUP DE CACHE
    
    Pre-cachea el stock de todos los productos activos de la tienda en Redis
    
    CUÁNDO USAR:
    - Al iniciar el día de ventas
    - Después de un deploy/reinicio
    - Antes de eventos de alto tráfico (Black Friday, etc)
    
    GARANTÍAS:
    - Usa script Lua para atomicidad
    - Solo cachea productos activos
    - Sobrescribe valores existentes (idempotente)
    """
    redis_client = None
    productos_cacheados = 0
    
    try:
        # Conectar a Redis
        redis_client = redis.Redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        
        # Obtener todos los productos activos de la tienda
        statement = select(Producto).where(
            Producto.tienda_id == current_tienda.id,
            Producto.is_active == True
        )
        
        result = await session.execute(statement)
        productos = result.scalars().all()
        
        # Cachear cada producto usando Lua script
        for producto in productos:
            stock_key = generate_stock_key(
                str(current_tienda.id),
                str(producto.id)
            )
            
            # Ejecutar script Lua de warmup
            result = await redis_client.eval(
                WARMUP_STOCK_SCRIPT,
                1,  # num_keys
                stock_key,
                float(producto.stock_actual)
            )
            
            if result == 1:
                productos_cacheados += 1
        
        return WarmupResponse(
            productos_cacheados=productos_cacheados,
            mensaje=f"✅ Cache calentado: {productos_cacheados} productos en Redis"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al hacer warmup de cache: {str(e)}"
        )
    
    finally:
        if redis_client:
            await redis_client.aclose()


@router.get("/stats", response_model=CacheStatsResponse)
async def get_cache_stats() -> CacheStatsResponse:
    """
    📊 ESTADÍSTICAS DE CACHE
    
    Muestra métricas de Redis:
    - Cantidad de keys
    - Memoria usada
    - Hit rate (efectividad del cache)
    """
    redis_client = None
    
    try:
        redis_client = redis.Redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        
        # Obtener info de Redis
        info = await redis_client.info('stats')
        memory_info = await redis_client.info('memory')
        
        # Calcular métricas
        hits = int(info.get('keyspace_hits', 0))
        misses = int(info.get('keyspace_misses', 0))
        total_requests = hits + misses
        hit_rate = (hits / total_requests * 100) if total_requests > 0 else 0.0
        
        # Memoria usada en MB
        memoria_bytes = int(memory_info.get('used_memory', 0))
        memoria_mb = memoria_bytes / (1024 * 1024)
        
        # Total de keys
        total_keys = await redis_client.dbsize()
        
        return CacheStatsResponse(
            total_keys=total_keys,
            memoria_usada_mb=round(memoria_mb, 2),
            hits=hits,
            misses=misses,
            hit_rate=round(hit_rate, 2)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estadísticas de cache: {str(e)}"
        )
    
    finally:
        if redis_client:
            await redis_client.aclose()


@router.delete("/flush")
async def flush_cache(
    current_tienda: CurrentTienda
) -> dict:
    """
    🗑️ LIMPIAR CACHE DE TIENDA
    
    Elimina todas las keys de stock de la tienda actual
    
    ⚠️ USAR CON CUIDADO:
    - Después de un warmup ejecutar este endpoint invalidará el cache
    - Requiere re-warmup antes de vender
    """
    redis_client = None
    
    try:
        redis_client = redis.Redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        
        # Buscar todas las keys de la tienda
        pattern = f"stock:{current_tienda.id}:*"
        keys = []
        
        async for key in redis_client.scan_iter(match=pattern):
            keys.append(key)
        
        # Eliminar keys encontradas
        if keys:
            await redis_client.delete(*keys)
        
        return {
            "keys_eliminadas": len(keys),
            "mensaje": f"✅ Cache limpiado: {len(keys)} productos removidos de Redis"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error limpiando cache: {str(e)}"
        )
    
    finally:
        if redis_client:
            await redis_client.aclose()
