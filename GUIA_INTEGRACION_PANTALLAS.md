# 📱 GUÍA DE INTEGRACIÓN - PANTALLAS FALTANTES

Esta guía explica cómo conectar las pantallas restantes (Stock, Reportes, Clientes) con los servicios y hooks ya creados.

---

## ✅ YA LISTO PARA USAR (Sin cambios en backend necesarios)

### 1. **CLIENTES** - Sistema Completo ✅

**Backend:** ✅ Router `/api/v1/clientes` completamente funcional
**Frontend:** ✅ Service + Hooks creados

#### Integración en `Clientes.tsx`:

```tsx
import { useClientes, useCreateCliente, useUpdateCliente, useDeactivateCliente } from '@/hooks/useClientesQuery';
import { useState } from 'react';

export default function Clientes() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cargar clientes
  const { data: clientes = [], isLoading } = useClientes({
    search: searchQuery,
    is_active: true,
    limit: 50
  });
  
  // Mutations
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const deactivateMutation = useDeactivateCliente();
  
  const handleCreate = (formData) => {
    createMutation.mutate({
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      telefono: formData.telefono,
      // ... otros campos
    });
  };
  
  const handleUpdate = (clienteId, updates) => {
    updateMutation.mutate({ clienteId, updates });
  };
  
  const handleDeactivate = (clienteId) => {
    deactivateMutation.mutate(clienteId);
  };
  
  return (
    <div>
      {/* Buscador */}
      <input 
        type="text"
        placeholder="Buscar clientes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {/* Lista de clientes */}
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {clientes.map((cliente) => (
            <div key={cliente.cliente_id} className="p-4 border rounded">
              <h3>{cliente.nombre} {cliente.apellido}</h3>
              <p>{cliente.email}</p>
              <p>{cliente.telefono}</p>
              <button onClick={() => handleUpdate(cliente.cliente_id, {...})}>
                Editar
              </button>
              <button onClick={() => handleDeactivate(cliente.cliente_id)}>
                Desactivar
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal para crear nuevo cliente */}
      <button onClick={() => setShowCreateModal(true)}>
        Nuevo Cliente
      </button>
    </div>
  );
}
```

---

## ⏳ REQUIERE ENDPOINTS EN BACKEND

### 2. **STOCK** - Gestión de Inventario

**Frontend:** ✅ Service + Hooks creados  
**Backend:** ⏳ Necesita crear router `/api/v1/stock`

#### Endpoints Necesarios (Backend):

```python
# core-api/api/routes/stock.py

@router.get("/resumen")
async def stock_resumen():
    """Stock de todas las variantes con ubicaciones"""
    # SQL que agrupe inventory_ledger por variant_id y location_id
    # Retorna: variant_id, product_name, sku, stock_total, stock_by_location[]

@router.get("/variant/{variant_id}")
async def stock_by_variant(variant_id: UUID):
    """Stock de una variante específica"""
    # Retorna stock_total y desglose por ubicaciones

@router.get("/transactions")
async def stock_transactions(
    variant_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    limit: int = 100
):
    """Historial de movimientos de inventario"""
    # Query sobre inventory_ledger con filtros

@router.post("/adjustment")
async def create_adjustment(data: StockAdjustmentRequest):
    """Crear ajuste manual de inventario"""
    # INSERT en inventory_ledger con reference_type='adjustment'

@router.post("/transfer")
async def transfer_stock(data: StockTransferRequest):
    """Transferir stock entre ubicaciones"""
    # 2 INSERTs: uno con delta negativo (from) y otro positivo (to)

@router.get("/locations")
async def get_locations():
    """Listar ubicaciones de la tienda"""
    # SELECT * FROM locations WHERE tienda_id = current_tienda.id

@router.get("/low-stock")
async def low_stock_products(threshold: int = 10):
    """Productos con stock bajo"""
    # Query que filtre variantes con stock_total < threshold
```

**Registrar en `main.py`:**
```python
from api.routes import stock
app.include_router(stock.router, prefix=settings.API_V1_STR)
```

#### Integración en `Stock.tsx`:

