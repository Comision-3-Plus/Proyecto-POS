# 🚀 QUICK START - GLAMOUR FEATURES

## Instalación Rápida (5 minutos)

### 1. Instalar Dependencias Go (Worker)

```bash
cd worker-service
go mod tidy
```

Esto instalará automáticamente:
- ✅ `github.com/johnfercher/maroto/v2` - PDF Generator
- ✅ `github.com/stretchr/testify` - Testing

### 2. Cargar Datos Demo (Python)

```bash
cd core-api
python scripts/seed_demo_data.py
```

Esto creará:
- ✅ 1 Tienda: "Moda Blend"
- ✅ 1 Usuario: admin@modablend.com / admin123
- ✅ 50 Productos variados
- ✅ 200 Ventas en los últimos 30 días
- ✅ 5 Alertas de stock crítico

### 3. Probar PDF Generator

```bash
cd worker-service
go test ./internal/invoices/... -v
```

Deberías ver:
```
=== RUN   TestPDFGenerator_GenerateInvoice
--- PASS: TestPDFGenerator_GenerateInvoice (0.15s)
PASS
```

### 4. Ver Ejemplo de Uso

```bash
cd worker-service
go run examples/demo_features.go
```

Output esperado:
```
🎨 DEMO: Generación de PDF y Envío de Emails
============================================================

📄 1. Generando factura PDF...
   ✅ PDF generado: 15234 bytes

📧 2. Preparando email de bienvenida...
📧 [MODO DEV] Email de bienvenida simulado a usuario@ejemplo.com
   ✅ Email de bienvenida enviado (modo dev)

🎫 3. Preparando email de comprobante...
📧 [MODO DEV] Comprobante simulado a cliente@ejemplo.com - Venta: VTA-2024-001234
   ✅ Email de ticket enviado (modo dev)

⚠️  4. Preparando email de alerta de stock...
📧 [MODO DEV] Alerta simulada a admin@blend.com.ar - Tipo: stock_critico
   ✅ Email de alerta enviado (modo dev)

============================================================
✅ DEMO COMPLETADO!
============================================================
```

---

## 🎬 Demo Flow Completo

### Paso 1: Levantar Sistema
```bash
# Terminal 1: Backend
cd core-api
uvicorn main:app --reload

# Terminal 2: Frontend
cd web-portal
npm run dev

# Terminal 3: Worker (opcional)
cd worker-service
go run cmd/api/main.go
```

### Paso 2: Login
1. Abrir: http://localhost:3000
2. Email: `admin@modablend.com`
3. Password: `admin123`

### Paso 3: Explorar Dashboard
- Ver métricas con datos reales
- Gráficos de ventas del último mes
- 5 insights de stock crítico

### Paso 4: Probar POS
- Escanear productos por SKU
- Buscar: "nike", "adidas", "puma"
- Realizar venta de ejemplo

### Paso 5: Ver Reportes
- Tendencia de ventas (últimos 30 días)
- Top 10 productos más vendidos
- Rentabilidad por categoría

---

## 📦 Archivos Nuevos Creados

```
worker-service/
├── internal/
│   ├── invoices/
│   │   ├── pdf_generator.go          ⭐ NEW
│   │   └── pdf_generator_test.go     ⭐ NEW
│   └── email/
│       └── sendgrid_html.go           ⭐ NEW
├── templates/
│   ├── welcome.html                   ⭐ NEW
│   ├── ticket.html                    ⭐ NEW
│   └── alert.html                     ⭐ NEW
└── examples/
    └── demo_features.go               ⭐ NEW

core-api/
└── scripts/
    └── seed_demo_data.py              ⭐ NEW

GLAMOUR_FEATURES.md                    ⭐ NEW
QUICK_START.md                         ⭐ NEW (este archivo)
```

---

## 🔧 Troubleshooting

### Error: "cannot find package maroto"
```bash
cd worker-service
go get github.com/johnfercher/maroto/v2
go mod tidy
```

### Error: "templates not found"
Asegúrate de estar en `worker-service/` al ejecutar el demo.

### Frontend no carga datos
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8000/health

# Verificar que los datos demo se hayan cargado
psql $DATABASE_URL -c "SELECT COUNT(*) FROM productos;"
```

### Emails no se envían
Es normal en desarrollo. Para enviar emails reales:
```bash
export SENDGRID_API_KEY="tu-api-key"
```

---

## ✅ Checklist de Verificación

- [ ] Go mod tidy ejecutado sin errores
- [ ] Tests de PDF pasando
- [ ] Datos demo cargados (50 productos, 200 ventas)
- [ ] Frontend levantado en localhost:3000
- [ ] Backend respondiendo en localhost:8000
- [ ] Login exitoso con admin@modablend.com
- [ ] Dashboard muestra gráficos con datos
- [ ] Insights muestra 5 alertas de stock

---

## 🎯 Próximos Pasos

1. **Integrar PDF en Ventas:**
   - Al crear venta → generar PDF
   - Guardar en storage (S3)
   - Adjuntar al email de ticket

2. **Automatizar Emails:**
   - Stock bajo → email automático
   - Venta exitosa → comprobante por email
   - Nuevos usuarios → email de bienvenida

3. **Customización:**
   - Logo por tienda
   - Colores personalizados
   - Templates editables

---

**¿Necesitas ayuda?** Revisa `GLAMOUR_FEATURES.md` para documentación completa.

🚀 ¡Sistema listo para demos!
