"""
Promotion Service - Motor de Evaluación de Reglas
Evalúa reglas de promociones y calcula descuentos
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, or_
import json_logic

from schemas_models.promo_models import (
    Promocion,
    PromocionUso,
    DescuentoCalculado,
    TipoPromo
)


class PromotionEngine:
    """
    Motor de evaluación de promociones
    
    Usa JSON Logic para evalular reglas complejas sin hardcodear lógica
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def calcular_descuentos(
        self,
        carrito: Dict[str, Any],
        tienda_id: UUID,
        cliente_id: Optional[UUID] = None,
        codigo_promocional: Optional[str] = None
    ) -> DescuentoCalculado:
        """
        Calcula todos los descuentos aplicables a un carrito
        
        Args:
            carrito: {
                "items": [
                    {
                        "variant_id": UUID,
                        "cantidad": int,
                        "precio_unitario": float,
                        "product_id": UUID,
                        "coleccion_id": UUID,
                        "categoria": str
                    }
                ],
                "canal": "pos" | "online",
                "forma_pago": "efectivo",
                "total": float
            }
        
        Returns:
            DescuentoCalculado con todas las promos aplicables
        """
        # 1. Obtener promociones activas
        promociones = await self._get_active_promotions(
            tienda_id,
            codigo_promocional
        )
        
        # 2. Filtrar promociones aplicables
        promociones_aplicables = []
        for promo in promociones:
            if await self._is_promotion_applicable(promo, carrito, cliente_id):
                promociones_aplicables.append(promo)
        
        # 3. Ordenar por prioridad (mayor primero)
        promociones_aplicables.sort(key=lambda p: p.prioridad, reverse=True)
        
        # 4. Aplicar promociones
        resultado = await self._apply_promotions(
            promociones_aplicables,
            carrito,
            cliente_id
        )
        
        return resultado
    
    async def _get_active_promotions(
        self,
        tienda_id: UUID,
        codigo_promocional: Optional[str] = None
    ) -> List[Promocion]:
        """
        Obtiene promociones activas
        """
        now = datetime.utcnow()
        
        conditions = [
            Promocion.tienda_id == tienda_id,
            Promocion.is_active == True,
            Promocion.fecha_inicio <= now,
            Promocion.fecha_fin >= now
        ]
        
        # Si hay código, filtrar por código
        if codigo_promocional:
            conditions.append(
                or_(
                    Promocion.codigo_promocional == codigo_promocional,
                    Promocion.codigo_promocional.is_(None)  # Promos sin código
                )
            )
        else:
            # Solo promos sin código
            conditions.append(Promocion.codigo_promocional.is_(None))
        
        # Verificar día de la semana
        dia_semana = now.isoweekday()  # 1=Lun, 7=Dom
        
        result = await self.session.exec(
            select(Promocion).where(and_(*conditions))
        )
        
        promociones = result.all()
        
        # Filtrar por día de semana y hora
        filtered = []
        for promo in promociones:
            # Día de semana
            if promo.dias_semana and dia_semana not in promo.dias_semana:
                continue
            
            # Hora (solo para POS físico)
            if promo.hora_inicio and promo.hora_fin:
                hora_actual = now.strftime("%H:%M")
                if not (promo.hora_inicio <= hora_actual <= promo.hora_fin):
                    continue
            
            filtered.append(promo)
        
        return filtered
    
    async def _is_promotion_applicable(
        self,
        promo: Promocion,
        carrito: Dict,
        cliente_id: Optional[UUID]
    ) -> bool:
        """
        Verifica si una promoción aplica al carrito
        """
        # 1. Verificar canal
        if carrito.get("canal") not in promo.canales_aplicables:
            return False
        
        # 2. Verificar forma de pago
        if promo.formas_pago_aplicables:
            if carrito.get("forma_pago") not in promo.formas_pago_aplicables:
                return False
        
        # 3. Verificar límites de uso
        if promo.usos_maximos and promo.usos_actuales >= promo.usos_maximos:
            return False
        
        if promo.usos_maximos_por_cliente and cliente_id:
            usos_cliente = await self._count_customer_uses(promo.id, cliente_id)
            if usos_cliente >= promo.usos_maximos_por_cliente:
                return False
        
        # 4. Evaluar reglas JSON Logic
        if promo.reglas:
            context = self._build_context(carrito)
            try:
                cumple_reglas = json_logic.jsonLogic(promo.reglas, context)
                if not cumple_reglas:
                    return False
            except Exception as e:
                print(f"Error evaluando reglas de {promo.nombre}: {e}")
                return False
        
        return True
    
    def _build_context(self, carrito: Dict) -> Dict:
        """
        Construye contexto para evaluación de reglas JSON Logic
        
        Variables disponibles:
        - total: Total del carrito
        - cantidad_items: Cantidad total de items
        - tiene_producto: [lista de product_ids]
        - tiene_categoria: [lista de categorías]
        - tiene_coleccion: [lista de coleccion_ids]
        - forma_pago: string
        - canal: string
        """
        items = carrito.get("items", [])
        
        return {
            "total": carrito.get("total", 0),
            "cantidad_items": sum(item["cantidad"] for item in items),
            "productos": [str(item["product_id"]) for item in items],
            "categorias": list(set(item.get("categoria") for item in items if item.get("categoria"))),
            "colecciones": [str(item.get("coleccion_id")) for item in items if item.get("coleccion_id")],
            "forma_pago": carrito.get("forma_pago"),
            "canal": carrito.get("canal")
        }
    
    async def _apply_promotions(
        self,
        promociones: List[Promocion],
        carrito: Dict,
        cliente_id: Optional[UUID]
    ) -> DescuentoCalculado:
        """
        Aplica promociones al carrito
        
        Maneja:
        - Acumulación (si es_acumulable = True)
        - No-acumulación (la mejor gana)
        - Prioridad
        """
        items_originales = carrito["items"].copy()
        descuento_total = 0.0
        promociones_aplicadas = []
        items_regalo = []
        items_con_descuento = []
        
        # Si NO hay promos acumulables, solo tomar la mejor
        if not any(p.es_acumulable for p in promociones):
            # Evaluar cada promo y quedarse con la mejor
            mejor_promo = None
            mejor_descuento = 0.0
            
            for promo in promociones:
                desc = self._calcular_descuento_promo(promo, carrito)
                if desc > mejor_descuento:
                    mejor_descuento = desc
                    mejor_promo = promo
            
            if mejor_promo:
                descuento_total = mejor_descuento
                promociones_aplicadas.append({
                    "nombre": mejor_promo.nombre,
                    "tipo": mejor_promo.tipo,
                    "descuento": mejor_descuento
                })
        
        else:
            # Aplicar todas las acumulables
            for promo in promociones:
                if promo.es_acumulable:
                    desc = self._calcular_descuento_promo(promo, carrito)
                    descuento_total += desc
                    
                    if desc > 0:
                        promociones_aplicadas.append({
                            "nombre": promo.nombre,
                            "tipo": promo.tipo,
                            "descuento": desc
                        })
                    
                    # Manejar regalos
                    if promo.tipo == TipoPromo.REGALO:
                        regalo = self._get_regalo(promo)
                        if regalo:
                            items_regalo.append(regalo)
        
        # Calcular items con descuento distribuido
        for item in items_originales:
            precio_original = item["precio_unitario"] * item["cantidad"]
            proporcion = precio_original / carrito["total"] if carrito["total"] > 0 else 0
            descuento_item = descuento_total * proporcion
            
            items_con_descuento.append({
                "variant_id": str(item["variant_id"]),
                "cantidad": item["cantidad"],
                "precio_original": precio_original,
                "descuento": round(descuento_item, 2),
                "precio_final": round(precio_original - descuento_item, 2),
                "promociones": [p["nombre"] for p in promociones_aplicadas]
            })
        
        total_original = carrito["total"]
        total_final = total_original - descuento_total
        
        return DescuentoCalculado(
            promociones_aplicadas=promociones_aplicadas,
            descuento_total=round(descuento_total, 2),
            total_original=round(total_original, 2),
            total_final=round(total_final, 2),
            items_con_descuento=items_con_descuento,
            items_regalo=items_regalo
        )
    
    def _calcular_descuento_promo(
        self,
        promo: Promocion,
        carrito: Dict
    ) -> float:
        """
        Calcula el descuento de una promoción específica
        """
        accion = promo.accion
        tipo_accion = accion.get("tipo")
        
        total = carrito["total"]
        items = carrito["items"]
        
        if tipo_accion == "descuento_porcentaje":
            porcentaje = accion.get("valor", 0)
            return total * (porcentaje / 100)
        
        elif tipo_accion == "descuento_monto":
            return min(accion.get("valor", 0), total)
        
        elif tipo_accion == "tiered_pricing":
            # Descuento escalonado por cantidad
            cantidad_total = sum(item["cantidad"] for item in items)
            tiers = sorted(
                accion.get("tiers", []),
                key=lambda t: t["min_cantidad"],
                reverse=True
            )
            
            for tier in tiers:
                if cantidad_total >= tier["min_cantidad"]:
                    porcentaje = tier.get("descuento_porcentaje", 0)
                    return total * (porcentaje / 100)
            
            return 0.0
        
        elif tipo_accion in ["combo_2x1", "combo_3x2", "combo_nxm"]:
            # Combos: llevá N, pagá M
            # TODO: Implementar lógica más compleja
            return 0.0
        
        return 0.0
    
    def _get_regalo(self, promo: Promocion) -> Optional[Dict]:
        """
        Obtiene item de regalo si aplica
        """
        accion = promo.accion
        if accion.get("tipo") == "regalo":
            return {
                "variant_id": accion.get("producto_regalo_id"),
                "cantidad": accion.get("cantidad", 1),
                "es_regalo": True,
                "promo_nombre": promo.nombre
            }
        return None
    
    async def _count_customer_uses(
        self,
        promocion_id: UUID,
        cliente_id: UUID
    ) -> int:
        """
        Cuenta cuántas veces usó el cliente esta promo
        """
        result = await self.session.exec(
            select(func.count(PromocionUso.id))
            .where(
                and_(
                    PromocionUso.promocion_id == promocion_id,
                    PromocionUso.cliente_id == cliente_id
                )
            )
        )
        return result.first() or 0


from sqlalchemy import func
