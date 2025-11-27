"""
OMS Service - Smart Routing Algorithm
Algoritmo de routing inteligente para decidir desde dónde despachar una orden
"""
import math
from typing import List, Dict, Optional, Tuple
from uuid import UUID
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, func

from schemas_models.oms_models import (
    OrdenOmnicanal,
    OrdenItem,
    LocationCapability,
    ShippingZone
)
from models import Location, ProductVariant, InventoryLedger


class SmartRoutingService:
    """
    Motor de decisión para fulfillment inteligente
    
    Decide desde qué ubicación despachar una orden basándose en:
    1. Disponibilidad de stock
    2. Distancia al cliente
    3. Costo de envío
    4. Capacidades de la ubicación
    5. Prioridad del negocio
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def assign_fulfillment_location(
        self,
        orden: OrdenOmnicanal
    ) -> Tuple[UUID, Dict]:
        """
        Asigna la mejor ubicación para despachar una orden
        
        Returns:
            (location_id, decision_metadata)
        """
        # 1. Obtener ubicaciones candidatas
        candidates = await self._get_candidate_locations(orden)
        
        if not candidates:
            raise ValueError("No hay ubicaciones disponibles para esta orden")
        
        # 2. Calcular score para cada candidato
        scored_candidates = []
        for candidate in candidates:
            score = await self._calculate_location_score(
                location=candidate,
                orden=orden
            )
            scored_candidates.append({
                "location_id": str(candidate.location_id),
                "location_name": candidate.name,
                "score": score["total_score"],
                "shipping_cost": score["shipping_cost"],
                "distance_km": score["distance_km"],
                "stock_availability": score["stock_availability"],
                "operational_cost": score["operational_cost"],
                "breakdown": score
            })
        
        # 3. Ordenar por score (mayor es mejor)
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        
        # 4. Seleccionar el mejor
        best = scored_candidates[0]
        
        # 5. Crear metadata de decisión
        decision_metadata = {
            "algorithm_version": "v1.0",
            "timestamp": datetime.utcnow().isoformat(),
            "candidates": scored_candidates,
            "selected": best["location_id"],
            "selected_name": best["location_name"],
            "reason": self._get_selection_reason(scored_candidates)
        }
        
        return UUID(best["location_id"]), decision_metadata
    
    async def _get_candidate_locations(
        self,
        orden: OrdenOmnicanal
    ) -> List[Location]:
        """
        Obtiene ubicaciones que pueden cumplir la orden
        
        Filtra por:
        - Ubicación activa
        - Puede despachar
        - Tiene stock de TODOS los items
        - Soporta el método de envío solicitado
        """
        # Obtener todas las ubicaciones de la tienda
        result = await self.session.exec(
            select(Location)
            .join(LocationCapability)
            .where(
                and_(
                    Location.tienda_id == orden.tienda_id,
                    LocationCapability.puede_despachar == True
                )
            )
        )
        locations = result.all()
        
        # Filtrar por disponibilidad de stock
        candidates = []
        for location in locations:
            if await self._has_full_stock(location, orden.items):
                candidates.append(location)
        
        return candidates
    
    async def _has_full_stock(
        self,
        location: Location,
        items: List[OrdenItem]
    ) -> bool:
        """
        Verifica si una ubicación tiene stock de todos los items
        """
        for item in items:
            stock = await self._get_stock_in_location(
                item.variant_id,
                location.location_id
            )
            if stock < item.cantidad:
                return False
        return True
    
    async def _get_stock_in_location(
        self,
        variant_id: UUID,
        location_id: UUID
    ) -> float:
        """
        Calcula stock disponible de una variante en una ubicación
        """
        result = await self.session.exec(
            select(func.sum(InventoryLedger.delta))
            .where(
                and_(
                    InventoryLedger.variant_id == variant_id,
                    InventoryLedger.location_id == location_id
                )
            )
        )
        stock = result.first()
        return stock if stock else 0.0
    
    async def _calculate_location_score(
        self,
        location: Location,
        orden: OrdenOmnicanal
    ) -> Dict:
        """
        Calcula el score de una ubicación para una orden
        
        Fórmula:
        Score = (Stock_Weight * Stock_Score) +
                (Distance_Weight * Distance_Score) +
                (Cost_Weight * Cost_Score) +
                (Priority_Weight * Priority_Score)
        
        Pesos configurables según estrategia del negocio
        """
        # Obtener capability
        capability = await self._get_location_capability(location.location_id)
        
        # 1. Score de distancia (menor distancia = mejor)
        distance_km = self._calculate_distance(
            location,
            orden.shipping_address
        )
        distance_score = self._normalize_distance_score(distance_km)
        
        # 2. Score de costo de envío (menor costo = mejor)
        shipping_cost = await self._calculate_shipping_cost(
            location,
            orden,
            distance_km
        )
        cost_score = self._normalize_cost_score(shipping_cost)
        
        # 3. Score de disponibilidad de stock (100% = mejor)
        stock_score = 100.0  # Ya sabemos que tiene todo
        
        # 4. Score de prioridad del negocio
        priority_score = capability.prioridad * 10 if capability else 50
        
        # 5. Costo operativo
        operational_cost = (
            capability.costo_picking + capability.costo_packing
            if capability else 1000.0
        )
        operational_score = self._normalize_cost_score(operational_cost)
        
        # Pesos (configurables por tienda)
        weights = {
            "distance": 0.30,
            "cost": 0.35,
            "stock": 0.15,
            "priority": 0.10,
            "operational": 0.10
        }
        
        # Cálculo final
        total_score = (
            weights["distance"] * distance_score +
            weights["cost"] * cost_score +
            weights["stock"] * stock_score +
            weights["priority"] * priority_score +
            weights["operational"] * operational_score
        )
        
        return {
            "total_score": round(total_score, 2),
            "distance_km": round(distance_km, 2),
            "distance_score": round(distance_score, 2),
            "shipping_cost": round(shipping_cost, 2),
            "cost_score": round(cost_score, 2),
            "stock_availability": 100.0,
            "stock_score": stock_score,
            "priority_score": priority_score,
            "operational_cost": operational_cost,
            "operational_score": round(operational_score, 2),
            "weights": weights
        }
    
    def _calculate_distance(
        self,
        location: Location,
        shipping_address: Dict
    ) -> float:
        """
        Calcula distancia en km usando fórmula de Haversine
        """
        if not location.latitud or not location.longitud:
            return 999.0  # Penalización si no tiene coordenadas
        
        lat1 = location.latitud
        lon1 = location.longitud
        lat2 = shipping_address.get("lat")
        lon2 = shipping_address.get("lng")
        
        if not lat2 or not lon2:
            return 50.0  # Valor default si cliente no tiene coords
        
        # Fórmula de Haversine
        R = 6371  # Radio de la Tierra en km
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_phi / 2) ** 2 +
             math.cos(phi1) * math.cos(phi2) *
             math.sin(delta_lambda / 2) ** 2)
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def _normalize_distance_score(self, distance_km: float) -> float:
        """
        Normaliza distancia a score 0-100 (menor distancia = mayor score)
        
        0-5km   → 100 puntos
        10km    → 90 puntos
        20km    → 80 puntos
        50km    → 50 puntos
        100km+  → 0 puntos
        """
        if distance_km <= 5:
            return 100.0
        elif distance_km >= 100:
            return 0.0
        else:
            return 100 - (distance_km * 0.9)
    
    async def _calculate_shipping_cost(
        self,
        location: Location,
        orden: OrdenOmnicanal,
        distance_km: float
    ) -> float:
        """
        Calcula costo de envío desde una ubicación
        
        Puede usar:
        - ShippingZones configuradas
        - Integración con Andreani/OCA/Correo Argentino
        - Fórmula simple basada en distancia
        """
        # Implementación simple basada en distancia
        # TODO: Integrar con APIs de courriers reales
        
        base_cost = 1000.0  # $1000 base
        per_km = 50.0  # $50 por km
        
        cost = base_cost + (distance_km * per_km)
        
        # Ajustar por método de envío
        if orden.shipping_method == "express":
            cost *= 1.5
        elif orden.shipping_method == "same_day":
            cost *= 2.0
        
        return cost
    
    def _normalize_cost_score(self, cost: float) -> float:
        """
        Normaliza costo a score 0-100 (menor costo = mayor score)
        
        $0-1000     → 100 puntos
        $5000       → 50 puntos
        $10000+     → 0 puntos
        """
        if cost <= 1000:
            return 100.0
        elif cost >= 10000:
            return 0.0
        else:
            return 100 - ((cost - 1000) / 90)
    
    async def _get_location_capability(
        self,
        location_id: UUID
    ) -> Optional[LocationCapability]:
        """
        Obtiene capacidades de una ubicación
        """
        result = await self.session.exec(
            select(LocationCapability)
            .where(LocationCapability.location_id == location_id)
        )
        return result.first()
    
    def _get_selection_reason(self, candidates: List[Dict]) -> str:
        """
        Genera razón human-readable de por qué se eligió esta ubicación
        """
        if len(candidates) == 1:
            return "única ubicación con stock disponible"
        
        best = candidates[0]
        second = candidates[1] if len(candidates) > 1 else None
        
        if not second:
            return "mejor opción general"
        
        # Comparar scores
        if best["shipping_cost"] < second["shipping_cost"] * 0.8:
            return "costo de envío significativamente menor"
        elif best["distance_km"] < second["distance_km"] * 0.7:
            return "mucho más cerca del cliente"
        elif best["score"] > second["score"] * 1.2:
            return "mejor balance costo/distancia/eficiencia"
        else:
            return "mejor puntuación general"


from datetime import datetime
