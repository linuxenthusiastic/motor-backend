#!/bin/bash
set -e

echo "🌱 Corriendo seed..."
python seed.py

echo "🚀 Iniciando servidor..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
