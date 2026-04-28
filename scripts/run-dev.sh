#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

docker compose up -d postgis

printf '%s\n' "PostGIS is starting at localhost:5432"
printf '%s\n' "Database: road_infra_gis, user: roadgis"
printf '%s\n' "Run scripts/seed-db.sh to load sample GeoJSON data."
