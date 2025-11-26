# 🚀 NEXUS POS - INSTALACIÓN RÁPIDA DE TESTING
# Script para configurar todas las dependencias de testing

Write-Host "`n🚀 INSTALANDO DEPENDENCIAS DE TESTING...`n" -ForegroundColor Cyan

# 1. Verificar Python
Write-Host "Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python no encontrado. Instalar desde https://python.org" -ForegroundColor Red
    exit 1
}

# 2. Instalar dependencias Python
Write-Host "`nInstalando paquetes Python..." -ForegroundColor Yellow
pip install httpx redis psycopg2-binary pika colorama python-dotenv

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Paquetes Python instalados" -ForegroundColor Green
} else {
    Write-Host "❌ Error instalando paquetes Python" -ForegroundColor Red
}

# 3. Verificar Go (para Blend Agent)
Write-Host "`nVerificando Go..." -ForegroundColor Yellow
try {
    $goVersion = go version 2>&1
    Write-Host "✅ $goVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Go no encontrado. Blend Agent tests serán saltados." -ForegroundColor Yellow
    Write-Host "   Instalar desde https://go.dev/dl/" -ForegroundColor Yellow
}

# 4. Verificar Docker
Write-Host "`nVerificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✅ $dockerVersion" -ForegroundColor Green
    
    # Verificar que servicios estén corriendo
    Write-Host "`nVerificando servicios Docker..." -ForegroundColor Yellow
    
    $runningContainers = docker ps --format "{{.Names}}" 2>&1
    
    if ($runningContainers -like "*postgres*") {
        Write-Host "  ✅ PostgreSQL corriendo" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  PostgreSQL no está corriendo" -ForegroundColor Yellow
    }
    
    if ($runningContainers -like "*redis*") {
        Write-Host "  ✅ Redis corriendo" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Redis no está corriendo" -ForegroundColor Yellow
    }
    
    if ($runningContainers -like "*rabbit*") {
        Write-Host "  ✅ RabbitMQ corriendo" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  RabbitMQ no está corriendo" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "⚠️  Docker no encontrado" -ForegroundColor Yellow
    Write-Host "   Instalar desde https://docker.com" -ForegroundColor Yellow
}

# 5. Verificar API corriendo
Write-Host "`nVerificando API Nexus POS..." -ForegroundColor Yellow
try {
    $apiHealth = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ API corriendo en localhost:8001" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API no responde en localhost:8001" -ForegroundColor Yellow
    Write-Host "   Iniciar con: cd core-api && uvicorn main:app --reload --port 8001" -ForegroundColor Yellow
}

# 6. Resumen
Write-Host "`n" -NoNewline
Write-Host "="*80 -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE INSTALACIÓN" -ForegroundColor Cyan
Write-Host "="*80 -ForegroundColor Cyan
Write-Host ""

Write-Host "Para ejecutar tests:" -ForegroundColor Yellow
Write-Host "  • Suite completa:       python test_suite_enterprise.py" -ForegroundColor White
Write-Host "  • Manual PowerShell:    .\test_manual.ps1" -ForegroundColor White
Write-Host "  • Race Conditions:      python test_race_conditions.py" -ForegroundColor White
Write-Host "  • Chaos Engineering:    python test_chaos.py" -ForegroundColor White
Write-Host ""

Write-Host "Servicios necesarios:" -ForegroundColor Yellow
Write-Host "  • API:                  cd core-api && uvicorn main:app --port 8001" -ForegroundColor White
Write-Host "  • Blend Agent:          cd blend-agent && go run cmd/main.go" -ForegroundColor White
Write-Host "  • Docker:               docker-compose up -d" -ForegroundColor White
Write-Host ""

Write-Host "✅ Instalación completada!`n" -ForegroundColor Green
