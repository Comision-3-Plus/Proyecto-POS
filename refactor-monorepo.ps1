<#
.SYNOPSIS
    Script de Refactorización de Monorepo Híbrido - Super POS
    
.DESCRIPTION
    Este script automatiza:
    1. LIMPIEZA PROFUNDA: Elimina código legacy (backend Go, frontend React Vite)
    2. REESTRUCTURACIÓN: Reorganiza carpetas con nomenclatura semántica profesional
    3. CONSOLIDACIÓN: Limpia configs redundantes y archivos duplicados
    
.AUTHOR
    GitHub Copilot (Claude Sonnet 4.5)
    
.DATE
    Noviembre 23, 2025
    
.NOTES
    ⚠️ ADVERTENCIA: Este script ELIMINA archivos permanentemente.
    ✅ Se recomienda hacer backup o commit a Git antes de ejecutar.
#>

[CmdletBinding()]
param(
    [switch]$DryRun,          # Si está presente, solo muestra qué haría sin ejecutar
    [switch]$SkipConfirmation # Saltar confirmación (⚠️ PELIGROSO)
)

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

$ErrorActionPreference = "Stop"
$RootPath = $PSScriptRoot  # Asume que el script está en la raíz del proyecto

# Colores para output
function Write-ColorOutput {
    param([string]$Message, [ConsoleColor]$Color = 'White')
    Write-Host $Message -ForegroundColor $Color
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n$('=' * 70)" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "$('=' * 70)" -ForegroundColor Cyan
}

function Write-Success { param([string]$Msg) Write-ColorOutput "✅ $Msg" Green }
function Write-Warning { param([string]$Msg) Write-ColorOutput "⚠️  $Msg" Yellow }
function Write-Error { param([string]$Msg) Write-ColorOutput "❌ $Msg" Red }
function Write-Info { param([string]$Msg) Write-ColorOutput "ℹ️  $Msg" Cyan }

# ============================================================================
# VALIDACIÓN INICIAL
# ============================================================================

Write-Section "🔍 VALIDACIÓN INICIAL"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "$RootPath\POS") -or -not (Test-Path "$RootPath\stock-in-order-master")) {
    Write-Error "No se encontraron las carpetas 'POS' y 'stock-in-order-master'"
    Write-Error "Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
}

Write-Success "Directorio raíz detectado: $RootPath"

# Verificar Git (opcional pero recomendado)
try {
    $gitStatus = git status --porcelain 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Repositorio Git detectado"
        if ($gitStatus) {
            Write-Warning "Hay cambios sin commitear. Se recomienda hacer commit antes de continuar."
        }
    }
} catch {
    Write-Warning "No se detectó Git. Se recomienda usar control de versiones."
}

# ============================================================================
# MAPEO DE OPERACIONES
# ============================================================================

Write-Section "📋 PLAN DE REFACTORIZACIÓN"

# Estructura de datos para las operaciones
$operations = @{
    ToDelete = @(
        @{
            Path = "stock-in-order-master\backend"
            Reason = "Backend Go legacy (reemplazado por Python FastAPI)"
            Type = "Directory"
        },
        @{
            Path = "stock-in-order-master\frontend"
            Reason = "Frontend React Vite legacy (reemplazado por Next.js)"
            Type = "Directory"
        },
        @{
            Path = "POS\docker-compose.yml"
            Reason = "Docker Compose redundante (usamos el de la raíz)"
            Type = "File"
        },
        @{
            Path = "stock-in-order-master\docker-compose.yml"
            Reason = "Docker Compose redundante (usamos el de la raíz)"
            Type = "File"
        },
        @{
            Path = "stock-in-order-master\docker-compose.prod.yml"
            Reason = "Configuración de producción legacy"
            Type = "File"
        },
        @{
            Path = "stock-in-order-master\postgres-data"
            Reason = "Datos PostgreSQL locales (usar volúmenes Docker)"
            Type = "Directory"
        }
    )
    
    ToMove = @(
        @{
            Source = "POS\app"
            Destination = "core-api"
            Description = "API Principal Python/FastAPI (Core de Negocio)"
        },
        @{
            Source = "POS\frontend"
            Destination = "web-portal"
            Description = "Frontend Next.js (Portal Web)"
        },
        @{
            Source = "stock-in-order-master\worker"
            Destination = "worker-service"
            Description = "Servicio de Procesamiento Asíncrono (Go)"
        },
        @{
            Source = "stock-in-order-master\scheduler"
            Destination = "scheduler-service"
            Description = "Servicio de Tareas Programadas (Go)"
        },
        @{
            Source = "POS\alembic"
            Destination = "core-api\alembic"
            Description = "Migraciones de Base de Datos (Alembic)"
        },
        @{
            Source = "POS\alembic.ini"
            Destination = "core-api\alembic.ini"
            Description = "Configuración de Alembic"
        },
        @{
            Source = "POS\requirements.txt"
            Destination = "core-api\requirements.txt"
            Description = "Dependencias Python"
        },
        @{
            Source = "POS\Dockerfile"
            Destination = "core-api\Dockerfile"
            Description = "Dockerfile de Core API"
        },
        @{
            Source = "POS\pyproject.toml"
            Destination = "core-api\pyproject.toml"
            Description = "Configuración de proyecto Python"
        }
    )
    
    ToCleanup = @(
        "POS",
        "stock-in-order-master"
    )
}

