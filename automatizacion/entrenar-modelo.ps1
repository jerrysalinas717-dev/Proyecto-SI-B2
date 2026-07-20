$ErrorActionPreference = "Stop"
$rutaProyecto = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $rutaProyecto
try {
  node procesamiento-datos\aprendizaje\entrenar_modelo.mjs
} finally {
  Pop-Location
}
