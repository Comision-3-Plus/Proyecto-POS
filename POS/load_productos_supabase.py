"""
Cargar productos de prueba en Supabase para diferentes rubros
"""
import asyncio
import asyncpg
from decimal import Decimal

# Productos por rubro
PRODUCTOS = [
    # VERDULERÍA (para Pedrito)
    {"codigo": "VER001", "nombre": "Tomate", "precio": 500.00, "stock": 50, "categoria": "Verduras", "rubro": "VERDULERIA"},
    {"codigo": "VER002", "nombre": "Lechuga", "precio": 350.00, "stock": 30, "categoria": "Verduras", "rubro": "VERDULERIA"},
    {"codigo": "VER003", "nombre": "Papa", "precio": 250.00, "stock": 100, "categoria": "Verduras", "rubro": "VERDULERIA"},
    {"codigo": "VER004", "nombre": "Cebolla", "precio": 200.00, "stock": 80, "categoria": "Verduras", "rubro": "VERDULERIA"},
    {"codigo": "VER005", "nombre": "Zanahoria", "precio": 300.00, "stock": 60, "categoria": "Verduras", "rubro": "VERDULERIA"},
    {"codigo": "FRU001", "nombre": "Manzana", "precio": 450.00, "stock": 40, "categoria": "Frutas", "rubro": "VERDULERIA"},
    {"codigo": "FRU002", "nombre": "Banana", "precio": 400.00, "stock": 50, "categoria": "Frutas", "rubro": "VERDULERIA"},
    {"codigo": "FRU003", "nombre": "Naranja", "precio": 380.00, "stock": 45, "categoria": "Frutas", "rubro": "VERDULERIA"},
    
    # CARNICERÍA
    {"codigo": "CAR001", "nombre": "Asado", "precio": 3500.00, "stock": 25, "categoria": "Carnes", "rubro": "CARNICERIA"},
    {"codigo": "CAR002", "nombre": "Vacío", "precio": 3800.00, "stock": 20, "categoria": "Carnes", "rubro": "CARNICERIA"},
    {"codigo": "CAR003", "nombre": "Pollo Entero", "precio": 2500.00, "stock": 15, "categoria": "Carnes", "rubro": "CARNICERIA"},
    {"codigo": "CAR004", "nombre": "Milanesas", "precio": 3200.00, "stock": 30, "categoria": "Carnes", "rubro": "CARNICERIA"},
    {"codigo": "CAR005", "nombre": "Chorizo", "precio": 2800.00, "stock": 40, "categoria": "Embutidos", "rubro": "CARNICERIA"},
    
    # KIOSCO/ALMACÉN
    {"codigo": "BEB001", "nombre": "Coca Cola 1L", "precio": 1200.00, "stock": 50, "categoria": "Bebidas", "rubro": "COMIDA"},
    {"codigo": "BEB002", "nombre": "Pepsi 1L", "precio": 1100.00, "stock": 40, "categoria": "Bebidas", "rubro": "COMIDA"},
    {"codigo": "BEB003", "nombre": "Agua Mineral 500ml", "precio": 600.00, "stock": 80, "categoria": "Bebidas", "rubro": "COMIDA"},
    {"codigo": "SNK001", "nombre": "Papas Fritas", "precio": 800.00, "stock": 60, "categoria": "Snacks", "rubro": "COMIDA"},
    {"codigo": "SNK002", "nombre": "Galletitas", "precio": 700.00, "stock": 50, "categoria": "Snacks", "rubro": "COMIDA"},
    {"codigo": "SNK003", "nombre": "Chocolate", "precio": 900.00, "stock": 40, "categoria": "Golosinas", "rubro": "COMIDA"},
    
    # FARMACIA
    {"codigo": "FAR001", "nombre": "Ibuprofeno 400mg", "precio": 2500.00, "stock": 100, "categoria": "Medicamentos", "rubro": "FARMACIA"},
    {"codigo": "FAR002", "nombre": "Paracetamol 500mg", "precio": 1800.00, "stock": 120, "categoria": "Medicamentos", "rubro": "FARMACIA"},
    {"codigo": "FAR003", "nombre": "Alcohol en Gel", "precio": 1200.00, "stock": 80, "categoria": "Higiene", "rubro": "FARMACIA"},
    {"codigo": "FAR004", "nombre": "Barbijo x50", "precio": 3000.00, "stock": 50, "categoria": "Protección", "rubro": "FARMACIA"},
    
    # VETERINARIA
    {"codigo": "VET001", "nombre": "Alimento Perro 15kg", "precio": 12000.00, "stock": 20, "categoria": "Alimentos", "rubro": "VETERINARIA"},
    {"codigo": "VET002", "nombre": "Alimento Gato 7kg", "precio": 8000.00, "stock": 25, "categoria": "Alimentos", "rubro": "VETERINARIA"},
    {"codigo": "VET003", "nombre": "Collar Antipulgas", "precio": 2500.00, "stock": 30, "categoria": "Accesorios", "rubro": "VETERINARIA"},
    
    # LIBRERÍA
    {"codigo": "LIB001", "nombre": "Cuaderno A4", "precio": 1500.00, "stock": 50, "categoria": "Papelería", "rubro": "LIBRERIA"},
    {"codigo": "LIB002", "nombre": "Lapicera BIC", "precio": 300.00, "stock": 100, "categoria": "Escritura", "rubro": "LIBRERIA"},
    {"codigo": "LIB003", "nombre": "Carpeta 3 Anillos", "precio": 2000.00, "stock": 40, "categoria": "Papelería", "rubro": "LIBRERIA"},
]


async def main():
    conn = await asyncpg.connect(
        'postgresql://postgres.kdqfohbtxlmykjubxqok:Juani2006@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
    )
    
    try:
        # Obtener la tienda existente (Carniceria Pedro)
        tienda = await conn.fetchrow('SELECT id, nombre, rubro FROM tiendas LIMIT 1')
        print(f'🏪 Tienda: {tienda["nombre"]} ({tienda["rubro"]})')
        
        # Limpiar productos existentes
        deleted = await conn.execute('DELETE FROM productos')
        print(f'🗑️  Productos anteriores eliminados: {deleted}')
        
        # Insertar productos según el rubro de la tienda
        inserted = 0
        for producto in PRODUCTOS:
            # Solo insertar productos del rubro de la tienda + productos generales (COMIDA)
            if producto["rubro"] == tienda["rubro"].upper() or producto["rubro"] == "COMIDA":
                try:
                    await conn.execute("""
                        INSERT INTO productos (
                            id, sku, nombre, precio_venta, precio_costo, stock_actual, 
                            tipo, tienda_id, atributos, is_active
                        ) VALUES (
                            gen_random_uuid(), $1, $2, $3, $4, $5, 
                            $6, $7, '{}'::jsonb, true
                        )
                    """, 
                        producto["codigo"],
                        producto["nombre"],
                        producto["precio"],
                        producto["precio"] * 0.6,  # precio_costo = 60% del precio_venta
                        producto["stock"],
                        producto["categoria"],
                        tienda["id"]
                    )
                    inserted += 1
                    print(f'  ✅ {producto["nombre"]} - ${producto["precio"]} - Stock: {producto["stock"]}')
                except Exception as e:
                    print(f'  ❌ Error insertando {producto["nombre"]}: {e}')
        
        print(f'\n🎉 Insertados {inserted} productos para {tienda["rubro"]}')
        
        # Mostrar resumen
        total = await conn.fetchval('SELECT COUNT(*) FROM productos')
        print(f'📊 Total productos en BD: {total}')
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