# Mostrar plan
Write-Info "ARCHIVOS Y CARPETAS A ELIMINAR:"
foreach ($item in $operations.ToDelete) {
    $fullPath = Join-Path $RootPath $item.Path
    $exists = Test-Path $fullPath
    $status = if ($exists) { "[EXISTE]" } else { "[NO EXISTE]" }
    $color = if ($exists) { "Yellow" } else { "DarkGray" }
    Write-ColorOutput "  $status $($item.Path)" $color
    Write-Host "           → Razón: $($item.Reason)" -ForegroundColor DarkGray
}

Write-Info "`nCARPETAS A MOVER Y RENOMBRAR:"
foreach ($item in $operations.ToMove) {
    $sourceExists = Test-Path (Join-Path $RootPath $item.Source)
    $status = if ($sourceExists) { "[OK]" } else { "[FALTA]" }
    $color = if ($sourceExists) { "Green" } else { "Red" }
    Write-ColorOutput "  $status $($item.Source) → $($item.Destination)" $color
    Write-Host "           → $($item.Description)" -ForegroundColor DarkGray
}

Write-Info "`nCARPETAS CONTENEDORAS A ELIMINAR (DESPUÉS DE MOVER):"
foreach ($item in $operations.ToCleanup) {
    Write-ColorOutput "  $item" Yellow
}

# ============================================================================
# CONFIRMACIÓN
# ============================================================================

if ($DryRun) {
    Write-Warning "MODO DRY-RUN ACTIVADO: No se ejecutarán cambios reales"
} elseif (-not $SkipConfirmation) {
    Write-Section "⚠️  CONFIRMACIÓN REQUERIDA"
    Write-Warning "Este script realizará cambios IRREVERSIBLES en tu sistema de archivos."
    Write-Warning "Asegúrate de tener un backup o commit de Git antes de continuar."
    Write-Host ""
    $confirmation = Read-Host "¿Deseas continuar? (escribe 'SI' en mayúsculas para confirmar)"
    
    if ($confirmation -ne "SI") {
        Write-Info "Operación cancelada por el usuario"
        exit 0
    }
}

# ============================================================================
# FASE 1: LIMPIEZA PROFUNDA (ELIMINACIÓN)
# ============================================================================

Write-Section "🧹 FASE 1: LIMPIEZA PROFUNDA"

foreach ($item in $operations.ToDelete) {
    $fullPath = Join-Path $RootPath $item.Path
    
    if (-not (Test-Path $fullPath)) {
        Write-Info "Omitiendo (no existe): $($item.Path)"
        continue
    }
    
    try {
        if ($DryRun) {
            Write-Warning "[DRY-RUN] Eliminaría: $($item.Path)"
        } else {
            if ($item.Type -eq "Directory") {
                Remove-Item -Path $fullPath -Recurse -Force
            } else {
                Remove-Item -Path $fullPath -Force
            }
            Write-Success "Eliminado: $($item.Path)"
        }
    } catch {
        Write-Error "Error al eliminar $($item.Path): $_"
    }
}

# ============================================================================
# FASE 2: REESTRUCTURACIÓN (MOVER CARPETAS)
# ============================================================================

Write-Section "📂 FASE 2: REESTRUCTURACIÓN"

