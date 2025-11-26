# 🧪 NEXUS POS - TESTING MANUAL (PowerShell)
# Los 6 Niveles de Validación - Versión Windows

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "="*79 -ForegroundColor Cyan
Write-Host "🧪 NEXUS POS - SUITE DE TESTING ENTERPRISE" -ForegroundColor Cyan
Write-Host "="*80 -ForegroundColor Cyan
Write-Host "`n"

# Variables globales
$API_URL = "http://localhost:8001/api/v1"
$BLEND_AGENT_URL = "http://localhost:8080"
$TOKEN = ""
$PRODUCTO_ID = ""

# ===================================================================
# HELPERS
# ===================================================================

function Print-Header {
    param([int]$Level, [string]$Name)
    Write-Host "`n" -NoNewline
    Write-Host "─"*80 -ForegroundColor Yellow
    Write-Host "🧪 NIVEL $Level`: $Name" -ForegroundColor Yellow
    Write-Host "─"*80 -ForegroundColor Yellow
    Write-Host "`n"
}

function Log-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Log-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Log-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# ===================================================================
# NIVEL 1: HEALTH & SMOKE TESTS
# ===================================================================

function Test-Nivel1 {
    Print-Header -Level 1 -Name "LA SALUD DEL MOTOR (Health & Smoke Tests)"
    
    # Test 1.1: API Health
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get -TimeoutSec 5
        if ($response.status -eq "ok") {
            Log-Success "API Health Check: OK"
        } else {
            Log-Error "API Health Check: Status no es 'ok'"
        }
    } catch {
        Log-Error "API Health Check: $_"
    }
    
    # Test 1.2: Redis
    try {
        # Requiere redis-cli instalado
        $redis = redis-cli ping 2>&1
        if ($redis -like "*PONG*") {
            Log-Success "Redis Connection: OK"
        } else {
            Log-Warning "Redis Connection: No responde PONG"
        }
    } catch {
        Log-Warning "Redis Connection: redis-cli no disponible"
    }
    
    # Test 1.3: RabbitMQ (verificar puerto 5672)
    try {
        $rabbit = Test-NetConnection -ComputerName localhost -Port 5672 -WarningAction SilentlyContinue
        if ($rabbit.TcpTestSucceeded) {
            Log-Success "RabbitMQ Connection: Puerto 5672 abierto"
        } else {
            Log-Error "RabbitMQ Connection: Puerto 5672 cerrado"
        }
    } catch {
        Log-Error "RabbitMQ Connection: $_"
    }
}

# ===================================================================
# NIVEL 2: HAPPY PATH (FLUJO DE CAJA)
# ===================================================================

