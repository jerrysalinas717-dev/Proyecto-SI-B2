$ErrorActionPreference = "Stop"

$rutaProyecto = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Buscar-Psql {
  $comando = Get-Command psql.exe -ErrorAction SilentlyContinue
  if ($comando) { return $comando.Source }

  foreach ($version in 18, 17, 16, 15, 14) {
    $ruta = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
    if (Test-Path $ruta) { return $ruta }
  }

  throw "No se encontro psql.exe. Instala PostgreSQL y agrega su carpeta bin al PATH."
}

function Guardar-Utf8SinBom([string]$Ruta, [string]$Contenido) {
  $utf8SinBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Ruta, $Contenido, $utf8SinBom)
}

$rutaPsql = Buscar-Psql
Write-Host "PostgreSQL encontrado en: $rutaPsql"

$usuarioPostgres = Read-Host "Usuario de PostgreSQL (Enter para postgres)"
if ([string]::IsNullOrWhiteSpace($usuarioPostgres)) { $usuarioPostgres = "postgres" }

$contrasenaSegura = Read-Host "Contrasena del usuario $usuarioPostgres" -AsSecureString
$puntero = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($contrasenaSegura)
try {
  $contrasena = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($puntero)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($puntero)
}

if ([string]::IsNullOrWhiteSpace($contrasena)) {
  throw "La contrasena no puede estar vacia."
}

$env:PGPASSWORD = $contrasena
$secretoJwt = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))

try {
  Write-Host "Creando la base futbol_predice_bi si no existe..."
  & $rutaPsql -v ON_ERROR_STOP=1 -h localhost -p 5432 -U $usuarioPostgres -d postgres -f (Join-Path $rutaProyecto "base-datos-postgres\00_crear_base_datos.sql")
  if ($LASTEXITCODE -ne 0) { throw "No se pudo crear la base de datos." }

  Write-Host "Creando esquemas, tablas, indices y vistas..."
  Push-Location (Join-Path $rutaProyecto "base-datos-postgres")
  try {
    & $rutaPsql -v ON_ERROR_STOP=1 -h localhost -p 5432 -U $usuarioPostgres -d futbol_predice_bi -f "ejecutar_todo.sql"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo crear la estructura de PostgreSQL." }
  } finally {
    Pop-Location
  }

  $entornoServidor = @"
ENTORNO=desarrollo
PUERTO=3001
BD_SERVIDOR=localhost
BD_PUERTO=5432
BD_NOMBRE=futbol_predice_bi
BD_USUARIO=$usuarioPostgres
BD_CONTRASENA=$contrasena
BD_CIFRAR=false
BD_CONFIAR_CERTIFICADO=true
JWT_SECRETO=$secretoJwt
JWT_DURACION=8h
SERVICIO_PREDICCION_URL=http://localhost:8000
ORIGEN_PERMITIDO=http://localhost:5173,http://127.0.0.1:5173
"@

  $entornoProcesamiento = @"
BD_SERVIDOR=localhost
BD_PUERTO=5432
BD_NOMBRE=futbol_predice_bi
BD_USUARIO=$usuarioPostgres
BD_CONTRASENA=$contrasena
BD_CIFRAR=false
PUERTO_PREDICCION=8000
TAMANO_LOTE_ETL=500
LIMITE_MUESTRA_ETL=300
"@

  Guardar-Utf8SinBom (Join-Path $rutaProyecto "servidor\.env") $entornoServidor
  Guardar-Utf8SinBom (Join-Path $rutaProyecto "procesamiento-datos\.env") $entornoProcesamiento
  Guardar-Utf8SinBom (Join-Path $rutaProyecto "cliente-web\.env") "VITE_URL_API=/api`n"

  if (!(Test-Path (Join-Path $rutaProyecto "servidor\node_modules"))) {
    Write-Host "Instalando dependencias antes de crear usuarios..."
    Push-Location $rutaProyecto
    try { npm.cmd run instalar:todo } finally { Pop-Location }
  }

  Write-Host "Creando o actualizando los diez usuarios de prueba..."
  Push-Location $rutaProyecto
  try {
    npm.cmd run usuarios:prueba
    if ($LASTEXITCODE -ne 0) { throw "No se pudieron crear los usuarios de prueba." }
  } finally {
    Pop-Location
  }

  Write-Host "Probando la conexion final..."
  & $rutaPsql -v ON_ERROR_STOP=1 -h localhost -p 5432 -U $usuarioPostgres -d futbol_predice_bi -c "SELECT current_database() AS base, COUNT(*) AS usuarios FROM aplicacion.usuario;"
  if ($LASTEXITCODE -ne 0) { throw "La prueba final de PostgreSQL fallo." }

  Write-Host ""
  Write-Host "PostgreSQL quedo configurado correctamente." -ForegroundColor Green
  Write-Host "Siguiente paso: npm.cmd run etl:muestra"
  Write-Host "Despues: npm.cmd run modelo:entrenar"
  Write-Host "Finalmente: npm.cmd run desarrollo"
  Write-Host "Cliente: http://localhost:5173"
  Write-Host "Servidor: http://localhost:3001/api/salud"
  Write-Host "Prediccion: http://localhost:8000/salud"
} finally {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
  $contrasena = $null
}
