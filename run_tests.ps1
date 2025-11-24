# run_tests.ps1
# Script para ejecutar todos los tests del proyecto Super POS

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "python", "go", "python-unit", "python-integration", "go-unit", "e2e")]
    [string]$Target = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Coverage = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Test-Python {
    param([string]$TestPath = ".", [bool]$ShowCoverage = $false)
    
    Write-ColorOutput Green "🐍 Ejecutando tests de Python..."
    
    Push-Location core-api
    
    try {
        $pytestArgs = @("-v")
        
        if ($TestPath -ne ".") {
            $pytestArgs += $TestPath
        }
        
        if ($ShowCoverage) {
            $pytestArgs += @("--cov=.", "--cov-report=term-missing", "--cov-report=html")
        }
        
        if ($Verbose) {
            $pytestArgs += "-s"
        }
        
        Write-Host "Comando: pytest $($pytestArgs -join ' ')"
        
        & pytest $pytestArgs
        
        if ($LASTEXITCODE -ne 0) {
            throw "Tests de Python fallaron"
        }
        
        Write-ColorOutput Green "✅ Tests de Python completados exitosamente"
        
        if ($ShowCoverage) {
            Write-Host "`n📊 Reporte de cobertura generado en: core-api/htmlcov/index.html"
        }
    }
    finally {
        Pop-Location
    }
}

function Test-Go {
    param([string]$Package = "./...", [bool]$ShowCoverage = $false)
    
    Write-ColorOutput Green "🐹 Ejecutando tests de Go..."
    
    Push-Location worker-service
    
    try {
        $goTestArgs = @($Package, "-v")
        
        if ($ShowCoverage) {
            $goTestArgs += @("-coverprofile=coverage.out")
        }
        
        Write-Host "Comando: go test $($goTestArgs -join ' ')"
        
        & go test $goTestArgs
        
        if ($LASTEXITCODE -ne 0) {
            throw "Tests de Go fallaron"
        }
        
        Write-ColorOutput Green "✅ Tests de Go completados exitosamente"
        
        if ($ShowCoverage) {
            Write-Host "`n📊 Generando reporte de cobertura HTML..."
            & go tool cover -html=coverage.out -o coverage.html
            Write-Host "Reporte de cobertura generado en: worker-service/coverage.html"
        }
    }
    finally {
        Pop-Location
    }
}

function Test-E2E {
    Write-ColorOutput Green "🔄 Ejecutando tests End-to-End..."
    
    Write-Host "`n1️⃣  Levantando infraestructura (Docker)..."
    docker-compose up -d postgres rabbitmq
    
    Write-Host "Esperando a que los servicios estén listos..."
    Start-Sleep -Seconds 15
    
    try {
        Write-Host "`n2️⃣  Ejecutando migraciones..."
        Push-Location core-api
        alembic upgrade head
        Pop-Location
        
        Write-Host "`n3️⃣  Iniciando Worker en background..."
        Push-Location worker-service
        $workerJob = Start-Job -ScriptBlock { 
            Set-Location $using:PWD
            go run cmd/api/main.go 
        }
        Pop-Location
        
        Write-Host "`n4️⃣  Iniciando API en background..."
        Push-Location core-api
        $apiJob = Start-Job -ScriptBlock { 
            Set-Location $using:PWD
            uvicorn main:app --port 8000 
        }
        Pop-Location
        
        Write-Host "`nEsperando a que API y Worker estén listos..."
        Start-Sleep -Seconds 10
        
        Write-Host "`n5️⃣  Ejecutando tests de integración..."
        Test-Python -TestPath "tests/integration/" -ShowCoverage $false
        
        Write-ColorOutput Green "`n✅ Tests E2E completados exitosamente"
    }
    catch {
        Write-ColorOutput Red "❌ Tests E2E fallaron: $_"
        throw
    }
    finally {
        Write-Host "`n🧹 Limpiando procesos..."
        
        if ($workerJob) {
            Stop-Job $workerJob -ErrorAction SilentlyContinue
            Remove-Job $workerJob -ErrorAction SilentlyContinue
        }
        
        if ($apiJob) {
            Stop-Job $apiJob -ErrorAction SilentlyContinue
            Remove-Job $apiJob -ErrorAction SilentlyContinue
        }
        
        Write-Host "Deteniendo contenedores Docker..."
        docker-compose down
    }
}

# ====================================================================
# MAIN EXECUTION
# ====================================================================

Write-ColorOutput Cyan @"
╔════════════════════════════════════════════════════════════╗
║         🧪 SUPER POS - TEST RUNNER                         ║
║         Arquitectura Políglota: Python + Go                ║
╚════════════════════════════════════════════════════════════╝
"@

switch ($Target) {
    "all" {
        Write-Host "`n📦 Ejecutando TODOS los tests (Python + Go)...`n"
        Test-Python -ShowCoverage $Coverage
        Write-Host ""
        Test-Go -ShowCoverage $Coverage
    }
    
    "python" {
        Test-Python -ShowCoverage $Coverage
    }
    
    "go" {
        Test-Go -ShowCoverage $Coverage
    }
    
    "python-unit" {
        Test-Python -TestPath "tests/unit/" -ShowCoverage $Coverage
    }
    
    "python-integration" {
        Test-Python -TestPath "tests/integration/" -ShowCoverage $Coverage
    }
    
    "go-unit" {
        Test-Go -Package "./internal/..." -ShowCoverage $Coverage
    }
    
    "e2e" {
        Test-E2E
    }
}

Write-ColorOutput Green @"

╔════════════════════════════════════════════════════════════╗
║                  ✅ TESTS COMPLETADOS                      ║
╚════════════════════════════════════════════════════════════╝
"@

# Ejemplos de uso:
# .\run_tests.ps1 -Target all -Coverage
# .\run_tests.ps1 -Target python-unit -Verbose
# .\run_tests.ps1 -Target go -Coverage
# .\run_tests.ps1 -Target e2e