```tsx
import { useStockResumen, useCreateAdjustment, useTransferStock } from '@/hooks/useStockQuery';

export default function Stock() {
  const { data: stockData = [], isLoading } = useStockResumen();
  const adjustmentMutation = useCreateAdjustment();
  const transferMutation = useTransferStock();
  
  const handleAdjustment = (variantId, locationId, delta, notes) => {
    adjustmentMutation.mutate({
      variant_id: variantId,
      location_id: locationId,
      delta: delta, // +N para entrada, -N para salida
      reference_type: 'adjustment',
      notes: notes
    });
  };
  
  return (
    <div>
      <h1>Gestión de Stock</h1>
      
      {/* Tabla de stock por producto/variante */}
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Stock Total</th>
            <th>Ubicaciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {stockData.map((item) => (
            <tr key={item.variant_id}>
              <td>{item.product_name}</td>
              <td>{item.sku}</td>
              <td>{item.stock_total}</td>
              <td>
                {item.stock_by_location.map((loc) => (
                  <div key={loc.location_id}>
                    {loc.location_name}: {loc.stock}
                  </div>
                ))}
              </td>
              <td>
                <button onClick={() => handleAdjustment(item.variant_id, ...)}>
                  Ajustar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 3. **REPORTES** - Analytics y Estadísticas

**Frontend:** ✅ Service + Hooks creados  
**Backend:** ⏳ Adaptar router existente `/api/v1/reportes`

#### Endpoints a Agregar/Adaptar (Backend):

```python
# core-api/api/routes/reportes.py

@router.get("/ventas")
async def reporte_ventas(
    periodo: Optional[str] = 'mes',  # hoy, ayer, semana, mes
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
):
    """Reporte completo de ventas por período"""
    # Retorna: resumen, por_periodo[], top_productos[], por_categoria[], por_metodo_pago[]

@router.get("/top-productos")
async def top_productos(
    periodo: Optional[str] = 'mes',
    limit: int = 10
):
    """Productos más vendidos"""
    # Ya existe /productos/mas-vendidos - puede adaptarse

@router.get("/por-categoria")
async def ventas_por_categoria(periodo: Optional[str] = 'mes'):
    """Ventas agrupadas por categoría"""
    # GROUP BY category en detalle_ventas JOIN productos

@router.get("/por-metodo-pago")
async def ventas_por_metodo_pago(periodo: Optional[str] = 'mes'):
    """Ventas agrupadas por método de pago"""
    # GROUP BY metodo_pago en ventas

@router.get("/tendencia")
async def tendencia_ventas(dias: int = 30):
    """Tendencia de ventas diarias"""
    # Ya existe /ventas/tendencia-diaria - puede usarse

@router.get("/ventas-detalle")
async def ventas_detalle(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    limit: int = 100
):
    """Lista detallada de ventas individuales"""
    # SELECT ventas con JOIN detalle_ventas

@router.get("/export/csv")
async def exportar_csv(
    tipo: str,  # 'ventas', 'productos', 'inventario'
    periodo: Optional[str] = None
):
    """Exportar reporte a CSV"""
    # Generar CSV usando pandas o csv module
    # Retornar FileResponse con content-type text/csv
