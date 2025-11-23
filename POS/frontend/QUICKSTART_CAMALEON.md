# 🚀 Quick Start - Sistema Camaleón

## Paso 1: Verificar que Zustand esté instalado

```powershell
cd frontend
npm list zustand
```

Debería ver: `zustand@x.x.x`

## Paso 2: Iniciar el Frontend

```powershell
cd frontend
npm run dev
```

## Paso 3: Acceder a la aplicación

Abrir navegador en: `http://localhost:3000`

## Paso 4: Probar el Onboarding

1. Hacer login con un usuario (o crear uno nuevo)
2. Si la tienda no tiene `rubro` definido, serás redirigido a `/onboarding`
3. Seleccionar uno de los 3 rubros:
   - 👕 **Ropa**: Para boutiques con variantes
   - 🥩 **Carnicería/Verdulería**: Para productos pesables
   - 🍬 **Kiosco/Drugstore**: Para productos estándar

## Paso 5: Crear un Producto

### Ejemplo para Ropa (si elegiste "Ropa"):
1. Ir a **Productos** → **Nuevo Producto**
2. Verás un formulario específico para ropa con:
   - Selector de colores (Negro, Blanco, Rojo, etc.)
   - Selector de talles (S, M, L, XL, etc.)
   - Matriz de stock por variante
3. Completar:
   - Nombre: "Remera Lisa"
   - SKU: "REM-001"
   - Precio: $5000
   - Colores: Negro, Blanco
   - Talles: M, L
   - Stock por variante (negro-M: 10, negro-L: 15, blanco-M: 8, blanco-L: 12)
4. Guardar

### Ejemplo para Pesables (si elegiste "Carnicería"):
1. Ir a **Productos** → **Nuevo Producto**
2. Verás un formulario específico para pesables con:
   - Precio por Kilogramo
   - Stock en decimales
3. Completar:
   - Nombre: "Carne Molida"
   - SKU: "CAR-001"
   - Precio por kg: $2500
   - Stock: 15.5 kg
4. Guardar

### Ejemplo para Kiosco (si elegiste "Kiosco"):
1. Ir a **Productos** → **Nuevo Producto**
2. Verás un formulario estándar con:
   - Código de barras prioritario
   - Campos simples
3. Completar:
   - Código de barras: 7790895001406
   - Nombre: "Coca-Cola 500ml"
   - SKU: "COCA-500"
   - Precio: $800
   - Stock: 50
4. Guardar

## Paso 6: Probar el POS

1. Ir a **POS** (Punto de Venta)
2. Buscar el producto creado
3. Hacer clic en el producto

### Comportamiento según rubro:

**Ropa** 👕:
- Se abre un modal para seleccionar Color y Talle
- Muestra el stock de esa combinación específica
- Permite elegir cantidad
- Agrega al carrito con la variante seleccionada

**Pesable** 🥩:
- Se abre un modal para ingresar el peso
- Muestra botones rápidos (0.25kg, 0.5kg, 1kg, etc.)
- Calcula el precio automáticamente (peso × precio/kg)
- Muestra el total a cobrar
- Agrega al carrito con el peso y precio calculado

**Kiosco** 🍬:
- **Se agrega directamente al carrito** sin modales
- Escaneo rápido con código de barras
- Máxima velocidad

## Paso 7: Completar una Venta

1. Agregar varios productos al carrito
2. Verificar que cada uno se muestre correctamente:
   - Productos de ropa muestran: "Remera Lisa (negro - M)"
   - Productos pesables muestran: "Carne Molida - 0.5kg"
   - Productos estándar muestran: "Coca-Cola 500ml"
3. Hacer clic en **COBRAR**
4. Seleccionar método de pago
5. Confirmar venta

## 🔄 Cambiar de Rubro

Para cambiar el rubro de tu tienda:

### Opción 1: Desde el Backend (Recomendado para pruebas)
```bash
# Conectar a la base de datos y ejecutar:
UPDATE tiendas SET rubro = 'pesable' WHERE id = 'tu-tienda-id';
# Opciones: 'ropa', 'pesable', 'general'
```

### Opción 2: Crear endpoint en el backend
```python
@router.patch("/tiendas/me")
async def update_tienda_rubro(
    update: dict,
    current_user: Usuario = Depends(get_current_user)
):
    tienda = current_user.tienda
    tienda.rubro = update.get("rubro")
    db.commit()
    return {"tienda": tienda}
```

## 🧪 Testing Checklist

- [ ] Onboarding muestra las 3 opciones de rubro
- [ ] Al seleccionar un rubro, se guarda correctamente
- [ ] El formulario de productos cambia según el rubro
- [ ] Productos de ropa muestran selector de variantes
- [ ] Productos pesables muestran input de peso
- [ ] Productos estándar se agregan directo al carrito
- [ ] El carrito muestra correctamente cada tipo de producto
- [ ] Las ventas se completan sin errores
- [ ] El store Zustand persiste el rubro en localStorage

## 📸 Screenshots Esperados

### Onboarding
![Onboarding](https://via.placeholder.com/800x400?text=Onboarding+con+3+tarjetas)

### Formulario de Producto (Ropa)
![Form Ropa](https://via.placeholder.com/800x600?text=Matriz+de+Colores+y+Talles)

### Modal de Venta (Pesable)
![Modal Peso](https://via.placeholder.com/400x500?text=Ingreso+de+Peso+con+Calculadora)

### POS con Producto Estándar
![POS](https://via.placeholder.com/800x400?text=Click+directo+al+carrito)

## ❓ FAQ

**P: ¿Puedo tener productos de diferentes tipos en la misma tienda?**  
R: Sí, cada producto puede tener sus propios atributos. El rubro de la tienda solo define el formulario por defecto.

**P: ¿Qué pasa si cambio el rubro de mi tienda?**  
R: Los productos existentes mantienen sus atributos. Solo cambia el formulario para nuevos productos.

**P: ¿Puedo personalizar los colores y talles?**  
R: Sí, además de los predefinidos, puedes agregar colores y talles personalizados.

**P: ¿El peso puede ser decimal?**  
R: Sí, soporta hasta 3 decimales (ej: 0.250 kg).

---

¡Listo! El sistema Camaleón está funcionando 🎉