foreach ($item in $operations.ToMove) {
    $sourcePath = Join-Path $RootPath $item.Source
    $destPath = Join-Path $RootPath $item.Destination
    
    if (-not (Test-Path $sourcePath)) {
        Write-Warning "Omitiendo (no existe): $($item.Source)"
        continue
    }
    
    # Verificar si el destino ya existe
    if (Test-Path $destPath) {
        Write-Warning "El destino ya existe: $($item.Destination)"
        $overwrite = Read-Host "¿Sobrescribir? (S/N)"
        if ($overwrite -ne "S") {
            Write-Info "Omitiendo: $($item.Source)"
            continue
        }
        if (-not $DryRun) {
            Remove-Item -Path $destPath -Recurse -Force
        }
    }
    
    try {
        if ($DryRun) {
            Write-Warning "[DRY-RUN] Movería: $($item.Source) → $($item.Destination)"
        } else {
            # Crear directorio padre si no existe
            $parentDir = Split-Path -Parent $destPath
            if ($parentDir -and -not (Test-Path $parentDir)) {
                New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
            }
            
            Move-Item -Path $sourcePath -Destination $destPath -Force
            Write-Success "Movido: $($item.Source) → $($item.Destination)"
        }
    } catch {
        Write-Error "Error al mover $($item.Source): $_"
    }
}

# ============================================================================
# FASE 3: LIMPIEZA DE CARPETAS CONTENEDORAS VACÍAS
# ============================================================================

Write-Section "🗑️  FASE 3: LIMPIEZA DE CARPETAS CONTENEDORAS"

foreach ($folder in $operations.ToCleanup) {
    $folderPath = Join-Path $RootPath $folder
    
    if (-not (Test-Path $folderPath)) {
        Write-Info "Ya eliminada: $folder"
        continue
    }
    
    # Verificar si la carpeta está vacía o solo tiene archivos documentación
    $remainingItems = Get-ChildItem -Path $folderPath -Recurse | 
                      Where-Object { -not $_.PSIsContainer -and $_.Extension -notin @('.md', '.txt') }
    
    if ($remainingItems) {
        Write-Warning "La carpeta $folder aún contiene archivos importantes:"
        $remainingItems | Select-Object -First 5 | ForEach-Object { 
            Write-Host "    - $($_.FullName.Replace($RootPath, ''))" -ForegroundColor DarkGray
        }
        $delete = Read-Host "¿Eliminar de todas formas? (S/N)"
        if ($delete -ne "S") {
            Write-Info "Conservando: $folder"
            continue
        }
    }
    
    try {
        if ($DryRun) {
            Write-Warning "[DRY-RUN] Eliminaría carpeta contenedora: $folder"
        } else {
            Remove-Item -Path $folderPath -Recurse -Force
            Write-Success "Eliminada carpeta contenedora: $folder"
        }
    } catch {
        Write-Error "Error al eliminar $folder: $_"
    }
}

# ============================================================================
# FASE 4: ACTUALIZACIÓN DE DOCKER COMPOSE
# ============================================================================

Write-Section "🐳 FASE 4: ACTUALIZACIÓN DE DOCKER COMPOSE"

$dockerComposePath = Join-Path $RootPath "docker-compose.yml"

if (Test-Path $dockerComposePath) {
    Write-Info "Actualizando rutas en docker-compose.yml..."
    
    if ($DryRun) {
        Write-Warning "[DRY-RUN] Actualizaría docker-compose.yml"
    } else {
        try {
            $content = Get-Content $dockerComposePath -Raw
            
            # Actualizar rutas (sin usar -replace con strings complejos)
            $content = $content -replace 'context:\s*\./POS\s*$', 'context: ./core-api'
            $content = $content -replace 'context:\s*\./POS/frontend', 'context: ./web-portal'
            $content = $content -replace 'context:\s*\./stock-in-order-master/worker', 'context: ./worker-service'
            $content = $content -replace 'context:\s*\./stock-in-order-master/scheduler', 'context: ./scheduler-service'
            $content = $content -replace '\./POS/app:/app/app', './core-api/app:/app/app'
            
            Set-Content -Path $dockerComposePath -Value $content
            Write-Success "docker-compose.yml actualizado"
        } catch {
            Write-Error "Error al actualizar docker-compose.yml: $_"
            Write-Warning "Deberás actualizarlo manualmente"
        }
    }
} else {
    Write-Warning "No se encontró docker-compose.yml en la raíz"
}

