# Script para configurar Supabase rapidamente
# Ejecutar: .\setup_supabase.ps1

Write-Host "`n=== CONFIGURACION DE SUPABASE ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si .env existe
if (Test-Path .env) {
    Write-Host "Ya existe un archivo .env" -ForegroundColor Yellow
    $response = Read-Host "Deseas sobrescribirlo? (s/N)"
    if ($response -ne "s" -and $response -ne "S") {
        Write-Host "Cancelado." -ForegroundColor Red
        exit
    }
}

Write-Host "`nPor favor, proporciona tus credenciales de Supabase:" -ForegroundColor Green
Write-Host "(Las encontraras en: https://app.supabase.com/project/_/settings/database)`n"

# Solicitar datos
$projectRef = Read-Host "Project Reference (ej: abcdefghijklmn)"
$password = Read-Host "Database Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
$region = Read-Host "Region (ej: sa-east-1, us-east-1)"

Write-Host "`nConfigurando .env..." -ForegroundColor Yellow

# Crear .env desde template
$envContent = @"
# ==========================================
# NEXUS POS - CONFIGURACION SUPABASE
# ==========================================
# Generado automaticamente por setup_supabase.ps1

# ==========================================
# SUPABASE DATABASE
# ==========================================
DATABASE_URL=postgresql+asyncpg://postgres.${projectRef}:${passwordPlain}@aws-0-${region}.pooler.supabase.com:6543/postgres
DATABASE_MIGRATION_URL=postgresql://postgres.${projectRef}:${passwordPlain}@aws-0-${region}.pooler.supabase.com:6543/postgres

SUPABASE_DB_HOST=db.${projectRef}.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=${passwordPlain}
SUPABASE_DB_NAME=postgres

# ==========================================
# REDIS (Usar local o Upstash)
# ==========================================
REDIS_URL=redis://localhost:6379/0

# ==========================================
# RABBITMQ (Usar local o CloudAMQP)
# ==========================================
RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# ==========================================
# SEGURIDAD (JWT)
# ==========================================
SECRET_KEY=super-secret-key-change-in-production-please-123456789
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ==========================================
# CORS (Frontend)
# ==========================================
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# ==========================================
# URLs DE LA APLICACION
# ==========================================
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# ==========================================
# CONFIGURACION DE AMBIENTE
# ==========================================
ENVIRONMENT=development
LOG_LEVEL=INFO
"@

# Guardar .env
$envContent | Out-File -FilePath .env -Encoding UTF8

Write-Host "Archivo .env creado correctamente!`n" -ForegroundColor Green

# Verificar si necesita Redis/RabbitMQ local
Write-Host "Deseas levantar Redis y RabbitMQ locales con Docker? (s/N): " -NoNewline
$useDocker = Read-Host

if ($useDocker -eq "s" -or $useDocker -eq "S") {
    Write-Host "`nLevantando Redis y RabbitMQ..." -ForegroundColor Yellow
    docker-compose up -d redis rabbitmq
    
    Write-Host "Redis y RabbitMQ corriendo!`n" -ForegroundColor Green
    Write-Host "   Redis: localhost:6379"
    Write-Host "   RabbitMQ: localhost:5672"
    Write-Host "   RabbitMQ Admin: http://localhost:15672 (guest/guest)`n"
}

# Siguiente paso: migraciones
Write-Host "`nProximo paso: Ejecutar migraciones" -ForegroundColor Cyan
Write-Host ""
Write-Host "cd core-api"
Write-Host "alembic upgrade head"
Write-Host ""

Write-Host "Setup completado! Ver SETUP_SUPABASE.md para mas detalles.`n" -ForegroundColor Green
