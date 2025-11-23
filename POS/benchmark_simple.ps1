# BENCHMARK NEXUS POS - Performance Test
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  NEXUS POS - PERFORMANCE BENCHMARK" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJleHAiOjE3NjQyNTMwOTB9.nuBbLgAuRUvWTu0_Ve4Xta-OR4Rz_wpl-zyaH7SyG8c"

function Test-Endpoint {
    param([string]$Name, [string]$Url)
    Write-Host "`nTesting: $Name" -ForegroundColor Yellow
    $times = @()
    for ($i = 1; $i -le 5; $i++) {
        $t = (Measure-Command { curl.exe -X GET $Url -H "Authorization: Bearer $token" -o $null -s 2>&1 | Out-Null }).TotalMilliseconds
        $times += $t
        Write-Host "  #$i : $([Math]::Round($t,2))ms" -ForegroundColor Gray
    }
    $avg = [Math]::Round(($times | Measure-Object -Average).Average, 2)
    Write-Host "  PROMEDIO: ${avg}ms" -ForegroundColor Green
    return @{Name=$Name; Avg=$avg}
}

Write-Host "`n1. ENDPOINTS DE LECTURA" -ForegroundColor Cyan
$r1 = Test-Endpoint "Dashboard" "http://localhost:8000/api/v1/dashboard/resumen"
$r2 = Test-Endpoint "Productos" "http://localhost:8000/api/v1/productos"
$r3 = Test-Endpoint "Insights" "http://localhost:8000/api/v1/insights/"
$r4 = Test-Endpoint "Health" "http://localhost:8000/api/v1/health/"

Write-Host "`n2. TEST DE CACHE (Dashboard)" -ForegroundColor Cyan
Write-Host "Request FRIA:"
$cold = (Measure-Command { curl.exe -X GET "http://localhost:8000/api/v1/dashboard/resumen" -H "Authorization: Bearer $token" -o $null -s 2>&1 | Out-Null }).TotalMilliseconds
Write-Host "  $([Math]::Round($cold,2))ms" -ForegroundColor Green

Write-Host "`nRequests CALIENTES (cached):"
for ($i=1; $i -le 3; $i++) {
    $hot = (Measure-Command { curl.exe -X GET "http://localhost:8000/api/v1/dashboard/resumen" -H "Authorization: Bearer $token" -o $null -s 2>&1 | Out-Null }).TotalMilliseconds
    Write-Host "  #$i : $([Math]::Round($hot,2))ms" -ForegroundColor Green
}

Write-Host "`n3. RESUMEN" -ForegroundColor Cyan
Write-Host ("Dashboard: {0}ms" -f $r1.Avg) -ForegroundColor White
Write-Host ("Productos: {0}ms" -f $r2.Avg) -ForegroundColor White
Write-Host ("Insights: {0}ms" -f $r3.Avg) -ForegroundColor White
Write-Host ("Health: {0}ms" -f $r4.Avg) -ForegroundColor White

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "  FastAPI running AL PALO! ⚡🚀" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
