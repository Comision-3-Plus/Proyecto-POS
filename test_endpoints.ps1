# Script de prueba de endpoints del backend
Write-Host "=== Probando Endpoints del Backend ===" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method GET
    Write-Host "   ✅ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en health check" -ForegroundColor Red
}

# 2. Login
Write-Host "`n2. Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@nexuspos.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "   ✅ Login exitoso. Token obtenido." -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Headers con token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 3. Dashboard
Write-Host "`n3. Dashboard..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/dashboard/resumen" -Method GET -Headers $headers
    Write-Host "   ✅ Dashboard cargado" -ForegroundColor Green
    Write-Host "      - Ventas hoy: `$$($dashboard.ventas.hoy)" -ForegroundColor Cyan
    Write-Host "      - Productos activos: $($dashboard.inventario.productos_activos)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Error en dashboard: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Productos
Write-Host "`n4. Productos..." -ForegroundColor Yellow
try {
    $productos = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/productos/" -Method GET -Headers $headers
    Write-Host "   ✅ Productos cargados: $($productos.Count) productos" -ForegroundColor Green
    if ($productos.Count -gt 0) {
        Write-Host "      - Primer producto: $($productos[0].name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Error en productos: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Sizes (para productos)
Write-Host "`n5. Sizes..." -ForegroundColor Yellow
try {
    $sizes = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/productos/sizes" -Method GET -Headers $headers
    Write-Host "   ✅ Sizes cargados: $($sizes.Count) talles" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en sizes: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Colors (para productos)
Write-Host "`n6. Colors..." -ForegroundColor Yellow
try {
    $colors = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/productos/colors" -Method GET -Headers $headers
    Write-Host "   ✅ Colors cargados: $($colors.Count) colores" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en colors: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Locations (para productos)
Write-Host "`n7. Locations..." -ForegroundColor Yellow
try {
    $locations = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/productos/locations" -Method GET -Headers $headers
    Write-Host "   ✅ Locations cargadas: $($locations.Count) ubicaciones" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en locations: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Pruebas Completadas ===" -ForegroundColor Cyan
Write-Host "`nSi todos los endpoints respondieron ✅, el backend está funcionando correctamente." -ForegroundColor Green
Write-Host "Los botones del sidebar deberían funcionar al hacer login con:" -ForegroundColor Yellow
Write-Host "  Email: admin@nexuspos.com" -ForegroundColor Cyan
Write-Host "  Password: admin123" -ForegroundColor Cyan