function Test-Nivel2 {
    Print-Header -Level 2 -Name "EL FLUJO DE CAJA (The Happy Path)"
    
    # Test 2.1: Login
    try {
        $loginBody = @{
            email = "admin@nexuspos.com"
            password = "admin123"
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 10
        
        $script:TOKEN = $loginResponse.access_token
        
        if ($TOKEN) {
            Log-Success "Login: Token obtenido"
        } else {
            Log-Error "Login: No se obtuvo token"
            return
        }
    } catch {
        Log-Error "Login: $_"
        return
    }
    
    # Test 2.2: Crear Producto
    try {
        $headers = @{
            Authorization = "Bearer $TOKEN"
        }
        
        $productoBody = @{
            nombre = "Remera Test PS1"
            precio = 5000.0
            stock = 10
            codigo = "REM-PS1-$(Get-Random -Maximum 999999)"
        } | ConvertTo-Json
        
        $productoResponse = Invoke-RestMethod -Uri "$API_URL/productos" -Method Post -Body $productoBody -ContentType "application/json" -Headers $headers -TimeoutSec 10
        
        $script:PRODUCTO_ID = $productoResponse.id
        
        if ($PRODUCTO_ID) {
            Log-Success "Crear Producto: ID = $PRODUCTO_ID (Stock inicial: 10)"
        } else {
            Log-Error "Crear Producto: No se obtuvo ID"
            return
        }
    } catch {
        Log-Error "Crear Producto: $_"
        return
    }
    
    # Test 2.3: Venta Normal (2 unidades)
    try {
        $ventaBody = @{
            items = @(
                @{
                    producto_id = $PRODUCTO_ID
                    cantidad = 2
                    precio_unitario = 5000.0
                }
            )
            metodo_pago = "efectivo"
            total = 10000.0
        } | ConvertTo-Json -Depth 3
        
        $ventaResponse = Invoke-RestMethod -Uri "$API_URL/ventas/checkout" -Method Post -Body $ventaBody -ContentType "application/json" -Headers $headers -TimeoutSec 10
        
        $ventaId = $ventaResponse.id
        
        if ($ventaId) {
            Log-Success "Venta Normal: ID = $ventaId (2 unidades vendidas)"
        } else {
            Log-Error "Venta Normal: No se obtuvo ID"
        }
    } catch {
        Log-Error "Venta Normal: $_"
    }
    
    # Test 2.4: Validar Stock (debe ser 8)
    try {
        $stockResponse = Invoke-RestMethod -Uri "$API_URL/productos/$PRODUCTO_ID" -Method Get -Headers $headers -TimeoutSec 10
        
        $stockActual = $stockResponse.stock
        
        if ($stockActual -eq 8) {
            Log-Success "Validar Stock: Correcto ($stockActual)"
        } elseif ($stockActual -eq 7) {
            Log-Error "Validar Stock: $stockActual (esperado 8) - Posible double-debit"
        } elseif ($stockActual -eq 9) {
            Log-Error "Validar Stock: $stockActual (esperado 8) - No se descontó"
        } else {
            Log-Error "Validar Stock: $stockActual (esperado 8) - CRÍTICO"
        }
    } catch {
        Log-Error "Validar Stock: $_"
    }
}

# ===================================================================
# NIVEL 3: AUDITORÍA
# ===================================================================

function Test-Nivel3 {
    Print-Header -Level 3 -Name "EL AGENTE DOBLE (Auditoría y Seguridad)"
    
    if (-not $TOKEN) {
        Log-Error "No autenticado. Saltando nivel."
        return
    }
    
    # Test 3.1: Crear producto para modificar
    try {
        $headers = @{
            Authorization = "Bearer $TOKEN"
        }
        
        $productoBody = @{
            nombre = "Producto Audit Test"
            precio = 20000.0
            stock = 5
            codigo = "AUD-$(Get-Random -Maximum 999999)"
        } | ConvertTo-Json
        
        $productoResponse = Invoke-RestMethod -Uri "$API_URL/productos" -Method Post -Body $productoBody -ContentType "application/json" -Headers $headers -TimeoutSec 10
        
        $auditProductoId = $productoResponse.id
        
        Log-Success "Crear Producto Audit: ID = $auditProductoId (Precio inicial: `$20.000)"
        
        # Test 3.2: Cambiar precio a $10 (sospechoso)
        Start-Sleep -Seconds 1
        
        $updateBody = @{
            precio = 10.0
        } | ConvertTo-Json
        
        $updateResponse = Invoke-RestMethod -Uri "$API_URL/productos/$auditProductoId" -Method Put -Body $updateBody -ContentType "application/json" -Headers $headers -TimeoutSec 10
        
        Log-Success "Modificación Maliciosa: Precio cambiado de `$20.000 a `$10"
        Log-Warning "Verificar audit_logs en DB para ver registro de cambio"
        
    } catch {
        Log-Error "Test Auditoría: $_"
    }
}

# ===================================================================
# NIVEL 4: HARDWARE BRIDGE (BLEND AGENT)
# ===================================================================

function Test-Nivel4 {
    Print-Header -Level 4 -Name "EL PUENTE DE HARDWARE (Blend Agent)"
    
    # Test 4.1: Health Check
    try {
        $blendHealth = Invoke-RestMethod -Uri "$BLEND_AGENT_URL/health" -Method Get -TimeoutSec 5
        if ($blendHealth.status -eq "ok") {
            Log-Success "Blend Agent Health: OK"
        } else {
            Log-Warning "Blend Agent Health: Status no es 'ok'"
        }
    } catch {
        Log-Error "Blend Agent Health: Agente no está corriendo (localhost:8080)"
        Log-Warning "Ejecutar: cd blend-agent && go run cmd/main.go"
        return
    }
    
    # Test 4.2: Listar Impresoras
    try {
        $printers = Invoke-RestMethod -Uri "$BLEND_AGENT_URL/api/printers" -Method Get -TimeoutSec 5
        $count = $printers.count
        Log-Success "Detectar Impresoras: $count impresora(s) encontrada(s)"
    } catch {
        Log-Error "Detectar Impresoras: $_"
    }
    
    # Test 4.3: Imprimir Ticket
    try {
        $printBody = @{
            items = @(
                @{
                    description = "REMERA TEST"
                    quantity = 1
                    unit_price = 5000.0
                    tax_rate = 21.0
                }
            )
            payment = @{
                method = "efectivo"
                amount = 5000.0
            }
        } | ConvertTo-Json -Depth 3
        
        $printResponse = Invoke-RestMethod -Uri "$BLEND_AGENT_URL/api/print/fiscal" -Method Post -Body $printBody -ContentType "application/json" -TimeoutSec 10
        
        Log-Success "Imprimir Ticket: 🖨️ Ticket impreso correctamente"
    } catch {
        Log-Error "Imprimir Ticket: $_"
    }
}

# ===================================================================
# NIVEL 5: RESILIENCIA
# ===================================================================

function Test-Nivel5 {
    Print-Header -Level 5 -Name "CAOS & RESILIENCIA (La prueba AFIP)"
    
    Log-Warning "Tests de resiliencia requieren simular fallas manualmente"
    Log-Warning "Pasos:"
    Write-Host "  1. Desconectar internet" -ForegroundColor Yellow
    Write-Host "  2. Hacer una venta (debe funcionar)" -ForegroundColor Yellow
    Write-Host "  3. Reconectar internet" -ForegroundColor Yellow
    Write-Host "  4. Ver logs del worker AFIP: docker logs -f nexuspos-worker" -ForegroundColor Yellow
    Write-Host "  5. Verificar retry y obtención de CAE" -ForegroundColor Yellow
}

# ===================================================================
# NIVEL 6: RACE CONDITIONS
# ===================================================================

function Test-Nivel6 {
    Print-Header -Level 6 -Name "LA CARRERA (Race Conditions)"
    
    if (-not $TOKEN) {
        Log-Error "No autenticado. Saltando nivel."
        return
    }
    
    # Test 6.1: Crear producto con stock 1
    try {
        $headers = @{
            Authorization = "Bearer $TOKEN"
        }
        
        $raceProductoBody = @{
            nombre = "Último Item"
            precio = 1000.0
            stock = 1
            codigo = "LAST-$(Get-Random -Maximum 999999)"
        } | ConvertTo-Json
        
        $raceProducto = Invoke-RestMethod -Uri "$API_URL/productos" -Method Post -Body $raceProductoBody -ContentType "application/json" -Headers $headers -TimeoutSec 10
        
        $raceProductoId = $raceProducto.id
        
        Log-Success "Crear Producto Stock 1: ID = $raceProductoId"
        
        # Test 6.2: Compras concurrentes
        Log-Warning "Ejecutando compras concurrentes..."
        
        $ventaBody = @{
            items = @(
                @{
                    producto_id = $raceProductoId
                    cantidad = 1
                    precio_unitario = 1000.0
                }
            )
            metodo_pago = "efectivo"
            total = 1000.0
        } | ConvertTo-Json -Depth 3
        
        # PowerShell no tiene async/await nativo, simular con jobs
        $job1 = Start-Job -ScriptBlock {
            param($url, $body, $headers)
            try {
                Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -Headers $headers -TimeoutSec 10
                return "200"
            } catch {
                if ($_.Exception.Response.StatusCode -eq 409) {
                    return "409"
                }
                return "ERROR"
            }
        } -ArgumentList "$API_URL/ventas/checkout", $ventaBody, $headers
        
        $job2 = Start-Job -ScriptBlock {
            param($url, $body, $headers)
            try {
                Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -Headers $headers -TimeoutSec 10
                return "200"
            } catch {
                if ($_.Exception.Response.StatusCode -eq 409) {
                    return "409"
                }
                return "ERROR"
            }
        } -ArgumentList "$API_URL/ventas/checkout", $ventaBody, $headers
        
        # Esperar resultados
        $result1 = Receive-Job -Job $job1 -Wait
        $result2 = Receive-Job -Job $job2 -Wait
        
        Remove-Job -Job $job1, $job2
        
        $successCount = ($result1, $result2 | Where-Object { $_ -eq "200" }).Count
        $conflictCount = ($result1, $result2 | Where-Object { $_ -eq "409" }).Count
        
        if ($successCount -eq 1 -and $conflictCount -eq 1) {
            Log-Success "Race Condition: Manejada correctamente (1 OK, 1 CONFLICT)"
        } elseif ($successCount -eq 2) {
            Log-Error "Race Condition: ❌ CRÍTICO - Ambas ventas exitosas (overselling)"
        } else {
            Log-Warning "Race Condition: Resultado inesperado ($successCount OK, $conflictCount CONFLICT)"
        }
        
    } catch {
        Log-Error "Race Condition: $_"
    }
}

# ===================================================================
# MAIN
# ===================================================================

Write-Host "Iniciando tests..." -ForegroundColor Cyan
Write-Host "API: $API_URL" -ForegroundColor Gray
Write-Host "Blend Agent: $BLEND_AGENT_URL" -ForegroundColor Gray
Write-Host "`n"

Test-Nivel1
Test-Nivel2
Test-Nivel3
Test-Nivel4
Test-Nivel5
Test-Nivel6

Write-Host "`n"
Write-Host "="*80 -ForegroundColor Cyan
Write-Host "📊 TESTING COMPLETADO" -ForegroundColor Cyan
Write-Host "="*80 -ForegroundColor Cyan
Write-Host "`n"
Write-Host "✅ Revisar output arriba para ver resultados detallados" -ForegroundColor Green
Write-Host "`n"
