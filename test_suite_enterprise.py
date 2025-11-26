"""
🧪 NEXUS POS - SUITE DE TESTING ENTERPRISE
6 Niveles de Validación: Desde Health Checks hasta Race Conditions
"""
import asyncio
import time
import logging
from datetime import datetime
from typing import Dict, Any, List
import httpx
import redis
import psycopg2
from uuid import uuid4
from colorama import Fore, Style, init

# Inicializar colorama para Windows
init(autoreset=True)

logger = logging.getLogger(__name__)


class NexusPOSTestSuite:
    """
    Suite de testing completa para Nexus POS
    """
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api/v1"
        self.blend_agent_url = "http://localhost:8080"
        self.token = None
        self.test_results = []
    
    async def run_all_tests(self):
        """Ejecutar todos los niveles de testing"""
        print(f"\n{Fore.CYAN}{'='*80}")
        print(f"🧪 NEXUS POS - SUITE DE TESTING ENTERPRISE")
        print(f"{'='*80}{Style.RESET_ALL}\n")
        
        # NIVEL 1: Health & Smoke Tests
        await self.nivel_1_health_checks()
        
        # NIVEL 2: Happy Path (Flujo de Caja)
        await self.nivel_2_happy_path()
        
        # NIVEL 3: Auditoría y Seguridad
        await self.nivel_3_auditoria()
        
        # NIVEL 4: Hardware Bridge (Blend Agent)
        await self.nivel_4_blend_agent()
        
        # NIVEL 5: Caos & Resiliencia (AFIP)
        await self.nivel_5_resiliencia()
        
        # NIVEL 6: Concurrency / Race Conditions
        await self.nivel_6_race_conditions()
        
        # Reporte final
        self.print_final_report()
    
    # =====================================================
    # NIVEL 1: HEALTH & SMOKE TESTS
    # =====================================================
    
    async def nivel_1_health_checks(self):
        """🧪 NIVEL 1: LA SALUD DEL MOTOR"""
        self.print_level_header(1, "LA SALUD DEL MOTOR (Health & Smoke Tests)")
        
        # Test 1.1: API Health Check
        await self.test_api_health()
        
        # Test 1.2: Database Connection (Supabase)
        await self.test_database_connection()
        
        # Test 1.3: Redis Connection
        await self.test_redis_connection()
        
        # Test 1.4: RabbitMQ Connection
        await self.test_rabbitmq_connection()
        
        self.print_level_summary(1)
    
    async def test_api_health(self):
        """Test: API responde con health check"""
        test_name = "API Health Check"
        
        try:
            async with httpx.AsyncClient() as client:
                start = time.time()
                response = await client.get(f"{self.api_url}/health", timeout=5.0)
                latency = (time.time() - start) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if latency < 100:  # < 100ms
                        self.log_success(test_name, f"Latencia: {latency:.2f}ms")
                    else:
                        self.log_warning(test_name, f"Latencia alta: {latency:.2f}ms")
                else:
                    self.log_error(test_name, f"Status code: {response.status_code}")
        
        except Exception as e:
            self.log_error(test_name, str(e))
    
    async def test_database_connection(self):
        """Test: Conexión a Supabase PostgreSQL"""
        test_name = "Database Connection (Supabase)"
        
        try:
            # Intentar conexión directa
            import os
            from dotenv import load_dotenv
            load_dotenv("core-api/.env")
            
            db_url = os.getenv("DATABASE_URL", "")
            
            if not db_url:
                self.log_warning(test_name, "DATABASE_URL no configurada")
                return
            
            # Parse connection string
            # postgresql+asyncpg://user:pass@host:port/db
            # Convertir a psycopg2 format
            db_url_sync = db_url.replace("postgresql+asyncpg://", "postgresql://")
            
            conn = psycopg2.connect(db_url_sync)
            cursor = conn.cursor()
            
            start = time.time()
            cursor.execute("SELECT 1")
            latency = (time.time() - start) * 1000
            
            cursor.close()
            conn.close()
            
            if latency < 50:
                self.log_success(test_name, f"Latencia: {latency:.2f}ms")
            else:
                self.log_warning(test_name, f"Latencia Supabase: {latency:.2f}ms")
        
        except Exception as e:
            self.log_error(test_name, f"Error: {str(e)[:100]}")
    
    async def test_redis_connection(self):
        """Test: Redis responde en < 5ms"""
        test_name = "Redis Connection"
        
        try:
            r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
            
            start = time.time()
            r.ping()
            latency = (time.time() - start) * 1000
            
            if latency < 5:
                self.log_success(test_name, f"Latencia: {latency:.2f}ms ⚡")
            elif latency < 20:
                self.log_warning(test_name, f"Latencia: {latency:.2f}ms (esperado < 5ms)")
            else:
                self.log_error(test_name, f"Latencia muy alta: {latency:.2f}ms")
        
        except Exception as e:
            self.log_error(test_name, str(e))
    
    async def test_rabbitmq_connection(self):
        """Test: RabbitMQ acepta conexiones"""
        test_name = "RabbitMQ Connection"
        
        try:
            import pika
            
            connection = pika.BlockingConnection(
                pika.ConnectionParameters('localhost', heartbeat=5)
            )
            
            if connection.is_open:
                self.log_success(test_name, "Broker conectado")
                connection.close()
            else:
                self.log_error(test_name, "Conexión fallida")
        
        except Exception as e:
            self.log_error(test_name, str(e))
    
    # =====================================================
    # NIVEL 2: HAPPY PATH (FLUJO DE CAJA)
    # =====================================================
    
    async def nivel_2_happy_path(self):
        """💵 NIVEL 2: EL FLUJO DE CAJA (The Happy Path)"""
        self.print_level_header(2, "EL FLUJO DE CAJA (The Happy Path)")
        
        # Primero hacer login
        await self.do_login()
        
        if not self.token:
            self.log_error("NIVEL 2", "No se pudo autenticar. Saltando nivel.")
            return
        
        # Test 2.1: Crear producto
        producto_id = await self.test_crear_producto()
        
        if not producto_id:
            self.log_error("NIVEL 2", "No se pudo crear producto. Saltando nivel.")
            return
        
        # Test 2.2: Venta normal
        venta_id = await self.test_venta_normal(producto_id)
        
        # Test 2.3: Validar stock (debe ser 8)
        await self.test_validar_stock(producto_id, expected=8)
        
        # Test 2.4: Validar movimiento financiero
        if venta_id:
            await self.test_validar_pago(venta_id)
        
        self.print_level_summary(2)
    
    async def do_login(self):
        """Autenticarse en la API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/auth/login",
                    json={
                        "email": "admin@nexuspos.com",
                        "password": "admin123"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.token = data.get("access_token")
                    self.log_success("Login", "Token obtenido")
                else:
                    self.log_error("Login", f"Status: {response.status_code}")
        
        except Exception as e:
            self.log_error("Login", str(e))
    
    async def test_crear_producto(self) -> str:
        """Test: Crear 'Remera Test' con Stock 10"""
        test_name = "Crear Producto (Stock 10)"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/productos",
                    headers={"Authorization": f"Bearer {self.token}"},
                    json={
                        "nombre": f"Remera Test {uuid4().hex[:8]}",
                        "precio": 5000.0,
                        "stock": 10,
                        "codigo": f"REM-{uuid4().hex[:6]}",
                    },
                    timeout=10.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    producto_id = data.get("id")
                    self.log_success(test_name, f"ID: {producto_id}")
                    return producto_id
                else:
                    self.log_error(test_name, f"Status: {response.status_code}")
                    return None
        
        except Exception as e:
            self.log_error(test_name, str(e))
            return None
    
    async def test_venta_normal(self, producto_id: str) -> str:
        """Test: Vender 2 unidades"""
        test_name = "Venta Normal (2 unidades)"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/ventas/checkout",
                    headers={"Authorization": f"Bearer {self.token}"},
                    json={
                        "items": [
                            {
                                "producto_id": producto_id,
                                "cantidad": 2,
                                "precio_unitario": 5000.0
                            }
                        ],
                        "metodo_pago": "efectivo",
                        "total": 10000.0
                    },
                    timeout=10.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    venta_id = data.get("id")
                    self.log_success(test_name, f"Venta ID: {venta_id}")
                    return venta_id
                else:
                    self.log_error(test_name, f"Status: {response.status_code}")
                    return None
        
        except Exception as e:
            self.log_error(test_name, str(e))
            return None
    
    async def test_validar_stock(self, producto_id: str, expected: int):
        """Test: Stock debe ser exactamente 'expected'"""
        test_name = f"Validar Stock (debe ser {expected})"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/productos/{producto_id}",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    stock_actual = data.get("stock", 0)
                    
                    if stock_actual == expected:
                        self.log_success(test_name, f"Stock correcto: {stock_actual}")
                    elif stock_actual == expected - 1:
                        self.log_error(test_name, f"Stock: {stock_actual} (esperado {expected}) - Posible double-debit")
                    elif stock_actual == expected + 1:
                        self.log_error(test_name, f"Stock: {stock_actual} (esperado {expected}) - No se descontó")
                    else:
                        self.log_error(test_name, f"Stock: {stock_actual} (esperado {expected}) - CRÍTICO")
                else:
                    self.log_error(test_name, f"Status: {response.status_code}")
        
        except Exception as e:
            self.log_error(test_name, str(e))
    
    async def test_validar_pago(self, venta_id: str):
        """Test: Verificar entrada en payments"""
        test_name = "Validar Movimiento Financiero"
        
        # Este test requiere endpoint de payments o consulta directa a DB
        self.log_warning(test_name, "No implementado - requiere endpoint /payments")
    
    # =====================================================
    # NIVEL 3: AUDITORÍA Y SEGURIDAD
    # =====================================================
    
    async def nivel_3_auditoria(self):
        """🕵️‍♂️ NIVEL 3: EL AGENTE DOBLE (Auditoría)"""
        self.print_level_header(3, "EL AGENTE DOBLE (Auditoría y Seguridad)")
        
        if not self.token:
            self.log_error("NIVEL 3", "No autenticado. Saltando nivel.")
            return
        
        # Test 3.1: Modificar precio de producto
        producto_id = await self.test_crear_producto()
        
        if producto_id:
            await self.test_modificar_precio_malicioso(producto_id)
        
        # Test 3.2: Verificar audit log
        await self.test_verificar_audit_log()
        
        self.print_level_summary(3)
    
    async def test_modificar_precio_malicioso(self, producto_id: str):
        """Test: Cambiar precio de $20.000 a $10"""
        test_name = "Modificación Maliciosa de Precio"
        
        try:
            async with httpx.AsyncClient() as client:
                # Primero actualizar a $20.000
                await client.put(
                    f"{self.api_url}/productos/{producto_id}",
                    headers={"Authorization": f"Bearer {self.token}"},
                    json={"precio": 20000.0},
                    timeout=10.0
                )
                
                # Ahora bajar a $10 (sospechoso)
                response = await client.put(
                    f"{self.api_url}/productos/{producto_id}",
                    headers={"Authorization": f"Bearer {self.token}"},
                    json={"precio": 10.0},
                    timeout=10.0
                )
                
                if response.status_code in [200, 204]:
                    self.log_success(test_name, "Cambio realizado (esperando audit log)")
                else:
                    self.log_error(test_name, f"Status: {response.status_code}")
        
        except Exception as e:
            self.log_error(test_name, str(e))
    
    async def test_verificar_audit_log(self):
        """Test: Verificar que existe registro en audit_logs"""
        test_name = "Verificar Audit Log"
        
        # Requiere endpoint de admin o consulta directa a DB
        self.log_warning(test_name, "Requiere endpoint /admin/audit-logs o query SQL directo")
    
    # =====================================================
    # NIVEL 4: HARDWARE BRIDGE (BLEND AGENT)
    # =====================================================
    
    async def nivel_4_blend_agent(self):
        """🖨️ NIVEL 4: EL PUENTE DE HARDWARE (Blend Agent Go)"""
        self.print_level_header(4, "EL PUENTE DE HARDWARE (Blend Agent)")
        
        # Test 4.1: Health check del agente
        await self.test_blend_agent_health()
        
        # Test 4.2: Listar impresoras
        await self.test_blend_agent_printers()
        
        # Test 4.3: Imprimir ticket
        await self.test_blend_agent_print()
        
        self.print_level_summary(4)
    
    async def test_blend_agent_health(self):
        """Test: Blend Agent responde"""
        test_name = "Blend Agent Health"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.blend_agent_url}/health",
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    self.log_success(test_name, "Agente corriendo ✅")
                else:
                    self.log_error(test_name, f"Status: {response.status_code}")
        
        except httpx.ConnectError:
            self.log_error(test_name, "Connection Refused - Agente no está corriendo")
        except Exception as e:
            self.log_error(test_name, str(e))
    
    async def test_blend_agent_printers(self):
        """Test: Listar impresoras detectadas"""
        test_name = "Detectar Impresoras"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.blend_agent_url}/api/printers",
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    count = data.get("count", 0)
                    self.log_success(test_name, f"{count} impresora(s) detectada(s)")
                else:
                    self.log_error(test_name, f"Status: {response.status_code}")
        
        except Exception as e:
            self.log_error(test_name, str(e))
    
    async def test_blend_agent_print(self):
        """Test: Imprimir ticket de prueba"""
        test_name = "Imprimir Ticket Fiscal"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.blend_agent_url}/api/print/fiscal",
                    json={
                        "items": [
                            {
                                "description": "REMERA TEST",
                                "quantity": 1,
                                "unit_price": 5000.0,
                                "tax_rate": 21.0
                            }
                        ],
                        "payment": {
                            "method": "efectivo",
                            "amount": 5000.0
                        }
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    self.log_success(test_name, "🖨️ Ticket impreso correctamente")
                else:
                    self.log_error(test_name, f"Status: {response.status_code}")
        
        except Exception as e:
            self.log_error(test_name, str(e))
    
    # =====================================================
    # NIVEL 5: CAOS & RESILIENCIA
    # =====================================================
    
    async def nivel_5_resiliencia(self):
        """💥 NIVEL 5: CAOS & RESILIENCIA (AFIP Down)"""
        self.print_level_header(5, "CAOS & RESILIENCIA (La prueba AFIP)")
        
        self.log_warning("NIVEL 5", "Tests de resiliencia requieren simular fallas")
        self.log_warning("NIVEL 5", "Ejecutar manualmente: desconectar internet y hacer venta")
        
        self.print_level_summary(5)
    
    # =====================================================
    # NIVEL 6: RACE CONDITIONS
    # =====================================================
    
    async def nivel_6_race_conditions(self):
        """🏎️ NIVEL 6: LA CARRERA (Concurrency)"""
        self.print_level_header(6, "LA CARRERA (Race Conditions)")
        
        if not self.token:
            self.log_error("NIVEL 6", "No autenticado. Saltando nivel.")
            return
        
        # Test 6.1: Crear producto con stock 1
        producto_id = await self.test_crear_producto_stock_1()
        
        if producto_id:
            # Test 6.2: Compra concurrente
            await self.test_compra_concurrente(producto_id)
        
        self.print_level_summary(6)
    
    async def test_crear_producto_stock_1(self) -> str:
        """Test: Crear producto con stock = 1"""
        test_name = "Crear Producto (Stock 1)"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/productos",
                    headers={"Authorization": f"Bearer {self.token}"},
                    json={
                        "nombre": f"Último Item {uuid4().hex[:8]}",
                        "precio": 1000.0,
                        "stock": 1,
                        "codigo": f"LAST-{uuid4().hex[:6]}",
                    },
                    timeout=10.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    producto_id = data.get("id")
                    self.log_success(test_name, f"ID: {producto_id}")
                    return producto_id
                else:
                    self.log_error(test_name, f"Status: {response.status_code}")
                    return None
        
        except Exception as e:
            self.log_error(test_name, str(e))
            return None
    
    async def test_compra_concurrente(self, producto_id: str):
        """Test: 2 clientes comprando al mismo tiempo"""
        test_name = "Compra Concurrente (Race Condition)"
        
        async def comprar():
            async with httpx.AsyncClient() as client:
                return await client.post(
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
        
        try:
            # Disparar 2 requests simultáneos
            results = await asyncio.gather(
                comprar(),
                comprar(),
                return_exceptions=True
            )
            
            success_count = sum(1 for r in results if isinstance(r, httpx.Response) and r.status_code in [200, 201])
            conflict_count = sum(1 for r in results if isinstance(r, httpx.Response) and r.status_code == 409)
            
            if success_count == 1 and conflict_count == 1:
                self.log_success(test_name, "✅ Race condition manejada correctamente (1 OK, 1 CONFLICT)")
            elif success_count == 2:
                self.log_error(test_name, "❌ CRÍTICO: Ambas ventas exitosas (overselling)")
            elif success_count == 0:
                self.log_error(test_name, "❌ Ambas ventas fallaron")
            else:
                self.log_warning(test_name, f"Resultado inesperado: {success_count} OK, {conflict_count} CONFLICT")
        
        except Exception as e:
            self.log_error(test_name, str(e))
    
    # =====================================================
    # HELPERS
    # =====================================================
    
    def print_level_header(self, level: int, name: str):
        """Imprimir header de nivel"""
        print(f"\n{Fore.YELLOW}{'─'*80}")
        print(f"🧪 NIVEL {level}: {name}")
        print(f"{'─'*80}{Style.RESET_ALL}\n")
    
    def print_level_summary(self, level: int):
        """Imprimir resumen del nivel"""
        level_results = [r for r in self.test_results if r.get("level") == level]
        success = sum(1 for r in level_results if r["status"] == "success")
        total = len(level_results)
        
        print(f"\n{Fore.CYAN}Nivel {level} completado: {success}/{total} tests OK{Style.RESET_ALL}\n")
    
    def log_success(self, test_name: str, message: str = ""):
        """Log test exitoso"""
        print(f"{Fore.GREEN}✅ {test_name}: {message}{Style.RESET_ALL}")
        self.test_results.append({"test": test_name, "status": "success", "message": message})
    
    def log_error(self, test_name: str, message: str = ""):
        """Log test fallido"""
        print(f"{Fore.RED}❌ {test_name}: {message}{Style.RESET_ALL}")
        self.test_results.append({"test": test_name, "status": "error", "message": message})
    
    def log_warning(self, test_name: str, message: str = ""):
        """Log warning"""
        print(f"{Fore.YELLOW}⚠️  {test_name}: {message}{Style.RESET_ALL}")
        self.test_results.append({"test": test_name, "status": "warning", "message": message})
    
    def print_final_report(self):
        """Imprimir reporte final"""
        print(f"\n{Fore.CYAN}{'='*80}")
        print("📊 REPORTE FINAL")
        print(f"{'='*80}{Style.RESET_ALL}\n")
        
        success = sum(1 for r in self.test_results if r["status"] == "success")
        errors = sum(1 for r in self.test_results if r["status"] == "error")
        warnings = sum(1 for r in self.test_results if r["status"] == "warning")
        total = len(self.test_results)
        
        print(f"{Fore.GREEN}✅ Exitosos: {success}{Style.RESET_ALL}")
        print(f"{Fore.RED}❌ Fallidos: {errors}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}⚠️  Warnings: {warnings}{Style.RESET_ALL}")
        print(f"📊 Total: {total}\n")
        
        if errors == 0:
            print(f"{Fore.GREEN}🎉 ¡TODOS LOS TESTS PASARON!{Style.RESET_ALL}\n")
        else:
            print(f"{Fore.RED}⚠️  ALGUNOS TESTS FALLARON - REVISAR{Style.RESET_ALL}\n")


async def main():
    """Entry point"""
    suite = NexusPOSTestSuite()
    await suite.run_all_tests()


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING)
    asyncio.run(main())