```

#### Integración en `Reportes.tsx`:

```tsx
import { 
  useReporteVentas, 
  useTopProductos, 
  useTendenciaVentas,
  useExportarReporte 
} from '@/hooks/useReportesQuery';
import { useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

export default function Reportes() {
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes'>('mes');
  
  const { data: reporte, isLoading } = useReporteVentas({ periodo });
  const { data: topProductos = [] } = useTopProductos({ periodo, limit: 10 });
  const { data: tendencia = [] } = useTendenciaVentas(30);
  const exportMutation = useExportarReporte();
  
  const handleExport = () => {
    exportMutation.mutate({ tipo: 'ventas', periodo });
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reportes y Análisis</h1>
      
      {/* Selector de período */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setPeriodo('hoy')}>Hoy</button>
        <button onClick={() => setPeriodo('semana')}>Esta Semana</button>
        <button onClick={() => setPeriodo('mes')}>Este Mes</button>
        <button onClick={handleExport}>Exportar CSV</button>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-gray-500">Total Ventas</p>
          <p className="text-2xl font-bold">${reporte?.resumen.total_ventas.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-gray-500">Transacciones</p>
          <p className="text-2xl font-bold">{reporte?.resumen.cantidad_transacciones}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-gray-500">Ticket Promedio</p>
          <p className="text-2xl font-bold">${reporte?.resumen.ticket_promedio.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-gray-500">Productos Vendidos</p>
          <p className="text-2xl font-bold">{reporte?.resumen.productos_vendidos}</p>
        </div>
      </div>
      
      {/* Gráfico de tendencia */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Tendencia de Ventas (30 días)</h2>
        <Line 
          data={{
            labels: tendencia.map(d => d.fecha),
            datasets: [{
              label: 'Ventas Diarias',
              data: tendencia.map(d => d.total_ventas),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            }]
          }}
        />
      </div>
      
      {/* Top productos */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Top 10 Productos</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Producto</th>
              <th className="text-right">Cantidad Vendida</th>
              <th className="text-right">Total</th>
              <th className="text-right">% Ventas</th>
            </tr>
          </thead>
          <tbody>
            {topProductos.map((producto) => (
              <tr key={producto.product_id}>
                <td>{producto.product_name}</td>
                <td className="text-right">{producto.cantidad_vendida}</td>
                <td className="text-right">${producto.total_vendido.toLocaleString()}</td>
                <td className="text-right">{producto.porcentaje_ventas.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Paso 1: CLIENTES ✅ (Listo para usar ahora mismo)
1. Importar hooks en `Clientes.tsx`
2. Conectar búsqueda y lista
3. Crear modal de crear/editar cliente
4. Probar CRUD completo

### Paso 2: REPORTES (Adaptar endpoints existentes)
1. Revisar `core-api/api/routes/reportes.py`
2. Adaptar endpoints existentes o crear faltantes
3. Conectar `Reportes.tsx` con hooks
4. Agregar gráficos con recharts/chart.js

### Paso 3: STOCK (Crear nuevo router)
1. Crear `core-api/api/routes/stock.py`
2. Implementar endpoints de stock/transacciones
3. Conectar `Stock.tsx` con hooks
4. Agregar funcionalidad de ajustes/transferencias

---

## 🧪 TESTING RÁPIDO

### Test Clientes (Backend):
```powershell
# Listar clientes
curl http://localhost:8001/api/v1/clientes

# Crear cliente
curl -X POST http://localhost:8001/api/v1/clientes `
  -H "Content-Type: application/json" `
  -d '{\"nombre\": \"Juan\", \"apellido\": \"Pérez\", \"email\": \"juan@test.com\", \"telefono\": \"+123456789\"}'

# Buscar cliente
curl "http://localhost:8001/api/v1/clientes/search?q=juan"

# Top clientes
curl http://localhost:8001/api/v1/clientes/top
```

### Test Frontend:
```tsx
// En Clientes.tsx, agregar console.log temporal
const { data: clientes = [], isLoading } = useClientes();
console.log('Clientes cargados:', clientes);
```

---

## 📚 RECURSOS

- **TanStack Query Docs:** https://tanstack.com/query/latest
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Recharts (gráficos):** https://recharts.org/

---

## ✅ CHECKLIST DE INTEGRACIÓN

### Clientes:
- [ ] Importar hooks en Clientes.tsx
- [ ] Conectar lista de clientes
- [ ] Implementar búsqueda en tiempo real
- [ ] Crear modal de nuevo cliente
- [ ] Crear modal de editar cliente
- [ ] Implementar desactivar cliente
- [ ] Mostrar detalle con estadísticas de compra
- [ ] Probar con datos reales

### Stock:
- [ ] Crear router stock.py en backend
- [ ] Implementar endpoint /stock/resumen
- [ ] Implementar endpoint /stock/transactions
- [ ] Implementar endpoint /stock/adjustment
- [ ] Implementar endpoint /stock/transfer
- [ ] Conectar Stock.tsx con hooks
- [ ] Mostrar tabla de inventario
- [ ] Implementar ajustes manuales
- [ ] Implementar transferencias
- [ ] Probar con datos reales

### Reportes:
- [ ] Adaptar endpoints existentes en reportes.py
- [ ] Agregar endpoint /reportes/por-categoria
- [ ] Agregar endpoint /reportes/por-metodo-pago
- [ ] Agregar endpoint /reportes/export/csv
- [ ] Conectar Reportes.tsx con hooks
- [ ] Agregar gráficos de tendencia (Line chart)
- [ ] Agregar gráfico de categorías (Pie/Doughnut chart)
- [ ] Agregar tabla de top productos
- [ ] Implementar exportación CSV
- [ ] Probar con datos reales

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
