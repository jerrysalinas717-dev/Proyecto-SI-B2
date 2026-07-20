$ErrorActionPreference = "Stop"
$rutaProyecto = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $rutaProyecto
try {
  node procesamiento-datos\etl\ejecutar_etl.mjs @args
} finally {
  Pop-Location
}
