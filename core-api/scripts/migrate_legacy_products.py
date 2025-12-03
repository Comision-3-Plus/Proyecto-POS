"""
Script de Migración de Productos Legacy → Product/ProductVariant
Migra productos del modelo antiguo al nuevo sistema con inventory ledger
"""
import asyncio
import sys
from pathlib import Path
from uuid import UUID
from typing import Optional, Dict, Any
from datetime import datetime

# Agregar path del core-api para imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from schemas_models.retail_models import ProductoLegacy
from models import (
    Product,
    ProductVariant,
    Size,
    Color,
    InventoryLedger,
    Location,
    Tienda
)
from utils.sku_generator import (
    SKUGenerator,
    BarcodeGenerator,
    auto_generate_sku_for_variant,
    auto_generate_barcode_for_variant
)


class ProductMigrator:
    """
    Migrador de productos legacy a nuevo sistema
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.migrated_count = 0
        self.error_count = 0
        self.errors = []
    
    async def migrate_all_for_tienda(
        self,
        tienda_id: UUID,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Migra todos los productos de una tienda
        
        Args:
            tienda_id: ID de la tienda
            dry_run: Si es True, solo simula sin guardar
        
        Returns:
            {
                "migrated": 50,
                "errors": 2,
                "error_details": [...]
            }
        """
        print(f"\n{'='*60}")
        print(f"MIGRACIÓN DE PRODUCTOS - Tienda {tienda_id}")
        print(f"Modo: {'DRY RUN (simulación)' if dry_run else 'REAL (guardará en DB)'}")
        print(f"{'='*60}\n")
        
        # Obtener tienda
        tienda = await self.session.get(Tienda, tienda_id)
        if not tienda:
            raise ValueError(f"Tienda {tienda_id} no encontrada")
        
        print(f"📦 Tienda: {tienda.nombre}")
        
        # Obtener default location
        default_location = await self._get_or_create_default_location(tienda_id, dry_run)
        print(f"📍 Ubicación default: {default_location.name}")
        
        # Buscar productos legacy no migrados
        result = await self.session.exec(
            select(ProductoLegacy)
            .where(
                ProductoLegacy.tienda_id == tienda_id,
                ProductoLegacy.is_migrated == False
            )
        )
        productos_legacy = result.all()
        
        total = len(productos_legacy)
        print(f"\n🔍 Encontrados {total} productos legacy sin migrar\n")
        
        if total == 0:
            print("✅ No hay productos para migrar")
            return {"migrated": 0, "errors": 0, "error_details": []}
        
        # Migrar uno por uno
        for i, producto_legacy in enumerate(productos_legacy, 1):
            print(f"[{i}/{total}] Migrando: {producto_legacy.nombre} (SKU: {producto_legacy.sku})")
            
            try:
                await self._migrate_single_product(
                    producto_legacy=producto_legacy,
                    default_location=default_location,
                    dry_run=dry_run
                )
                self.migrated_count += 1
                print(f"  ✅ Migrado exitosamente")
                
            except Exception as e:
                self.error_count += 1
                error_msg = f"Error en {producto_legacy.nombre}: {str(e)}"
                self.errors.append(error_msg)
                print(f"  ❌ ERROR: {e}")
        
        # Commit final si no es dry run
        if not dry_run:
            await self.session.commit()
            print(f"\n💾 Cambios guardados en base de datos")
        else:
            await self.session.rollback()
            print(f"\n🔄 Rollback ejecutado (dry run)")
        
        # Resumen
        print(f"\n{'='*60}")
        print(f"RESUMEN DE MIGRACIÓN")
        print(f"{'='*60}")
        print(f"✅ Migrados exitosamente: {self.migrated_count}")
        print(f"❌ Errores: {self.error_count}")
        
        if self.errors:
            print(f"\nDetalles de errores:")
            for error in self.errors:
                print(f"  - {error}")
        
        return {
            "migrated": self.migrated_count,
            "errors": self.error_count,
            "error_details": self.errors
        }
    
    async def _get_or_create_default_location(
        self,
        tienda_id: UUID,
        dry_run: bool
    ) -> Location:
        """
        Obtiene o crea ubicación default de la tienda
        """
        result = await self.session.exec(
            select(Location)
            .where(
                Location.tienda_id == tienda_id,
                Location.is_default == True
            )
        )
        location = result.first()
        
        if not location:
            # Crear ubicación default
            location = Location(
                tienda_id=tienda_id,
                name="Sucursal Principal",
                type="STORE",
                is_default=True
            )
            
            if not dry_run:
                self.session.add(location)
                await self.session.flush()
        
        return location
    
    async def _migrate_single_product(
        self,
        producto_legacy: ProductoLegacy,
        default_location: Location,
        dry_run: bool
    ):
        """
        Migra un producto legacy individual
        
        Estrategia:
        1. Crear Product (padre)
        2. Extraer variantes de atributos JSONB
        3. Crear ProductVariant(s)
        4. Crear stock inicial en InventoryLedger
        5. Marcar producto_legacy como migrado
        """
        
        # 1. Crear Product padre
        product = Product(
            tienda_id=producto_legacy.tienda_id,
            name=producto_legacy.nombre,
            base_sku=producto_legacy.sku,
            description=producto_legacy.descripcion,
            category=producto_legacy.tipo,  # "ropa", "general", etc.
            is_active=producto_legacy.is_active
        )
        
        if not dry_run:
            self.session.add(product)
            await self.session.flush()  # Para obtener product_id
        
        # 2. Extraer variantes de atributos
        # Si es producto de ropa con atributos (color/talle), crear múltiples variantes
        # Sino, crear una sola variante
        
        atributos = producto_legacy.atributos or {}
        
        if producto_legacy.tipo == "ropa" and ("colores" in atributos or "talles" in atributos):
            # Producto con variantes
            await self._create_variants_from_attributes(
                product=product,
                producto_legacy=producto_legacy,
                atributos=atributos,
                default_location=default_location,
                dry_run=dry_run
            )
        else:
            # Producto simple (sin variantes)
            await self._create_single_variant(
                product=product,
                producto_legacy=producto_legacy,
                default_location=default_location,
                dry_run=dry_run
            )
        
        # 3. Marcar como migrado
        if not dry_run:
            producto_legacy.is_migrated = True
            producto_legacy.migrated_to_product_id = product.product_id
            producto_legacy.migration_notes = f"Migrado automáticamente el {datetime.utcnow()}"
    
    async def _create_single_variant(
        self,
        product: Product,
        producto_legacy: ProductoLegacy,
        default_location: Location,
        dry_run: bool
    ):
        """
        Crea una única variante para producto simple
        """
        variant = ProductVariant(
            product_id=product.product_id,
            tienda_id=product.tienda_id,
            sku=producto_legacy.sku,  # Mismo SKU
            size_id=None,
            color_id=None,
            price=producto_legacy.precio_venta,
            barcode=None,  # Auto-generar si no tiene
            is_active=producto_legacy.is_active
        )
        
        if not dry_run:
            self.session.add(variant)
            await self.session.flush()
            
            # Auto-generar barcode si no tiene
            if not variant.barcode:
                variant.barcode = auto_generate_barcode_for_variant(
                    variant.variant_id,
                    variant.tienda_id
                )
            
            # Crear stock inicial en ledger
            await self._create_initial_stock(
                variant=variant,
                stock_quantity=producto_legacy.stock_actual,
                location=default_location
            )
    
    async def _create_variants_from_attributes(
        self,
        product: Product,
        producto_legacy: ProductoLegacy,
        atributos: Dict,
        default_location: Location,
        dry_run: bool
    ):
        """
        Crea variantes desde atributos JSONB
        
        Ejemplo atributos:
        {
            "colores": ["Rojo", "Azul", "Negro"],
            "talles": ["S", "M", "L", "XL"]
        }
        """
        colores = atributos.get("colores", [])
        talles = atributos.get("talles", [])
        
        # Si no hay colores ni talles, crear una sola variante
        if not colores and not talles:
            await self._create_single_variant(
                product, producto_legacy, default_location, dry_run
            )
            return
        
        # Distribuir stock entre variantes (simplificado: equitativo)
        total_variants = max(len(colores), 1) * max(len(talles), 1)
        stock_per_variant = int(producto_legacy.stock_actual / total_variants)
        
        # Crear variantes combinadas
        if colores and talles:
            # Producto con color Y talle
            for color_name in colores:
                color = await self._get_or_create_color(
                    tienda_id=product.tienda_id,
                    color_name=color_name,
                    dry_run=dry_run
                )
                
                for talle_name in talles:
                    size = await self._get_or_create_size(
                        tienda_id=product.tienda_id,
                        size_name=talle_name,
                        dry_run=dry_run
                    )
                    
                    await self._create_variant_with_dims(
                        product, producto_legacy, color, size,
                        stock_per_variant, default_location, dry_run
                    )
        
        elif colores:
            # Solo colores
            for color_name in colores:
                color = await self._get_or_create_color(
                    product.tienda_id, color_name, dry_run
                )
                await self._create_variant_with_dims(
                    product, producto_legacy, color, None,
                    stock_per_variant, default_location, dry_run
                )
        
        elif talles:
            # Solo talles
            for talle_name in talles:
                size = await self._get_or_create_size(
                    product.tienda_id, talle_name, dry_run
                )
                await self._create_variant_with_dims(
                    product, producto_legacy, None, size,
                    stock_per_variant, default_location, dry_run
                )
    
    async def _create_variant_with_dims(
        self,
        product: Product,
        producto_legacy: ProductoLegacy,
        color: Optional[Color],
        size: Optional[Size],
        stock: float,
        location: Location,
        dry_run: bool
    ):
        """Crea variante con dimensiones específicas"""
        
        # Generar SKU
        sku = auto_generate_sku_for_variant(
            product.base_sku,
            color.name if color else None,
            size.name if size else None
        )
        
        variant = ProductVariant(
            product_id=product.product_id,
            tienda_id=product.tienda_id,
            sku=sku,
            size_id=size.id if size else None,
            color_id=color.id if color else None,
            price=producto_legacy.precio_venta,
            is_active=True
        )
        
        if not dry_run:
            self.session.add(variant)
            await self.session.flush()
            
            # Generar barcode
            variant.barcode = auto_generate_barcode_for_variant(
                variant.variant_id,
                variant.tienda_id
            )
            
            # Stock inicial
            await self._create_initial_stock(variant, stock, location)
    
    async def _get_or_create_color(
        self,
        tienda_id: UUID,
        color_name: str,
        dry_run: bool
    ) -> Color:
        """Obtiene o crea un color"""
        result = await self.session.exec(
            select(Color)
            .where(
                Color.tienda_id == tienda_id,
                Color.name == color_name
            )
        )
        color = result.first()
        
        if not color:
            color = Color(
                tienda_id=tienda_id,
                name=color_name
            )
            if not dry_run:
                self.session.add(color)
                await self.session.flush()
        
        return color
    
    async def _get_or_create_size(
        self,
        tienda_id: UUID,
        size_name: str,
        dry_run: bool
    ) -> Size:
        """Obtiene o crea un talle"""
        result = await self.session.exec(
            select(Size)
            .where(
                Size.tienda_id == tienda_id,
                Size.name == size_name
            )
        )
        size = result.first()
        
        if not size:
            size = Size(
                tienda_id=tienda_id,
                name=size_name
            )
            if not dry_run:
                self.session.add(size)
                await self.session.flush()
        
        return size
    
    async def _create_initial_stock(
        self,
        variant: ProductVariant,
        stock_quantity: float,
        location: Location
    ):
        """Crea transacción inicial en inventory ledger"""
        if stock_quantity > 0:
            ledger_entry = InventoryLedger(
                tienda_id=variant.tienda_id,
                variant_id=variant.variant_id,
                location_id=location.location_id,
                delta=stock_quantity,  # Positivo = entrada
                transaction_type="INITIAL_STOCK",
                reference_doc=None,
                notes="Migración automática desde producto legacy"
            )
            self.session.add(ledger_entry)


async def main():
    """
    Script principal de migración
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrar productos legacy a nuevo sistema")
    parser.add_argument("tienda_id", help="UUID de la tienda a migrar")
    parser.add_argument("--dry-run", action="store_true", help="Simular sin guardar")
    
    args = parser.parse_args()
    
    try:
        tienda_id = UUID(args.tienda_id)
    except ValueError:
        print(f"❌ Error: '{args.tienda_id}' no es un UUID válido")
        return
    
    # Obtener sesión de DB
    async for session in get_session():
        migrator = ProductMigrator(session)
        
        result = await migrator.migrate_all_for_tienda(
            tienda_id=tienda_id,
            dry_run=args.dry_run
        )
        
        print(f"\n✅ Migración completada")
        print(f"   Migrados: {result['migrated']}")
        print(f"   Errores: {result['errors']}")
        
        break  # Solo usar primera sesión


if __name__ == "__main__":
    asyncio.run(main())
