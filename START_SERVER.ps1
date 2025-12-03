# Script PowerShell para iniciar el servidor FastAPI
# Ejecutar: .\START_SERVER.ps1

Set-Location "c:\Users\juani\Desktop\Proyecto-POS\core-api"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Iniciando Nexus POS API Server" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Puerto: 8000" -ForegroundColor Yellow
Write-Host "Docs: http://localhost:8000/api/v1/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Red
Write-Host ""

# Ejecutar uvicorn
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Read-Host "Presiona Enter para salir"
