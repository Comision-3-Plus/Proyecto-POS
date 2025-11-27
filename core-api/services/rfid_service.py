"""
RFID Service - Checkout Masivo e Inventario Rápido
Integración con lectores RFID UHF
"""
from typing import List, Dict, Optional
from uuid import UUID
from datetime import datetime
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, func

from schemas_models.rfid_models import (
    RFIDTag,
    RFIDScanSession,
    RFIDScanItem,
    RFIDReader,
    RFIDInventoryDiscrepancy
)
from models import ProductVariant, InventoryLedger


class RFIDService:
    """
    Servicio de integración con lectores RFID
    
    Protocols supported:
    - LLRP (Low Level Reader Protocol) - Estándar ISO 24791
    - Impinj ItemSense
    - Zebra FX SDK
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def start_checkout_session(
        self,
        reader_id: str,
        usuario_id: UUID,
        tienda_id: UUID
    ) -> RFIDScanSession:
        """
        Inicia sesión de checkout RFID
        
        Flow:
        1. Cliente pone canasto en mostrador
        2. Cajero activa lector
        3. Lector detecta todos los tags en <1 segundo
        4. Sistema carga todos los items al carrito
        """
        session = RFIDScanSession(
            tienda_id=tienda_id,
            tipo="checkout",
            usuario_id=usuario_id,
            reader_id=reader_id,
            inicio=datetime.utcnow()
        )
        
        self.session.add(session)
        await self.session.commit()
        await self.session.refresh(session)
        
        return session
    
    async def process_bulk_scan(
        self,
        session_id: UUID,
        epc_list: List[str],
        rssi_values: Optional[List[int]] = None
    ) -> Dict:
        """
        Procesa escaneo masivo de tags
        
        Args:
            session_id: ID de la sesión de escaneo
            epc_list: Lista de EPCs detectados
            rssi_values: Valores de señal (opcional)
        
        Returns:
            Resumen con items detectados y totales
        """
        session_obj = await self.session.get(RFIDScanSession, session_id)
        if not session_obj:
            raise ValueError("Sesión no encontrada")
        
        # Eliminar duplicados
        epc_unique = list(set(epc_list))
        
        items_detectados = []
        total_precio = 0.0
        tags_no_encontrados = []
        
        for i, epc in enumerate(epc_unique):
            rssi = rssi_values[i] if rssi_values and i < len(rssi_values) else None
            
            # Buscar tag en BD
            result = await self.session.exec(
                select(RFIDTag)
                .where(
                    and_(
                        RFIDTag.epc == epc,
                        RFIDTag.estado == "active"
                    )
                )
            )
            tag = result.first()
            
            if not tag:
                tags_no_encontrados.append(epc)
                continue
            
            # Registrar item escaneado
            scan_item = RFIDScanItem(
                session_id=session_id,
                epc=epc,
                variant_id=tag.variant_id,
                rssi=rssi,
                detectado_en=datetime.utcnow()
            )
            self.session.add(scan_item)
            
            # Obtener variante y precio
            variant = await self.session.get(ProductVariant, tag.variant_id)
            if variant:
                items_detectados.append({
                    "epc": epc,
                    "variant_id": str(tag.variant_id),
                    "sku": variant.sku,
                    "product_name": variant.product.name if variant.product else "Unknown",
                    "size": variant.size.name if variant.size else None,
                    "color": variant.color.name if variant.color else None,
                    "price": variant.price,
                    "rssi": rssi
                })
                total_precio += variant.price
        
        # Actualizar estadísticas de la sesión
        session_obj.tags_escaneados = len(epc_list)
        session_obj.tags_unicos = len(epc_unique)
        
        await self.session.commit()
        
        return {
            "session_id": str(session_id),
            "total_tags_escaneados": len(epc_list),
            "tags_unicos": len(epc_unique),
            "items_detectados": items_detectados,
            "total_items": len(items_detectados),
            "total_precio": round(total_precio, 2),
            "tags_no_encontrados": tags_no_encontrados,
            "scan_time_ms": len(epc_list) * 50  # Estimado: 50ms por tag
        }
    
    async def complete_checkout_session(
        self,
        session_id: UUID,
        venta_id: UUID
    ):
        """
        Finaliza sesión de checkout y marca tags como vendidos
        """
        session_obj = await self.session.get(RFIDScanSession, session_id)
        if not session_obj:
            raise ValueError("Sesión no encontrada")
        
        session_obj.fin = datetime.utcnow()
        session_obj.venta_id = venta_id
        session_obj.duracion_segundos = (
            session_obj.fin - session_obj.inicio
        ).total_seconds()
        
        # Marcar todos los tags como vendidos
        result = await self.session.exec(
            select(RFIDScanItem)
            .where(RFIDScanItem.session_id == session_id)
        )
        scan_items = result.all()
        
        for scan_item in scan_items:
            tag = await self.session.exec(
                select(RFIDTag)
                .where(RFIDTag.epc == scan_item.epc)
            )
            tag_obj = tag.first()
            if tag_obj:
                tag_obj.estado = "sold"
                tag_obj.venta_id = venta_id
                tag_obj.fecha_venta = datetime.utcnow()
        
        await self.session.commit()
    
    async def start_inventory_session(
        self,
        reader_id: str,
        location_id: UUID,
        usuario_id: UUID,
        tienda_id: UUID
    ) -> RFIDScanSession:
        """
        Inicia sesión de inventario RFID
        
        Flow:
        1. Usuario toma raqueta RFID
        2. Camina por todo el local/depósito
        3. Raqueta lee todos los tags
        4. Sistema compara con inventory ledger
        5. Detecta discrepancias
        """
        session = RFIDScanSession(
            tienda_id=tienda_id,
            tipo="inventory",
            usuario_id=usuario_id,
            reader_id=reader_id,
            location_id=location_id,
            inicio=datetime.utcnow()
        )
        
        self.session.add(session)
        await self.session.commit()
        await self.session.refresh(session)
        
        return session
    
    async def analyze_inventory_discrepancies(
        self,
        session_id: UUID
    ) -> List[Dict]:
        """
        Analiza discrepancias entre RFID y sistema
        
        Returns:
            Lista de discrepancias detectadas
        """
        session_obj = await self.session.get(RFIDScanSession, session_id)
        if not session_obj or session_obj.tipo != "inventory":
            raise ValueError("Sesión inválida o no es de inventario")
        
        if not session_obj.location_id:
            raise ValueError("Sesión de inventario debe tener location_id")
        
        # 1. Obtener todos los tags escaneados
        result = await self.session.exec(
            select(RFIDScanItem)
            .where(RFIDScanItem.session_id == session_id)
        )
        scan_items = result.all()
        
        # Contar por variante
        scanned_counts = {}
        for item in scan_items:
            if item.variant_id:
                scanned_counts[item.variant_id] = scanned_counts.get(item.variant_id, 0) + 1
        
        # 2. Comparar con inventory ledger
        discrepancies = []
        
        for variant_id, qty_fisica in scanned_counts.items():
            # Obtener cantidad del sistema
            qty_sistema = await self._get_system_stock(
                variant_id,
                session_obj.location_id
            )
            
            # Si hay diferencia, registrar
            if qty_sistema != qty_fisica:
                discrepancy = RFIDInventoryDiscrepancy(
                    tienda_id=session_obj.tienda_id,
                    session_id=session_id,
                    variant_id=variant_id,
                    location_id=session_obj.location_id,
                    cantidad_sistema=qty_sistema,
                    cantidad_fisica=qty_fisica,
                    diferencia=qty_fisica - qty_sistema
                )
                self.session.add(discrepancy)
                
                # Obtener variante para el reporte
                variant = await self.session.get(ProductVariant, variant_id)
                
                discrepancies.append({
                    "variant_id": str(variant_id),
                    "sku": variant.sku if variant else "Unknown",
                    "product_name": variant.product.name if variant and variant.product else "Unknown",
                    "cantidad_sistema": qty_sistema,
                    "cantidad_fisica": qty_fisica,
                    "diferencia": qty_fisica - qty_sistema,
                    "tipo": "faltante" if qty_fisica < qty_sistema else "sobrante"
                })
        
        await self.session.commit()
        
        return discrepancies
    
    async def _get_system_stock(
        self,
        variant_id: UUID,
        location_id: UUID
    ) -> int:
        """
        Obtiene stock del sistema para una variante en una ubicación
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
        return int(stock) if stock else 0
    
    async def encode_tag(
        self,
        variant_id: UUID,
        epc: str,
        location_id: UUID,
        tienda_id: UUID
    ) -> RFIDTag:
        """
        Registra un tag RFID recién encodificado
        
        Se usa cuando:
        - Llega stock nuevo y hay que encodificar tags
        - Se reemplaza un tag dañado
        """
        tag = RFIDTag(
            tienda_id=tienda_id,
            epc=epc,
            variant_id=variant_id,
            location_id=location_id,
            estado="active"
        )
        
        self.session.add(tag)
        await self.session.commit()
        
        return tag
    
    def generate_epc_sgtin96(
        self,
        company_prefix: str,
        item_reference: str,
        serial_number: int
    ) -> str:
        """
        Genera EPC en formato SGTIN-96
        
        Args:
            company_prefix: GS1 company prefix (7-12 dígitos)
            item_reference: Item reference (1-6 dígitos)
            serial_number: Número serial único (0-274877906943)
        
        Returns:
            EPC en hexadecimal (24 caracteres)
        """
        # Header SGTIN-96 = 0x30
        # Filter = 0x3 (retail item)
        # Partition = 0x6 (company prefix 7 dígitos, item ref 5 dígitos)
        
        #Simple implementation - para producción usar librería sgtin
        epc_hex = f"30{company_prefix}{item_reference}{serial_number:012X}"
        return epc_hex[:24]
