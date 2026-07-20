#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --version
npm --version
npm run instalar:todo
[[ -f servidor/.env ]] || cp servidor/.env.example servidor/.env
[[ -f cliente-web/.env ]] || cp cliente-web/.env.example cliente-web/.env
[[ -f procesamiento-datos/.env ]] || cp procesamiento-datos/.env.example procesamiento-datos/.env
echo "Edita los archivos .env y ejecuta los scripts de base-datos-postgres con psql."
