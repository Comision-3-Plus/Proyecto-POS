"""
Verificar ventas en la base de datos
"""
import asyncio
from app.core.db import AsyncSessionLocal
from app.models import Venta
from sqlalchemy import select, func
from datetime import datetime, timedelta


async def verificar_ventas():
    async with AsyncSessionLocal() as db:
        # Total ventas
        result = await db.execute(select(func.count(Venta.id)))
        total = result.scalar()
        print(f"\n📊 TOTAL VENTAS EN DB: {total}")
        
        # Ventas de hoy
        hoy = datetime.now().date()
        result = await db.execute(
            select(Venta).where(func.date(Venta.fecha) == hoy)
        )
        ventas_hoy = result.scalars().all()
        print(f"📅 Ventas de hoy ({hoy}): {len(ventas_hoy)}")
        
        # Últimas 5 ventas
        result = await db.execute(
            select(Venta).order_by(Venta.fecha.desc()).limit(5)
        )
        ultimas = result.scalars().all()
        print(f"\n🔍 ÚLTIMAS 5 VENTAS:")
        for venta in ultimas:
            print(f"  - ID: {venta.id}")
            print(f"    Fecha: {venta.fecha}")
            print(f"    Total: ${venta.total:,.2f}")
            print(f"    Método: {venta.metodo_pago}")
            print(f"    Tienda: {venta.tienda_id}")
            print()


if __name__ == "__main__":
    asyncio.run(verificar_ventas())
