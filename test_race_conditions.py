"""
🏎️ NEXUS POS - RACE CONDITION TESTER
Script especializado para detectar overselling en escenarios concurrentes
"""
import asyncio
import httpx
from uuid import uuid4
from colorama import Fore, Style, init

init(autoreset=True)


class RaceConditionTester:
    """Tester especializado en race conditions"""
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.api_url = f"{base_url}/api/v1"
        self.token = None
    
    async def run(self):
        """Ejecutar test de race condition"""
        print(f"\n{Fore.CYAN}{'='*80}")
        print("🏎️ RACE CONDITION TESTER - Hot Sale Simulator")
        print(f"{'='*80}{Style.RESET_ALL}\n")
        
        # Login
        await self.login()
        
        if not self.token:
            print(f"{Fore.RED}❌ No se pudo autenticar{Style.RESET_ALL}")
            return
        
        # Test 1: Stock = 1, 2 compradores
        print(f"{Fore.YELLOW}Test 1: Stock = 1, 2 compradores concurrentes{Style.RESET_ALL}")
        await self.test_race_condition(stock=1, buyers=2)
        
        # Test 2: Stock = 5, 10 compradores
        print(f"\n{Fore.YELLOW}Test 2: Stock = 5, 10 compradores concurrentes{Style.RESET_ALL}")
        await self.test_race_condition(stock=5, buyers=10)
        
        # Test 3: Stock = 100, 200 compradores (stress)
        print(f"\n{Fore.YELLOW}Test 3: Stock = 100, 200 compradores concurrentes (STRESS){Style.RESET_ALL}")
        await self.test_race_condition(stock=100, buyers=200)
        
        print(f"\n{Fore.CYAN}{'='*80}")
        print("✅ Race Condition Testing Completado")
        print(f"{'='*80}{Style.RESET_ALL}\n")
    
    async def login(self):
        """Login"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/auth/login",
                    json={"email": "admin@nexuspos.com", "password": "admin123"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    self.token = response.json()["access_token"]
                    print(f"{Fore.GREEN}✅ Login exitoso{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}❌ Login error: {e}{Style.RESET_ALL}")
    
    async def test_race_condition(self, stock: int, buyers: int):
        """
        Test de race condition
        
        Args:
            stock: Stock inicial del producto
            buyers: Cantidad de compradores concurrentes
        """
        # 1. Crear producto
        producto_id = await self.create_product(stock)
        
        if not producto_id:
            print(f"{Fore.RED}❌ No se pudo crear producto{Style.RESET_ALL}")
            return
        
        print(f"  📦 Producto creado: ID={producto_id}, Stock={stock}")
        
        # 2. Simular compradores concurrentes
        tasks = [self.buy_product(producto_id) for _ in range(buyers)]
        
        print(f"  🏃 Lanzando {buyers} compradores concurrentes...")
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 3. Analizar resultados
        success_count = sum(1 for r in results if isinstance(r, dict) and r.get("status") == 200)
        conflict_count = sum(1 for r in results if isinstance(r, dict) and r.get("status") == 409)
        error_count = sum(1 for r in results if isinstance(r, Exception) or (isinstance(r, dict) and r.get("status") not in [200, 409]))
        
        # 4. Validar stock final
        stock_final = await self.get_product_stock(producto_id)
        
        # 5. Reporte
        print(f"\n  📊 Resultados:")
        print(f"     • Ventas exitosas: {success_count}")
        print(f"     • Conflictos (sin stock): {conflict_count}")
        print(f"     • Errores: {error_count}")
        print(f"     • Stock inicial: {stock}")
        print(f"     • Stock final: {stock_final}")
        
        # 6. Validación
        if success_count == stock and stock_final == 0:
            print(f"\n  {Fore.GREEN}✅ CORRECTO: Se vendieron exactamente {stock} unidades{Style.RESET_ALL}")
            print(f"  {Fore.GREEN}✅ Stock final es 0{Style.RESET_ALL}")
        elif success_count > stock:
            print(f"\n  {Fore.RED}❌ CRÍTICO: OVERSELLING detectado!{Style.RESET_ALL}")
            print(f"  {Fore.RED}❌ Se vendieron {success_count} pero solo había {stock}{Style.RESET_ALL}")
        elif success_count < stock and conflict_count > 0:
            print(f"\n  {Fore.YELLOW}⚠️  ADVERTENCIA: Solo se vendieron {success_count}/{stock}{Style.RESET_ALL}")
            print(f"  {Fore.YELLOW}⚠️  Posible timeout o error en algunos requests{Style.RESET_ALL}")
        
        if stock_final != (stock - success_count):
            print(f"\n  {Fore.RED}❌ INCONSISTENCIA: Stock final esperado {stock - success_count}, actual {stock_final}{Style.RESET_ALL}")
    
    async def create_product(self, stock: int) -> str:
        """Crear producto con stock específico"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/productos",
                    headers={"Authorization": f"Bearer {self.token}"},
                    json={
                        "nombre": f"Race Test {uuid4().hex[:8]}",
                        "precio": 1000.0,
                        "stock": stock,
                        "codigo": f"RACE-{uuid4().hex[:6]}"
                    },
                    timeout=10.0
                )
                
                if response.status_code in [200, 201]:
                    return response.json()["id"]
        except Exception as e:
            print(f"{Fore.RED}Error creando producto: {e}{Style.RESET_ALL}")
        
        return None
    
    async def buy_product(self, producto_id: str) -> dict:
        """Intentar comprar 1 unidad"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/ventas/checkout",
                    headers={"Authorization": f"Bearer {self.token}"},
                    json={
                        "items": [
                            {
                                "producto_id": producto_id,
                                "cantidad": 1,
                                "precio_unitario": 1000.0
                            }
                        ],
                        "metodo_pago": "efectivo",
                        "total": 1000.0
                    },
                    timeout=10.0
                )
                
                return {"status": response.status_code}
        
        except httpx.HTTPStatusError as e:
            return {"status": e.response.status_code}
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def get_product_stock(self, producto_id: str) -> int:
        """Obtener stock actual del producto"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/productos/{producto_id}",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()["stock"]
        except Exception:
            pass
        
        return -1


async def main():
    tester = RaceConditionTester()
    await tester.run()


if __name__ == "__main__":
    asyncio.run(main())
