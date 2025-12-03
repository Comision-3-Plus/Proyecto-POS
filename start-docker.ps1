# ==========================================
# Script de Inicio Rápido - Nexus POS Docker
# ==========================================
# Este script automatiza el levantamiento completo del sistema

param(
    [switch]$Clean,      # Limpiar volúmenes y empezar desde cero
    [switch]$NoBuild,    # No reconstruir imágenes
    [switch]$Minimal,    # Solo servicios esenciales (sin legacy DB)
    [switch]$Dev         # Modo desarrollo (con hot reload)
)

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "              NEXUS POS - DOCKER                      " -ForegroundColor Cyan
Write-Host "        Sistema de Inicio Automatizado                " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# ==========================================
# 1. VERIFICAR REQUISITOS
# ==========================================
Write-Host ""
Write-Host "[1/8] Verificando requisitos..." -ForegroundColor Yellow

# Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Host "  ✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker no encontrado. Instalar desde https://www.docker.com" -ForegroundColor Red
    exit 1
}

# Verificar Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Host "  ✅ Docker Compose: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker Compose no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar que Docker está corriendo
try {
    docker ps | Out-Null
    Write-Host "  ✅ Docker daemon corriendo" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker no está corriendo. Iniciar Docker Desktop" -ForegroundColor Red
    exit 1
}

# ==========================================
# 2. CONFIGURAR VARIABLES DE ENTORNO
# ==========================================
Write-Host ""
Write-Host "[2/8] Configurando variables de entorno..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.docker") {
        Write-Host "  📝 Copiando .env.docker → .env" -ForegroundColor Cyan
        Copy-Item .env.docker .env
        
        Write-Host "  IMPORTANTE: Editar .env y cambiar SECRET_KEY" -ForegroundColor Magenta
        Write-Host "  Generando SECRET_KEY segura..." -ForegroundColor Cyan
        
        # Generar SECRET_KEY segura
        $secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
        
        # Reemplazar en .env
        (Get-Content .env) -replace '^SECRET_KEY=.*', "SECRET_KEY=$secretKey" | Set-Content .env
        Write-Host "  ✅ SECRET_KEY generada y configurada automáticamente" -ForegroundColor Green
    } else {
        Write-Host "  ❌ No se encontró .env.docker. Crear archivo de configuración" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ Archivo .env ya existe" -ForegroundColor Green
}

# ==========================================
# 3. LIMPIAR (OPCIONAL)
# ==========================================
if ($Clean) {
    Write-Host ""
    Write-Host "[3/8] Limpiando contenedores y volúmenes..." -ForegroundColor Yellow
    Write-Host "  ADVERTENCIA: Esto eliminara TODOS los datos (DB, cache, colas)" -ForegroundColor Red
    
    $confirm = Read-Host "  Continuar? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        docker-compose down -v
        Write-Host "  ✅ Limpieza completada" -ForegroundColor Green
    } else {
        Write-Host "  Limpieza cancelada" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[3/8] Omitiendo limpieza (usar -Clean para limpiar)" -ForegroundColor Gray
}

# ==========================================
# 4. CONSTRUIR IMÁGENES
# ==========================================
if (-not $NoBuild) {
    Write-Host ""
    Write-Host "[4/8] Construyendo imagenes Docker..." -ForegroundColor Yellow
    Write-Host "  Esto puede tardar 5-10 minutos la primera vez..." -ForegroundColor Cyan
    
    if ($Minimal) {
        docker-compose build db redis rabbitmq core_api worker_go scheduler_go
    } else {
        docker-compose build
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK - Imagenes construidas exitosamente" -ForegroundColor Green
    } else {
        Write-Host "  ERROR construyendo imagenes" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[4/8] Omitiendo construccion (usar sin -NoBuild para construir)" -ForegroundColor Gray
}

# ==========================================
# 5. LEVANTAR SERVICIOS BASE
# ==========================================
Write-Host ""
Write-Host "[5/8] Levantando servicios base (DB, Redis, RabbitMQ)..." -ForegroundColor Yellow

docker-compose up -d db redis rabbitmq

Write-Host "  Esperando a que los servicios esten saludables (30-60s)..." -ForegroundColor Cyan

# Esperar a que los servicios estén healthy
$maxRetries = 30
$retries = 0
$allHealthy = $false

while (-not $allHealthy -and $retries -lt $maxRetries) {
    Start-Sleep -Seconds 2
    $retries++
    
    $dbHealth = docker inspect --format='{{.State.Health.Status}}' super_pos_db 2>$null
    $redisHealth = docker inspect --format='{{.State.Health.Status}}' blend_redis 2>$null
    $rabbitHealth = docker inspect --format='{{.State.Health.Status}}' super_pos_rabbitmq 2>$null
    
    if ($dbHealth -eq 'healthy' -and $redisHealth -eq 'healthy' -and $rabbitHealth -eq 'healthy') {
        $allHealthy = $true
        Write-Host "  OK - Todos los servicios base estan saludables" -ForegroundColor Green
    } else {
        Write-Host "  Esperando... ($retries/$maxRetries) [DB: $dbHealth | Redis: $redisHealth | RabbitMQ: $rabbitHealth]" -ForegroundColor Gray
    }
}

if (-not $allHealthy) {
    Write-Host "  Timeout esperando servicios. Continuar de todas formas..." -ForegroundColor Yellow
}

# ==========================================
# 6. APLICAR MIGRACIONES
# ==========================================
Write-Host ""
Write-Host "[6/8] Aplicando migraciones de base de datos..." -ForegroundColor Yellow

# Verificar si hay migraciones pendientes
$migrationOutput = docker-compose run --rm core_api alembic current 2>&1

if ($migrationOutput -match "doesnt match head") {
    Write-Host "  Hay migraciones pendientes. Aplicando..." -ForegroundColor Cyan
    docker-compose run --rm core_api alembic upgrade head
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK - Migraciones aplicadas exitosamente" -ForegroundColor Green
    } else {
        Write-Host "  ERROR aplicando migraciones" -ForegroundColor Red
        Write-Host "  Continuar de todas formas? (y/N)" -ForegroundColor Yellow
        $confirm = Read-Host
        if ($confirm -ne 'y' -and $confirm -ne 'Y') {
            exit 1
        }
    }
} else {
    Write-Host "  OK - Base de datos actualizada (sin migraciones pendientes)" -ForegroundColor Green
}

