"""
Loyalty Service - Gestión de Puntos y Gift Cards
Sistema unificado cross-channel
"""
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, func
import secrets

from schemas_models.loyalty_models import (
    CustomerWallet,
    WalletTransaction,
    GiftCard,
    GiftCardUso,
    LoyaltyProgram,
    TipoTransaccionWallet
)


class LoyaltyService:
    """
    Servicio de fidelización omnicanal
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_or_create_wallet(
        self,
        cliente_id: UUID,
        tienda_id: UUID
    ) -> CustomerWallet:
        """
        Obtiene o crea wallet del cliente
        """
        result = await self.session.exec(
            select(CustomerWallet)
            .where(CustomerWallet.cliente_id == cliente_id)
        )
        wallet = result.first()
        
        if not wallet:
            # Crear wallet y dar puntos de bienvenida
            program = await self._get_loyalty_program(tienda_id)
            
            wallet = CustomerWallet(
                tienda_id=tienda_id,
                cliente_id=cliente_id,
                puntos_disponibles=program.puntos_bienvenida if program else 0,
                puntos_lifetime=program.puntos_bienvenida if program else 0,
                tier="bronze"
            )
            self.session.add(wallet)
            await self.session.flush()
            
            # Registrar transacción de bienvenida
            if program and program.puntos_bienvenida > 0:
                await self._register_transaction(
                    wallet_id=wallet.id,
                    tipo=TipoTransaccionWallet.REGALO,
                    puntos_delta=program.puntos_bienvenida,
                    canal="sistema",
                    descripcion=f"¡Bienvenido! Ganaste {program.puntos_bienvenida} puntos"
                )
        
        return wallet
    
    async def acumular_puntos(
        self,
        cliente_id: UUID,
        tienda_id: UUID,
        monto_compra: float,
        venta_id: UUID,
        canal: str
    ) -> int:
        """
        Acumula puntos por una compra
        
        Returns:
            Puntos ganados
        """
        program = await self._get_loyalty_program(tienda_id)
        if not program or not program.es_activo:
            return 0
        
        wallet = await self.get_or_create_wallet(cliente_id, tienda_id)
        
        # Calcular puntos
        puntos_base = int(monto_compra * program.tasa_acumulacion)
        
        # Aplicar multiplicador del tier
        multiplicador = await self._get_tier_multiplier(wallet.tier, program)
        puntos_ganados = int(puntos_base * multiplicador)
        
        # Actualizar wallet
        wallet.puntos_disponibles += puntos_ganados
        wallet.puntos_lifetime += puntos_ganados
        
        # Verificar upgrade de tier
        await self._check_tier_upgrade(wallet, program)
        
        # Registrar transacción
        await self._register_transaction(
            wallet_id=wallet.id,
            tipo=TipoTransaccionWallet.ACUMULACION_COMPRA,
            puntos_delta=puntos_ganados,
            canal=canal,
            descripcion=f"Ganaste {puntos_ganados} puntos por compra de ${monto_compra:,.0f}",
            venta_id=venta_id
        )
        
        await self.session.commit()
        
        return puntos_ganados
    
    async def canjear_puntos(
        self,
        cliente_id: UUID,
        puntos_a_canjear: int,
        venta_id: UUID,
        canal: str
    ) -> float:
        """
        Canjea puntos por descuento
        
        Returns:
            Monto en pesos del descuento
        """
        wallet = await self.session.exec(
            select(CustomerWallet)
            .where(CustomerWallet.cliente_id == cliente_id)
        ).first()
        
        if not wallet:
            raise ValueError("Cliente no tiene wallet")
        
        if wallet.puntos_disponibles < puntos_a_canjear:
            raise ValueError(
                f"Puntos insuficientes. Tiene: {wallet.puntos_disponibles}, "
                f"necesita: {puntos_a_canjear}"
            )
        
        # Calcular valor en pesos
        valor_descuento = puntos_a_canjear * wallet.valor_punto
        
        # Descontar puntos
        wallet.puntos_disponibles -= puntos_a_canjear
        
        # Registrar transacción
        await self._register_transaction(
            wallet_id=wallet.id,
            tipo=TipoTransaccionWallet.CANJE_PUNTOS,
            puntos_delta=-puntos_a_canjear,
            canal=canal,
           descripcion=f"Canjeaste {puntos_a_canjear} puntos = ${valor_descuento:,.0f}",
            venta_id=venta_id
        )
        
        await self.session.commit()
        
        return valor_descuento
    
    async def crear_gift_card(
        self,
        tienda_id: UUID,
        monto: float,
        cliente_id: Optional[UUID] = None,
        canal: str = "online",
        venta_id: Optional[UUID] = None,
        es_regalo: bool = False,
        destinatario_email: Optional[str] = None,
        mensaje: Optional[str] = None,
        dias_validez: Optional[int] = None
    ) -> GiftCard:
        """
        Crea una nueva gift card
        """
        # Generar código único
        codigo = self._generate_gift_card_code()
        
        # Calcular expiración
        expiracion = None
        if dias_validez:
            expiracion = datetime.utcnow() + timedelta(days=dias_validez)
        
        gift_card = GiftCard(
            tienda_id=tienda_id,
            codigo=codigo,
            cliente_id=cliente_id,
            monto_original=monto,
            monto_actual=monto,
            canal_compra=canal,
            venta_origen_id=venta_id,
            es_regalo=es_regalo,
            destinatario_email=destinatario_email,
            mensaje_regalo=mensaje,
            fecha_expiracion=expiracion
        )
        
        self.session.add(gift_card)
        
        # Si el cliente tiene wallet, sumar al balance
        if cliente_id:
            wallet = await self.get_or_create_wallet(cliente_id, tienda_id)
            wallet.gift_cards_balance += monto
        
        await self.session.commit()
        
        return gift_card
    
    async def usar_gift_card(
        self,
        codigo: str,
        monto_a_usar: float,
        venta_id: UUID,
        canal: str
    ) -> GiftCard:
        """
        Usa una gift card para pagar (parcial o total)
        
        Returns:
            GiftCard actualizada
        """
        # Buscar gift card
        result = await self.session.exec(
            select(GiftCard)
            .where(
                and_(
                    GiftCard.codigo == codigo,
                    GiftCard.estado == "active"
                )
            )
        )
        gift_card = result.first()
        
        if not gift_card:
            raise ValueError("Gift card no encontrada o inactiva")
        
        # Verificar expiración
        if gift_card.fecha_expiracion and gift_card.fecha_expiracion < datetime.utcnow():
            gift_card.estado = "expired"
            await self.session.commit()
            raise ValueError("Gift card expirada")
        
        # Verificar saldo
        if gift_card.monto_actual < monto_a_usar:
            raise ValueError(
                f"Saldo insuficiente. Disponible: ${gift_card.monto_actual:,.0f}"
            )
        
        # Descontar monto
        gift_card.monto_actual -= monto_a_usar
        
        # Si se agotó, marcar como canjeada
        if gift_card.monto_actual <= 0:
            gift_card.estado = "redeemed"
        
        # Registrar uso
        uso = GiftCardUso(
            gift_card_id=gift_card.id,
            venta_id=venta_id,
            monto_usado=monto_a_usar,
            monto_restante=gift_card.monto_actual,
            canal=canal
        )
        self.session.add(uso)
        
        # Actualizar wallet balance si tiene cliente
        if gift_card.cliente_id:
            wallet = await self.session.exec(
                select(CustomerWallet)
                .where(CustomerWallet.cliente_id == gift_card.cliente_id)
            ).first()
            
            if wallet:
                wallet.gift_cards_balance -= monto_a_usar
        
        await self.session.commit()
        
        return gift_card
    
    async def _get_loyalty_program(
        self,
        tienda_id: UUID
    ) -> Optional[LoyaltyProgram]:
        """
        Obtiene configuración del programa de fidelidad
        """
        result = await self.session.exec(
            select(LoyaltyProgram)
            .where(LoyaltyProgram.tienda_id == tienda_id)
        )
        return result.first()
    
    async def _get_tier_multiplier(
        self,
        tier: str,
        program: LoyaltyProgram
    ) -> float:
        """
        Obtiene multiplicador del tier
        """
        if not program.tiers:
            return 1.0
        
        tier_config = program.tiers.get(tier, {})
        return tier_config.get("multiplicador", 1.0)
    
    async def _check_tier_upgrade(
        self,
        wallet: CustomerWallet,
        program: LoyaltyProgram
    ):
        """
        Verifica si el cliente debe subir de tier
        """
        if not program.tiers:
            return
        
        # Buscar el tier más alto que califica
        nuevo_tier = wallet.tier
        for tier_name, tier_config in program.tiers.items():
            min_puntos = tier_config.get("min_puntos", 0)
            if wallet.puntos_lifetime >= min_puntos:
                if not nuevo_tier or min_puntos > program.tiers.get(nuevo_tier, {}).get("min_puntos", 0):
                    nuevo_tier = tier_name
        
        # Actualizar si cambió
        if nuevo_tier != wallet.tier:
            wallet.tier = nuevo_tier
            wallet.tier_desde = datetime.utcnow()
    
    async def _register_transaction(
        self,
        wallet_id: UUID,
        tipo: TipoTransaccionWallet,
        puntos_delta: int,
        canal: str,
        descripcion: str,
        venta_id: Optional[UUID] = None
    ):
        """
        Registra una transacción en la wallet
        """
        transaction = WalletTransaction(
            wallet_id=wallet_id,
            tipo=tipo,
            puntos_delta=puntos_delta,
            canal=canal,
            descripcion=descripcion,
            venta_id=venta_id
        )
        self.session.add(transaction)
    
    def _generate_gift_card_code(self) -> str:
        """
        Genera código único de gift card
        Formato: GC-XXXX-YYYY-ZZZZ
        """
        part1 = secrets.token_hex(2).upper()
        part2 = secrets.token_hex(2).upper()
        part3 = secrets.token_hex(2).upper()
        
        return f"GC-{part1}-{part2}-{part3}"