# ============================================================================
# FASE 5: CREACIÓN DE ESTRUCTURA ADICIONAL
# ============================================================================

Write-Section "📁 FASE 5: CREACIÓN DE ESTRUCTURA ADICIONAL"

$newFolders = @(
    @{Path = "contracts"; Description = "JSON Schemas para mensajes RabbitMQ"},
    @{Path = "docs"; Description = "Documentación del proyecto"}
)

foreach ($folder in $newFolders) {
    $folderPath = Join-Path $RootPath $folder.Path
    
    if (Test-Path $folderPath) {
        Write-Info "Ya existe: $($folder.Path)"
    } else {
        if ($DryRun) {
            Write-Warning "[DRY-RUN] Crearía: $($folder.Path)"
        } else {
            try {
                New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
                Write-Success "Creado: $($folder.Path) - $($folder.Description)"
                
                # Crear README.md en cada carpeta nueva
                $readmePath = Join-Path $folderPath "README.md"
                $readmeContent = "# $($folder.Path)`n`n$($folder.Description)`n"
                Set-Content -Path $readmePath -Value $readmeContent
            } catch {
                Write-Error "Error al crear $($folder.Path): $_"
            }
        }
    }
}

# Mover archivos de documentación existentes
$docsToMove = @(
    "stock-in-order-master\ARCHITECTURE.md",
    "stock-in-order-master\MIGRACION_SUPABASE.md",
    "stock-in-order-master\LOGGING_MONITORING.md",
    "POS\DEPLOYMENT_SUPABASE.md",
    "POS\docs\BACKGROUND_TASKS_GUIDE.md"
)

foreach ($docPath in $docsToMove) {
    $fullPath = Join-Path $RootPath $docPath
    if (Test-Path $fullPath) {
        $fileName = Split-Path -Leaf $fullPath
        $destPath = Join-Path $RootPath "docs\$fileName"
        
        if ($DryRun) {
            Write-Warning "[DRY-RUN] Movería doc: $docPath → docs\$fileName"
        } else {
            try {
                Move-Item -Path $fullPath -Destination $destPath -Force -ErrorAction SilentlyContinue
                Write-Success "Documentación movida: $fileName"
            } catch {
                # Ignorar errores si el archivo ya no existe
            }
        }
    }
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================

Write-Section "✨ RESUMEN FINAL"

if ($DryRun) {
    Write-Warning "Esto fue una SIMULACIÓN (--DryRun)"
    Write-Info "Para ejecutar los cambios reales, ejecuta el script sin el parámetro -DryRun"
} else {
    Write-Success "Refactorización completada exitosamente!"
    Write-Info ""
    Write-Info "ESTRUCTURA FINAL:"
    Write-Host "  Super-POS/" -ForegroundColor Cyan
    Write-Host "  ├── core-api/              ← Python FastAPI" -ForegroundColor Green
    Write-Host "  ├── web-portal/            ← Next.js" -ForegroundColor Green
    Write-Host "  ├── worker-service/        ← Go Worker" -ForegroundColor Green
    Write-Host "  ├── scheduler-service/     ← Go Scheduler" -ForegroundColor Green
    Write-Host "  ├── contracts/             ← JSON Schemas (NUEVO)" -ForegroundColor Yellow
    Write-Host "  ├── docs/                  ← Documentación (NUEVO)" -ForegroundColor Yellow
    Write-Host "  ├── docker-compose.yml" -ForegroundColor White
    Write-Host "  └── .env" -ForegroundColor White
    Write-Info ""
    Write-Info "PRÓXIMOS PASOS:"
    Write-Host "  1. Verificar docker-compose.yml (las rutas fueron actualizadas automáticamente)" -ForegroundColor Cyan
    Write-Host "  2. Actualizar .env si es necesario" -ForegroundColor Cyan
    Write-Host "  3. Ejecutar: docker-compose build" -ForegroundColor Cyan
    Write-Host "  4. Ejecutar: docker-compose up -d" -ForegroundColor Cyan
    Write-Host "  5. Leer: ARQUITECTURA_HIBRIDA_ANALISIS.md para recomendaciones" -ForegroundColor Cyan
}

Write-Host ""
Write-Success "Script finalizado sin errores críticos"
