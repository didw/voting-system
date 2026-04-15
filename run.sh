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
npm run dev
