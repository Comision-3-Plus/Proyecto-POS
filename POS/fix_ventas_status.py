"""
Actualizar status_pago de ventas existentes
"""
import asyncio
from app.core.db import AsyncSessionLocal
from app.models import Venta
from sqlalchemy import select, update


async def actualizar_ventas():
    async with AsyncSessionLocal() as db:
        # Actualizar todas las ventas pendientes a pagado
        result = await db.execute(
            update(Venta)
            .where(Venta.status_pago == "pendiente")
            .values(status_pago="pagado")
        )
        await db.commit()
        
        print(f"✅ Actualizadas {result.rowcount} ventas a status_pago='pagado'")
        
        # Verificar
        result = await db.execute(select(Venta))
        ventas = result.scalars().all()
        
        print(f"\n📊 RESUMEN:")
        pagadas = sum(1 for v in ventas if v.status_pago == "pagado")
        pendientes = sum(1 for v in ventas if v.status_pago == "pendiente")
        
        print(f"  Pagadas: {pagadas}")
        print(f"  Pendientes: {pendientes}")
        print(f"  Total: {len(ventas)}")


if __name__ == "__main__":
    asyncio.run(actualizar_ventas())
