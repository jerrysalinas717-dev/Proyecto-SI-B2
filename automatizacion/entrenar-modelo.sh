#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node procesamiento-datos/aprendizaje/entrenar_modelo.mjs
