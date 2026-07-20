$ErrorActionPreference = "Stop"
$rutaProyecto = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rutaProyecto'; npm.cmd run desarrollo:prediccion"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rutaProyecto'; npm.cmd run desarrollo:servidor"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rutaProyecto'; npm.cmd run desarrollo:cliente"

Write-Host "Servicios iniciados:" -ForegroundColor Green
Write-Host "Prediccion Node: http://localhost:8000"
Write-Host "Express:         http://localhost:3001"
Write-Host "React:           http://localhost:5173"
