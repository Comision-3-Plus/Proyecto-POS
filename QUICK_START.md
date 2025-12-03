# ⚡ GUÍA RÁPIDA - APLICAR CAMBIOS

## 🚀 Ejecutar en 5 Pasos

### PASO 1: Backup (CRÍTICO)
```bash
# Si usas Supabase, conectar a la URL de DB
$env:DATABASE_URL = "postgresql://..."

# Backup
pg_dump $env:DATABASE_URL > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

### PASO 2: Aplicar Migración
```bash
cd core-api
alembic upgrade head
```

**Esperado:**
```
INFO  [alembic.runtime.migration] Running upgrade 8ffa21c359ed -> d524704d8504, cleanup_unnecessary_tables_for_retail_and_add_retail_features
```

### PASO 3: Verificar Migración
```bash
# Ver versión actual
alembic current
```

**Esperado:**
```
d524704d8504 (head)
```

### PASO 4: Limpiar Archivos
```powershell
# Eliminar modelos innecesarios
Remove-Item core-api\schemas_models\rfid_models.py -ErrorAction SilentlyContinue
Remove-Item core-api\schemas_models\oms_models.py -ErrorAction SilentlyContinue
Remove-Item core-api\schemas_models\loyalty_models.py -ErrorAction SilentlyContinue
Remove-Item core-api\schemas_models\promo_models.py -ErrorAction SilentlyContinue

# Eliminar servicios
Remove-Item core-api\services\rfid_service.py -ErrorAction SilentlyContinue
Remove-Item core-api\services\oms_service.py -ErrorAction SilentlyContinue
Remove-Item core-api\services\loyalty_service.py -ErrorAction SilentlyContinue
Remove-Item core-api\services\promo_service.py -ErrorAction SilentlyContinue
Remove-Item core-api\services\caea_service.py -ErrorAction SilentlyContinue

# Eliminar route
Remove-Item core-api\api\routes\oms.py -ErrorAction SilentlyContinue
```

### PASO 5: Probar Generadores
```bash
cd core-api
python utils/sku_generator.py
```

**Esperado:**
```
=== SKU GENERATOR ===
REM-001-ROJO-M
PANT-045-AZUL-42
...
=== BARCODE GENERATOR ===
EAN-13: 7790001198082
Valid: True
```

---

## 🧪 Test Rápido en Python

```python
# Conectar a DB
from core.db import get_session
from sqlalchemy import inspect, text

async for session in get_session():
    # Verificar que tablas fueron eliminadas
    result = await session.exec(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
    tables = [row[0] for row in result]
    
    # Estas NO deben existir
    assert "rfid_tags" not in tables
    assert "loyalty_programs" not in tables
    assert "promociones" not in tables
    
    # Estas SÍ deben existir
    assert "productos_legacy" in tables
    assert "product_categories" in tables
    assert "webhooks" in tables
    
    print("✅ Migración exitosa!")
    break
```

---

## ⚠️ Si Algo Sale Mal

### Rollback de Migración
```bash
cd core-api
alembic downgrade -1
```

### Restaurar Backup
```bash
psql $env:DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### Ver Historial de Migraciones
```bash
alembic history
```

---

## 📝 Checklist Final

- [ ] Backup de DB creado
- [ ] `alembic upgrade head` ejecutado exitosamente
- [ ] `alembic current` muestra `d524704d8504`
- [ ] Archivos innecesarios eliminados
- [ ] `python utils/sku_generator.py` funciona
- [ ] Test de DB pasó (tablas correctas)
- [ ] Carpeta `web-portal` eliminada (manual)

---

## 🎉 Listo!

Ahora tienes:
- ✅ POS especializado para retail de ropa
- ✅ Modelos enriquecidos (season, brand, material, etc.)
- ✅ Sistema de categorías
- ✅ Generadores automáticos de SKUs y barcodes
- ✅ Base limpia sin tablas innecesarias

**Siguiente paso**: Continuar con Módulo 3 (Integración Shopify)