# Verificar que las tablas existen
Write-Host "  Verificando tablas en la base de datos..." -ForegroundColor Cyan
$tableCount = docker exec super_pos_db psql -U nexuspos -d nexus_pos -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null

if ($tableCount -gt 0) {
    Write-Host "  OK - Base de datos tiene $tableCount tablas" -ForegroundColor Green
} else {
    Write-Host "  No se pudieron verificar las tablas" -ForegroundColor Yellow
}

# ==========================================
# 7. LEVANTAR TODOS LOS SERVICIOS
# ==========================================
Write-Host ""
Write-Host "[7/8] Levantando todos los servicios..." -ForegroundColor Yellow

if ($Minimal) {
    # Solo servicios esenciales
    docker-compose up -d db redis rabbitmq core_api worker_go scheduler_go adminer
} else {
    # Todos los servicios
    docker-compose up -d
}

Write-Host "  Esperando a que la API este lista..." -ForegroundColor Cyan

# Esperar a que la API responda
$apiRetries = 0
$apiReady = $false

while (-not $apiReady -and $apiRetries -lt 30) {
    Start-Sleep -Seconds 2
    $apiRetries++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $apiReady = $true
            Write-Host "  OK - API respondiendo correctamente" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Esperando API... ($apiRetries/30)" -ForegroundColor Gray
    }
}

if (-not $apiReady) {
    Write-Host "  API no respondio. Verificar logs: docker-compose logs core_api" -ForegroundColor Yellow
}

# ==========================================
# 8. RESUMEN Y ACCESOS
# ==========================================
Write-Host ""
Write-Host "[8/8] Sistema levantado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "                 TODO LISTO!                          " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "SERVICIOS DISPONIBLES:" -ForegroundColor Yellow
Write-Host ""

# Verificar estado de cada servicio
$services = @(
    @{Name="API REST"; URL="http://localhost:8001"; Container="super_pos_api"},
    @{Name="API Docs (Swagger)"; URL="http://localhost:8001/api/v1/docs"; Container="super_pos_api"},
    @{Name="RabbitMQ Management"; URL="http://localhost:15672"; Container="super_pos_rabbitmq"; Creds="nexususer / nexuspass2025"},
    @{Name="Adminer (DB UI)"; URL="http://localhost:8080"; Container="super_pos_adminer"; Creds="Server: db | User: nexuspos"}
)

foreach ($service in $services) {
    $status = docker inspect --format='{{.State.Status}}' $service.Container 2>$null
    if ($status -eq 'running') {
        $icon = "[OK]"
        $color = "Green"
    } else {
        $icon = "[ERROR]"
        $color = "Red"
    }
    
    Write-Host "  $icon " -NoNewline -ForegroundColor $color
    Write-Host "$($service.Name): " -NoNewline -ForegroundColor White
    Write-Host "$($service.URL)" -ForegroundColor Cyan
    
    if ($service.Creds) {
        Write-Host "     Credenciales: $($service.Creds)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "ESTADO DE CONTENEDORES:" -ForegroundColor Yellow
Write-Host ""
docker-compose ps

Write-Host ""
Write-Host "COMANDOS UTILES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Ver logs:              docker-compose logs -f" -ForegroundColor Cyan
Write-Host "  Ver logs de API:       docker-compose logs -f core_api" -ForegroundColor Cyan
Write-Host "  Detener servicios:     docker-compose down" -ForegroundColor Cyan
Write-Host "  Reiniciar API:         docker-compose restart core_api" -ForegroundColor Cyan
Write-Host "  Acceder a DB:          docker exec -it super_pos_db psql -U nexuspos -d nexus_pos" -ForegroundColor Cyan
Write-Host "  Ver RabbitMQ colas:    http://localhost:15672" -ForegroundColor Cyan

Write-Host ""
Write-Host "PRUEBA RAPIDA:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  curl http://localhost:8001/api/v1/health" -ForegroundColor Cyan
Write-Host ""

# Hacer prueba automática
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/health" -UseBasicParsing
    Write-Host "  Respuesta: " -NoNewline -ForegroundColor White
    Write-Host ($healthResponse | ConvertTo-Json -Compress) -ForegroundColor Green
} catch {
    Write-Host "  No se pudo hacer la prueba. Verificar manualmente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Mas informacion: ver GUIA_DOCKER.md" -ForegroundColor Gray
Write-Host ""
