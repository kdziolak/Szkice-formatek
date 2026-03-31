INSERT INTO ref.reference_axis (
  business_id,
  road_number,
  axis_code,
  direction_code,
  axis_name,
  geometry_value,
  srid,
  valid_from,
  valid_to,
  created_at,
  created_by,
  updated_at,
  updated_by
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  N'A4',
  N'A4-E',
  N'EASTBOUND',
  N'Autostrada A4 kierunek wschodni',
  geometry::STGeomFromText('LINESTRING (500000 300000, 503000 300000)', 2180),
  2180,
  '2024-01-01T00:00:00',
  NULL,
  '2024-01-01T00:00:00',
  N'system',
  '2024-01-01T00:00:00',
  N'system'
);

INSERT INTO ref.reference_segment (
  business_id,
  reference_axis_id,
  segment_code,
  chainage_from,
  chainage_to,
  geometry_value,
  srid,
  valid_from,
  valid_to,
  created_at,
  created_by,
  updated_at,
  updated_by
)
VALUES
(
  '22222222-2222-2222-2222-222222222222',
  1,
  N'A4-E-001',
  10.000,
  20.000,
  geometry::STGeomFromText('LINESTRING (500000 300000, 501000 300000)', 2180),
  2180,
  '2024-01-01T00:00:00',
  NULL,
  '2024-01-01T00:00:00',
  N'system',
  '2024-01-01T00:00:00',
  N'system'
),
(
  '33333333-3333-3333-3333-333333333333',
  1,
  N'A4-E-002',
  25.000,
  35.000,
  geometry::STGeomFromText('LINESTRING (502000 300000, 503000 300000)', 2180),
  2180,
  '2024-01-01T00:00:00',
  NULL,
  '2024-01-01T00:00:00',
  N'system',
  '2024-01-01T00:00:00',
  N'system'
);

INSERT INTO road.road (
  business_id,
  road_number,
  road_class_code,
  road_name,
  description,
  created_at,
  created_by,
  updated_at,
  updated_by
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  N'A4',
  N'A',
  N'Autostrada A4',
  N'Sekcja testowa',
  '2024-01-01T00:00:00',
  N'system',
  '2024-01-01T00:00:00',
  N'system'
);

INSERT INTO road.road_section (
  business_id,
  road_id,
  reference_segment_id,
  section_code,
  chainage_from,
  chainage_to,
  geometry_value,
  srid,
  lifecycle_status,
  valid_from,
  valid_to,
  created_at,
  created_by,
  updated_at,
  updated_by
)
VALUES
(
  '55555555-5555-5555-5555-555555555555',
  1,
  1,
  N'A4-ODC-001',
  10.000,
  20.000,
  geometry::STGeomFromText('LINESTRING (500000 300000, 501000 300000)', 2180),
  2180,
  N'PUBLISHED',
  '2024-01-01T00:00:00',
  NULL,
  '2024-01-01T00:00:00',
  N'system',
  '2024-01-01T00:00:00',
  N'system'
),
(
  '66666666-6666-6666-6666-666666666666',
  1,
  2,
  N'A4-ODC-002',
  25.000,
  35.000,
  geometry::STGeomFromText('LINESTRING (502000 300000, 503000 300000)', 2180),
  2180,
  N'ARCHIVED',
  '2024-01-01T00:00:00',
  NULL,
  '2024-01-01T00:00:00',
  N'system',
  '2024-01-01T00:00:00',
  N'system'
);
