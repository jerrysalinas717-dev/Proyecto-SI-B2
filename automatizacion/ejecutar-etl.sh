#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node procesamiento-datos/etl/ejecutar_etl.mjs "$@"
