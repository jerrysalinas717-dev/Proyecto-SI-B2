@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0configurar-postgres.ps1"
pause

