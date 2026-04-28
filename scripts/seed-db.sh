#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SERVICE_NAME="postgis"
DB_NAME="road_infra_gis"
DB_USER="roadgis"

docker compose up -d "$SERVICE_NAME"

printf '%s\n' "Waiting for PostGIS..."
for _ in {1..30}; do
  if docker compose exec -T "$SERVICE_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

docker compose exec -T "$SERVICE_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null

docker compose exec -T "$SERVICE_NAME" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" <<'SQL'
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS sample_data;

CREATE TABLE IF NOT EXISTS sample_data.roads (
  feature_id text PRIMARY KEY,
  road_number text NOT NULL,
  status text NOT NULL,
  properties jsonb NOT NULL,
  geom geometry(LineString, 4326) NOT NULL
);

CREATE TABLE IF NOT EXISTS sample_data.reference_segments (
  feature_id text PRIMARY KEY,
  road_number text NOT NULL,
  status text NOT NULL,
  properties jsonb NOT NULL,
  geom geometry(LineString, 4326) NOT NULL
);

CREATE TABLE IF NOT EXISTS sample_data.barriers (
  feature_id text PRIMARY KEY,
  road_number text NOT NULL,
  status text NOT NULL,
  properties jsonb NOT NULL,
  geom geometry(LineString, 4326) NOT NULL
);

CREATE TABLE IF NOT EXISTS sample_data.traffic_stations (
  feature_id text PRIMARY KEY,
  road_number text NOT NULL,
  status text NOT NULL,
  properties jsonb NOT NULL,
  geom geometry(Point, 4326) NOT NULL
);

CREATE TABLE IF NOT EXISTS sample_data.parcels (
  feature_id text PRIMARY KEY,
  related_road text NOT NULL,
  status text NOT NULL,
  properties jsonb NOT NULL,
  geom geometry(Polygon, 4326) NOT NULL
);

TRUNCATE TABLE
  sample_data.roads,
  sample_data.reference_segments,
  sample_data.barriers,
  sample_data.traffic_stations,
  sample_data.parcels;

WITH source AS (
  SELECT pg_read_file('/sample-data/roads.geojson')::jsonb AS data
),
features AS (
  SELECT jsonb_array_elements(data->'features') AS feature
  FROM source
)
INSERT INTO sample_data.roads (feature_id, road_number, status, properties, geom)
SELECT
  COALESCE(feature->>'id', feature->'properties'->>'road_id'),
  feature->'properties'->>'road_number',
  COALESCE(feature->'properties'->>'status', 'active'),
  feature->'properties',
  ST_SetSRID(ST_GeomFromGeoJSON((feature->'geometry')::text), 4326)::geometry(LineString, 4326)
FROM features;

WITH source AS (
  SELECT pg_read_file('/sample-data/reference-segments.geojson')::jsonb AS data
),
features AS (
  SELECT jsonb_array_elements(data->'features') AS feature
  FROM source
)
INSERT INTO sample_data.reference_segments (feature_id, road_number, status, properties, geom)
SELECT
  COALESCE(feature->>'id', feature->'properties'->>'segment_id'),
  feature->'properties'->>'road_number',
  COALESCE(feature->'properties'->>'status', 'active'),
  feature->'properties',
  ST_SetSRID(ST_GeomFromGeoJSON((feature->'geometry')::text), 4326)::geometry(LineString, 4326)
FROM features;

WITH source AS (
  SELECT pg_read_file('/sample-data/barriers.geojson')::jsonb AS data
),
features AS (
  SELECT jsonb_array_elements(data->'features') AS feature
  FROM source
)
INSERT INTO sample_data.barriers (feature_id, road_number, status, properties, geom)
SELECT
  COALESCE(feature->>'id', feature->'properties'->>'object_id'),
  feature->'properties'->>'road_number',
  COALESCE(feature->'properties'->>'status', 'active'),
  feature->'properties',
  ST_SetSRID(ST_GeomFromGeoJSON((feature->'geometry')::text), 4326)::geometry(LineString, 4326)
FROM features;

WITH source AS (
  SELECT pg_read_file('/sample-data/traffic-stations.geojson')::jsonb AS data
),
features AS (
  SELECT jsonb_array_elements(data->'features') AS feature
  FROM source
)
INSERT INTO sample_data.traffic_stations (feature_id, road_number, status, properties, geom)
SELECT
  COALESCE(feature->>'id', feature->'properties'->>'station_id'),
  feature->'properties'->>'road_number',
  COALESCE(feature->'properties'->>'status', 'active'),
  feature->'properties',
  ST_SetSRID(ST_GeomFromGeoJSON((feature->'geometry')::text), 4326)::geometry(Point, 4326)
FROM features;

WITH source AS (
  SELECT pg_read_file('/sample-data/parcels.geojson')::jsonb AS data
),
features AS (
  SELECT jsonb_array_elements(data->'features') AS feature
  FROM source
)
INSERT INTO sample_data.parcels (feature_id, related_road, status, properties, geom)
SELECT
  COALESCE(feature->>'id', feature->'properties'->>'parcel_id'),
  COALESCE(feature->'properties'->>'related_road', feature->'properties'->>'road_number'),
  COALESCE(feature->'properties'->>'status', 'active'),
  feature->'properties',
  ST_SetSRID(ST_GeomFromGeoJSON((feature->'geometry')::text), 4326)::geometry(Polygon, 4326)
FROM features;

SELECT 'barriers' AS layer, count(*) AS features FROM sample_data.barriers
UNION ALL
SELECT 'parcels' AS layer, count(*) AS features FROM sample_data.parcels
UNION ALL
SELECT 'reference_segments' AS layer, count(*) AS features FROM sample_data.reference_segments
UNION ALL
SELECT 'roads' AS layer, count(*) AS features FROM sample_data.roads
UNION ALL
SELECT 'traffic_stations' AS layer, count(*) AS features FROM sample_data.traffic_stations
ORDER BY layer;
SQL

printf '%s\n' "Sample data loaded into schema sample_data."
