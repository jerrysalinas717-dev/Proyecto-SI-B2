$ErrorActionPreference = "Stop"
$rutaProyecto = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $rutaProyecto
try {
  Write-Host "Verificando Node.js y npm..."
  node --version
  npm.cmd --version

  Write-Host "Instalando dependencias del proyecto..."
  npm.cmd run instalar:todo

  if (!(Test-Path "servidor\.env")) {
    Copy-Item "servidor\.env.example" "servidor\.env"
  }
  if (!(Test-Path "cliente-web\.env")) {
    Copy-Item "cliente-web\.env.example" "cliente-web\.env"
  }
  if (!(Test-Path "procesamiento-datos\.env")) {
    Copy-Item "procesamiento-datos\.env.example" "procesamiento-datos\.env"
  }

  Write-Host "Dependencias instaladas." -ForegroundColor Green
  Write-Host "Ahora ejecuta: .\automatizacion\configurar-postgres.ps1"
} finally {
  Pop-Location
}
