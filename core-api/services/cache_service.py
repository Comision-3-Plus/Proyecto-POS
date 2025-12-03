"""
Servicio de caché con Redis para optimizar consultas frecuentes
"""
import json
from typing import Optional, Any, List
from datetime import timedelta
import redis.asyncio as redis
from core.config import settings

# Cliente Redis global
redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """Obtiene el cliente Redis singleton"""
    global redis_client
    
    if redis_client is None:
        redis_client = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    return redis_client


class CacheService:
    """Servicio de caché con Redis"""
    
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """Obtiene un valor del caché"""
        try:
            client = await get_redis_client()
            value = await client.get(key)
            
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Error al obtener del caché: {e}")
            return None
    
    @staticmethod
    async def set(
        key: str,
        value: Any,
        ttl: Optional[int] = 300  # 5 minutos por defecto
    ) -> bool:
        """Guarda un valor en el caché"""
        try:
            client = await get_redis_client()
            serialized = json.dumps(value, default=str)
            
            if ttl:
                await client.setex(key, ttl, serialized)
            else:
                await client.set(key, serialized)
            
            return True
        except Exception as e:
            print(f"Error al guardar en caché: {e}")
            return False
    
    @staticmethod
    async def delete(key: str) -> bool:
        """Elimina una clave del caché"""
        try:
            client = await get_redis_client()
            await client.delete(key)
            return True
        except Exception as e:
            print(f"Error al eliminar del caché: {e}")
            return False
    
    @staticmethod
    async def delete_pattern(pattern: str) -> int:
        """Elimina todas las claves que coincidan con un patrón"""
        try:
            client = await get_redis_client()
            keys = await client.keys(pattern)
            
            if keys:
                return await client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Error al eliminar patrón del caché: {e}")
            return 0
    
    @staticmethod
    async def increment(key: str, amount: int = 1) -> int:
        """Incrementa un contador"""
        try:
            client = await get_redis_client()
            return await client.incrby(key, amount)
        except Exception as e:
            print(f"Error al incrementar: {e}")
            return 0
    
    @staticmethod
    async def add_to_sorted_set(
        key: str,
        member: str,
        score: float
    ) -> bool:
        """Agrega un elemento a un sorted set (para ranking)"""
        try:
            client = await get_redis_client()
            await client.zadd(key, {member: score})
            return True
        except Exception as e:
            print(f"Error al agregar a sorted set: {e}")
            return False
    
    @staticmethod
    async def get_top_from_sorted_set(
        key: str,
        limit: int = 10
    ) -> List[tuple]:
        """Obtiene los top N elementos de un sorted set"""
        try:
            client = await get_redis_client()
            # ZREVRANGE devuelve en orden descendente (mayor a menor)
            results = await client.zrevrange(
                key, 0, limit - 1, withscores=True
            )
            return results
        except Exception as e:
            print(f"Error al obtener top del sorted set: {e}")
            return []


# Funciones helper para casos de uso comunes

async def cache_producto(producto_id: str, data: dict, ttl: int = 600):
    """Cachea datos de un producto (10 min)"""
    key = f"producto:{producto_id}"
    await CacheService.set(key, data, ttl)


async def get_cached_producto(producto_id: str) -> Optional[dict]:
    """Obtiene producto del caché"""
    key = f"producto:{producto_id}"
    return await CacheService.get(key)


async def invalidate_producto(producto_id: str):
    """Invalida caché de un producto"""
    key = f"producto:{producto_id}"
    await CacheService.delete(key)


async def track_producto_view(producto_id: str, tienda_id: str):
    """Trackea visualización de producto para ranking"""
    key = f"productos_mas_vistos:{tienda_id}"
    await CacheService.increment(f"producto_views:{producto_id}")
    await CacheService.add_to_sorted_set(key, producto_id, 1)


async def get_productos_mas_vistos(tienda_id: str, limit: int = 10) -> List[str]:
    """Obtiene IDs de productos más vistos"""
    key = f"productos_mas_vistos:{tienda_id}"
    results = await CacheService.get_top_from_sorted_set(key, limit)
    return [producto_id for producto_id, _ in results]


async def cache_dashboard_metrics(tienda_id: str, data: dict):
    """Cachea métricas del dashboard (1 minuto)"""
    key = f"dashboard_metrics:{tienda_id}"
    await CacheService.set(key, data, ttl=60)


async def get_cached_dashboard_metrics(tienda_id: str) -> Optional[dict]:
    """Obtiene métricas del dashboard desde caché"""
    key = f"dashboard_metrics:{tienda_id}"
    return await CacheService.get(key)
