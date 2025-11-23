# ⚡ BENCHMARK DE PERFORMANCE - NEXUS POS ⚡
# Ejecutar con: ./benchmark.ps1

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  NEXUS POS - PERFORMANCE BENCHMARK" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Token de autenticación (reemplazar con uno válido)
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJleHAiOjE3NjQyNTMwOTB9.nuBbLgAuRUvWTu0_Ve4Xta-OR4Rz_wpl-zyaH7SyG8c"
$baseUrl = "http://localhost:8000/api/v1"

# Función para medir endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$Iterations = 5
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    $times = @()
    
    for ($i = 1; $i -le $Iterations; $i++) {
        $time = (Measure-Command {
            curl.exe -X GET "$Url" -H "Authorization: Bearer $token" -o $null -s 2>&1 | Out-Null
        }).TotalMilliseconds
        
        $times += $time
        Write-Host "  Request $i : $([Math]::Round($time, 2))ms" -ForegroundColor Gray
    }
    
    $avg = ($times | Measure-Object -Average).Average
    $min = ($times | Measure-Object -Minimum).Minimum
    $max = ($times | Measure-Object -Maximum).Maximum
    
    Write-Host "  Average: $([Math]::Round($avg, 2))ms" -ForegroundColor Green
    Write-Host "  Min: $([Math]::Round($min, 2))ms" -ForegroundColor Green
    Write-Host "  Max: $([Math]::Round($max, 2))ms`n" -ForegroundColor Green
    
    return [PSCustomObject]@{
        Endpoint = $Name
        Average = [Math]::Round($avg, 2)
        Min = [Math]::Round($min, 2)
        Max = [Math]::Round($max, 2)
    }
}

# Tests
$results = @()

Write-Host "1. ENDPOINTS DE LECTURA (GET)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$results += Test-Endpoint -Name "Dashboard Resumen" -Url "$baseUrl/dashboard/resumen"
$results += Test-Endpoint -Name "Lista Productos" -Url "$baseUrl/productos"
$results += Test-Endpoint -Name "Lista Insights" -Url "$baseUrl/insights/"
$results += Test-Endpoint -Name "Health Check" -Url "$baseUrl/health/"

Write-Host "`n2. CACHÉ TEST (Dashboard)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Esperando 2s para limpiar caché..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Request FRÍA (sin caché):" -ForegroundColor Yellow
$coldTime = (Measure-Command {
    curl.exe -X GET "$baseUrl/dashboard/resumen" -H "Authorization: Bearer $token" -o $null -s 2>&1 | Out-Null
}).TotalMilliseconds
Write-Host "  $([Math]::Round($coldTime, 2))ms`n" -ForegroundColor Green

Write-Host "Requests CALIENTES (con caché):" -ForegroundColor Yellow
for ($i = 1; $i -le 5; $i++) {
    $hotTime = (Measure-Command {
        curl.exe -X GET "$baseUrl/dashboard/resumen" -H "Authorization: Bearer $token" -o $null -s 2>&1 | Out-Null
    }).TotalMilliseconds
    Write-Host "  Request $i : $([Math]::Round($hotTime, 2))ms" -ForegroundColor Green
}

Write-Host "`n3. RESUMEN DE RESULTADOS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$results | Format-Table -AutoSize

Write-Host "`n✅ BENCHMARK COMPLETADO`n" -ForegroundColor Green

# Comparación con targets
Write-Host "4. COMPARACIÓN CON TARGETS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$targets = @{
    "Dashboard Resumen" = 150
    "Lista Productos" = 100
    "Lista Insights" = 50
    "Health Check" = 20
}

foreach ($result in $results) {
    $target = $targets[$result.Endpoint]
    if ($target) {
        $status = if ($result.Average -le $target) { "✅ PASS" } else { "⚠️  SLOW" }
        $color = if ($result.Average -le $target) { "Green" } else { "Yellow" }
        
        Write-Host "$($result.Endpoint): $($result.Average)ms (target: ${target}ms) " -NoNewline
        Write-Host $status -ForegroundColor $color
    }
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  FastAPI running al palo! ⚡🚀" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan
