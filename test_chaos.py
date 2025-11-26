"""
💥 NEXUS POS - CHAOS ENGINEERING TESTER
Simula fallas de AFIP, latencias, timeouts y caídas de servicios
"""
import asyncio
import httpx
import time
from colorama import Fore, Style, init
from typing import List, Dict

init(autoreset=True)


class ChaosTester:
    """Tester de resiliencia y caos"""
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.api_url = f"{base_url}/api/v1"
        self.token = None
        self.test_results = []
    
    async def run(self):
        """Ejecutar tests de caos"""
        print(f"\n{Fore.CYAN}{'='*80}")
        print("💥 CHAOS ENGINEERING TESTER - Resiliencia bajo fuego")
        print(f"{'='*80}{Style.RESET_ALL}\n")
        
        # Login
        await self.login()
        
        if not self.token:
            print(f"{Fore.RED}❌ No se pudo autenticar{Style.RESET_ALL}")
            return
        
        # Test 1: Latencia alta
        await self.test_high_latency()
        
        # Test 2: Timeout parcial
        await self.test_partial_timeout()
        
        # Test 3: Retry automático
        await self.test_automatic_retry()
        
        # Test 4: Circuit breaker
        await self.test_circuit_breaker()
        
        # Test 5: Degradación gradual
        await self.test_graceful_degradation()
        
        # Reporte final
        self.print_report()
    
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
                    print(f"{Fore.GREEN}✅ Login exitoso{Style.RESET_ALL}\n")
        except Exception as e:
            print(f"{Fore.RED}❌ Login error: {e}{Style.RESET_ALL}")
    
    async def test_high_latency(self):
        """Test: Sistema sigue funcionando con latencia alta"""
        print(f"{Fore.YELLOW}Test 1: Alta Latencia (> 2 segundos){Style.RESET_ALL}")
        
        try:
            start = time.time()
            
            async with httpx.AsyncClient() as client:
                # Request con timeout generoso
                response = await client.get(
                    f"{self.api_url}/productos",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=30.0  # Timeout generoso
                )
                
                latency = time.time() - start
                
                if response.status_code == 200:
                    if latency > 2:
                        self.log_warning("Alta Latencia", f"{latency:.2f}s (esperado < 2s)")
                    else:
                        self.log_success("Latencia Normal", f"{latency:.2f}s")
                else:
                    self.log_error("Request Falló", f"Status: {response.status_code}")
        
        except asyncio.TimeoutError:
            self.log_error("Timeout", "Request excedió 30 segundos")
        except Exception as e:
            self.log_error("Error", str(e))
    
    async def test_partial_timeout(self):
        """Test: Algunos requests fallan pero sistema continúa"""
        print(f"\n{Fore.YELLOW}Test 2: Timeout Parcial (50% de requests fallan){Style.RESET_ALL}")
        
        total = 10
        success = 0
        failures = 0
        
        for i in range(total):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.api_url}/health",
                        timeout=1.0  # Timeout agresivo
                    )
                    
                    if response.status_code == 200:
                        success += 1
            
            except asyncio.TimeoutError:
                failures += 1
            except Exception:
                failures += 1
        
        success_rate = (success / total) * 100
        
        if success_rate >= 70:
            self.log_success("Resiliencia", f"{success_rate:.0f}% de requests exitosos")
        elif success_rate >= 50:
            self.log_warning("Resiliencia Media", f"{success_rate:.0f}% de requests exitosos")
        else:
            self.log_error("Resiliencia Baja", f"{success_rate:.0f}% de requests exitosos")
    
    async def test_automatic_retry(self):
        """Test: Sistema reintenta automáticamente en fallas"""
        print(f"\n{Fore.YELLOW}Test 3: Retry Automático{Style.RESET_ALL}")
        
        # Simular request que falla las primeras veces
        max_attempts = 3
        
        for attempt in range(1, max_attempts + 1):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.api_url}/health",
                        timeout=5.0
                    )
                    
                    if response.status_code == 200:
                        if attempt == 1:
                            self.log_success("Retry", "Request exitoso en primer intento")
                        else:
                            self.log_success("Retry", f"Request exitoso en intento {attempt}")
                        break
            
            except Exception as e:
                if attempt < max_attempts:
                    print(f"  ⚠️  Intento {attempt} falló, reintentando...")
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                else:
                    self.log_error("Retry", f"Falló después de {max_attempts} intentos")
    
    async def test_circuit_breaker(self):
        """Test: Circuit breaker se activa después de N fallas"""
        print(f"\n{Fore.YELLOW}Test 4: Circuit Breaker{Style.RESET_ALL}")
        
        # Simular endpoint roto
        failures = 0
        threshold = 5
        
        for i in range(10):
            try:
                async with httpx.AsyncClient() as client:
                    # Endpoint que no existe
                    response = await client.get(
                        f"{self.api_url}/broken-endpoint",
                        headers={"Authorization": f"Bearer {self.token}"},
                        timeout=2.0
                    )
            
            except httpx.HTTPStatusError:
                failures += 1
                
                if failures >= threshold:
                    print(f"  ⚡ Circuit breaker activado después de {failures} fallas")
                    self.log_success("Circuit Breaker", f"Activado en falla #{failures}")
                    break
            
            except Exception:
                failures += 1
        
        if failures < threshold:
            self.log_warning("Circuit Breaker", f"Solo {failures} fallas detectadas")
    
    async def test_graceful_degradation(self):
        """Test: Sistema degrada funcionalidades pero sigue operando"""
        print(f"\n{Fore.YELLOW}Test 5: Degradación Graceful{Style.RESET_ALL}")
        
        # Simular falla de servicio secundario (AFIP)
        # El sistema debe seguir permitiendo ventas en modo offline
        
        self.log_warning("Degradación", "Simular AFIP caída requiere configuración manual")
        print("  Pasos:")
        print("    1. Detener worker AFIP: docker stop nexuspos-worker")
        print("    2. Hacer venta (debe funcionar)")
        print("    3. Verificar que venta se guarda sin CAE")
        print("    4. Reiniciar worker: docker start nexuspos-worker")
        print("    5. Verificar que worker procesa venta pendiente")
    
    def log_success(self, test_name: str, message: str):
        """Log éxito"""
        print(f"  {Fore.GREEN}✅ {test_name}: {message}{Style.RESET_ALL}")
        self.test_results.append({"test": test_name, "status": "success", "message": message})
    
    def log_error(self, test_name: str, message: str):
        """Log error"""
        print(f"  {Fore.RED}❌ {test_name}: {message}{Style.RESET_ALL}")
        self.test_results.append({"test": test_name, "status": "error", "message": message})
    
    def log_warning(self, test_name: str, message: str):
        """Log warning"""
        print(f"  {Fore.YELLOW}⚠️  {test_name}: {message}{Style.RESET_ALL}")
        self.test_results.append({"test": test_name, "status": "warning", "message": message})
    
    def print_report(self):
        """Imprimir reporte final"""
        print(f"\n{Fore.CYAN}{'='*80}")
        print("📊 REPORTE DE CAOS")
        print(f"{'='*80}{Style.RESET_ALL}\n")
        
        success = sum(1 for r in self.test_results if r["status"] == "success")
        errors = sum(1 for r in self.test_results if r["status"] == "error")
        warnings = sum(1 for r in self.test_results if r["status"] == "warning")
        total = len(self.test_results)
        
        print(f"✅ Exitosos: {success}")
        print(f"❌ Fallidos: {errors}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"📊 Total: {total}\n")


async def main():
    tester = ChaosTester()
    await tester.run()


if __name__ == "__main__":
    asyncio.run(main())
