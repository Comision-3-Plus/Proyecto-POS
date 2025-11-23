"""
Script simplificado para generar actividad usando el API REST
"""
import requests
import random
from datetime import datetime, timedelta
import time

BASE_URL = "http://localhost:8000/api/v1"

# 1. Login
print("🔐 Iniciando sesión...")
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "admin@nexuspos.com", "password": "admin123"}
)
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Sesión iniciada")

# 2. Obtener productos
print("\n📦 Obteniendo productos...")
response = requests.get(f"{BASE_URL}/productos/", headers=headers)
productos = response.json()
print(f"✅ {len(productos)} productos disponibles")

if len(productos) < 10:
    print("⚠️  Necesitas más productos para mejor demo")
    exit(1)

# 3. Generar ventas variadas
print("\n💰 Generando ventas...")
metodos_pago = ["EFECTIVO", "MERCADOPAGO", "TARJETA"]
ventas_generadas = 0

# Generar ventas de diferentes días
for dia in range(7, 0, -1):
    num_ventas = random.randint(3, 10)
    
    for _ in range(num_ventas):
        # Seleccionar productos aleatorios
        num_productos = random.randint(1, 5)
        productos_venta = random.sample(productos, num_productos)
        
        items = []
        for prod in productos_venta:
            cantidad = random.randint(1, 10)
            items.append({
                "producto_id": prod["id"],
                "cantidad": cantidad,
                "precio_unitario": prod["precio_venta"]
            })
        
        venta_data = {
            "items": items,
            "metodo_pago": random.choice(metodos_pago)
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/ventas/checkout",
                json=venta_data,
                headers=headers
            )
            if response.status_code == 201:
                ventas_generadas += 1
                if ventas_generadas % 10 == 0:
                    print(f"  📊 {ventas_generadas} ventas creadas...")
            else:
                print(f"  ⚠️  Error en venta: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
        
        time.sleep(0.1)  # Pequeña pausa entre ventas

print(f"✅ {ventas_generadas} ventas generadas exitosamente")

# 4. Generar insights
print("\n💡 Generando insights...")
try:
    response = requests.post(
        f"{BASE_URL}/insights/refresh?force=true",
        headers=headers
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✅ {data['total']} insights generados")
    else:
        print(f"⚠️  Error al generar insights: {response.status_code}")
except Exception as e:
    print(f"❌ Error: {str(e)}")

# 5. Obtener resumen del dashboard
print("\n📊 Obteniendo resumen final...")
try:
    response = requests.get(f"{BASE_URL}/dashboard/resumen", headers=headers)
    if response.status_code == 200:
        dashboard = response.json()
        print("\n" + "="*60)
        print("📊 RESUMEN DE ACTIVIDAD")
        print("="*60)
        print(f"💰 Ventas Hoy: ${dashboard['ventas']['hoy']:,.2f}")
        print(f"🎫 Tickets Emitidos: {dashboard['ventas']['tickets_emitidos']}")
        print(f"📈 Ventas Semana: ${dashboard['ventas']['semana']:,.2f}")
        print(f"⚠️  Productos Bajo Stock: {dashboard['inventario']['productos_bajo_stock']}")
        print(f"📦 Total Productos: {dashboard['inventario']['total_productos']}")
        print("="*60)
    else:
        print(f"⚠️  Error al obtener dashboard: {response.status_code}")
except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n✅ ¡Actividad generada exitosamente!")
print("🌐 Abre http://localhost:3000 y presiona Ctrl+Shift+R para ver los cambios")
