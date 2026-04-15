#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/3] Starting MariaDB..."
if ! systemctl is-active --quiet mariadb; then
  sudo systemctl start mariadb
  echo "  MariaDB started."
else
  echo "  MariaDB already running."
fi

echo "[2/3] Starting Mosquitto..."
if ! systemctl is-active --quiet mosquitto; then
  sudo systemctl start mosquitto
  echo "  Mosquitto started."
else
  echo "  Mosquitto already running."
fi

echo "[3/3] Starting Gateway + Dashboard..."
cd "$PROJECT_DIR"

# 기존 프로세스 정리
echo "  Stopping existing processes..."
# Next.js dev server
NEXT_PID=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$NEXT_PID" ]; then
  kill $NEXT_PID 2>/dev/null || true
  echo "  Killed dashboard (PID $NEXT_PID)"
fi
# Gateway WS server
GW_PID=$(lsof -ti :8080 2>/dev/null || true)
if [ -n "$GW_PID" ]; then
  kill $GW_PID 2>/dev/null || true
  echo "  Killed gateway (PID $GW_PID)"
fi
sleep 1

npm run dev
