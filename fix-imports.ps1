# Fix Python Imports - Remover "app." de imports
# Ejecutar desde la raíz del proyecto

$targetDir = "core-api"
$files = Get-ChildItem -Path $targetDir -Recurse -Filter "*.py"

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Reemplazar "from app." con "from "
    $content = $content -replace 'from app\.', 'from '
    
    # Reemplazar "import app." con "import "
    $content = $content -replace 'import app\.', 'import '
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "[FIX] $($file.FullName)" -ForegroundColor Green
        $count++
    }
}

Write-Host "`n✅ Archivos modificados: $count" -ForegroundColor Cyan
