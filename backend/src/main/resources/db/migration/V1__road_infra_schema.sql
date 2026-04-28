create extension if not exists postgis;
create extension if not exists pgcrypto;

create table if not exists roads (
  id uuid primary key,
  road_number varchar(16) not null unique,
  category varchar(32) not null,
  name varchar(255) not null,
  managing_authority varchar(255) not null,
  total_length_km numeric(12, 3) not null
);

create table if not exists reference_segments (
  id uuid primary key,
  road_id uuid not null references roads(id),
  segment_code varchar(64) not null unique,
  start_mileage_km numeric(12, 3) not null,
  end_mileage_km numeric(12, 3) not null,
  carriageway varchar(32) not null,
  direction varchar(64) not null,
  geometry geometry(LineString, 4326) not null,
  status varchar(32) not null,
  valid_from date not null default current_date,
  valid_to date
);

create table if not exists reference_points (
  id uuid primary key default gen_random_uuid(),
  road_id uuid not null references roads(id),
  point_code varchar(64) not null unique,
  mileage_km numeric(12, 3) not null,
  geometry geometry(Point, 4326) not null,
  point_type varchar(32) not null,
  status varchar(32) not null
);

create table if not exists infrastructure_objects (
  id uuid primary key,
  object_type varchar(64) not null,
  object_code varchar(96) not null unique,
  name varchar(255) not null,
  road_id uuid references roads(id),
  reference_segment_id uuid references reference_segments(id),
  global_mileage_from numeric(12, 3),
  global_mileage_to numeric(12, 3),
  local_mileage_from numeric(12, 3),
  local_mileage_to numeric(12, 3),
  geometry geometry(Geometry, 4326),
  geometry_type varchar(32) not null,
  owner varchar(255),
  branch varchar(128),
  district varchar(128),
  status varchar(64) not null,
  validation_status varchar(96) not null,
  draft_status varchar(96) not null,
  valid_from date not null default current_date,
  valid_to date,
  created_by varchar(128) not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  attributes jsonb not null default '{}'::jsonb
);

create table if not exists draft_workspaces (
  id uuid primary key,
  name varchar(255) not null,
  created_by varchar(128) not null,
  scope_geometry geometry(Geometry, 4326),
  status varchar(64) not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists draft_object_states (
  id uuid primary key,
  workspace_id uuid not null references draft_workspaces(id) on delete cascade,
  object_id uuid not null references infrastructure_objects(id),
  edit_status varchar(96) not null,
  validation_status varchar(96) not null,
  original_snapshot jsonb not null,
  current_snapshot jsonb not null,
  changed_by varchar(128) not null,
  changed_at timestamptz not null default now(),
  unique (workspace_id, object_id)
);

create table if not exists change_history (
  id uuid primary key,
  object_id uuid not null references infrastructure_objects(id),
  operation_type varchar(64) not null,
  field_name varchar(128),
  old_value text,
  new_value text,
  changed_by varchar(128) not null,
  changed_at timestamptz not null default now(),
  reason text
);

create table if not exists validation_issues (
  id uuid primary key,
  object_id uuid not null references infrastructure_objects(id) on delete cascade,
  severity varchar(32) not null,
  issue_type varchar(96) not null,
  field_name varchar(128),
  message text not null,
  geometry_marker geometry(Geometry, 4326),
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

create table if not exists report_definitions (
  id uuid primary key default gen_random_uuid(),
  report_code varchar(64) not null unique,
  report_name varchar(255) not null,
  report_type varchar(64) not null,
  parameters_schema jsonb not null default '{}'::jsonb
);

create table if not exists import_jobs (
  id uuid primary key,
  import_type varchar(32) not null,
  source_name varchar(255) not null,
  status varchar(32) not null,
  imported_count integer not null default 0,
  rejected_count integer not null default 0,
  created_at timestamptz not null default now(),
  error_report jsonb not null default '{}'::jsonb
);

create table if not exists export_jobs (
  id uuid primary key default gen_random_uuid(),
  export_type varchar(64) not null,
  format varchar(32) not null,
  status varchar(32) not null,
  created_by varchar(128) not null,
  created_at timestamptz not null default now(),
  download_path varchar(512)
);

create table if not exists layer_catalog (
  layer_code varchar(64) primary key,
  layer_name varchar(128) not null,
  group_name varchar(128) not null,
  geometry_type varchar(32) not null,
  visible_by_default boolean not null default true,
  min_scale_label varchar(64) not null default 'bez limitu',
  style_hint varchar(128) not null,
  sort_order integer not null
);

create index if not exists idx_reference_segments_geometry on reference_segments using gist (geometry);
create index if not exists idx_infrastructure_objects_geometry on infrastructure_objects using gist (geometry);
create index if not exists idx_infrastructure_objects_type on infrastructure_objects(object_type);
create index if not exists idx_validation_issues_object on validation_issues(object_id);

insert into roads (id, road_number, category, name, managing_authority, total_length_km) values
  ('00000000-0000-0000-0000-000000000007', 'DK7', 'KRAJOWA', 'Droga krajowa nr 7 - odcinek testowy Warszawa', 'GDDKiA Centrala / Oddzial Warszawa', 24.800),
  ('00000000-0000-0000-0000-000000000079', 'DK79', 'KRAJOWA', 'Droga krajowa nr 79 - odcinek testowy Warszawa', 'GDDKiA Centrala / Oddzial Warszawa', 18.600),
  ('00000000-0000-0000-0000-000000000700', 'S7', 'KRAJOWA', 'Droga ekspresowa S7 - odcinek testowy Warszawa', 'GDDKiA Oddzial Warszawa', 31.400),
  ('00000000-0000-0000-0000-000000000721', 'DW721', 'WOJEWODZKA', 'Droga wojewodzka 721 - obszar testowy', 'Mazowiecki Zarzad Drog Wojewodzkich', 12.300)
on conflict (id) do nothing;

insert into reference_segments (
  id, road_id, segment_code, start_mileage_km, end_mileage_km, carriageway, direction, geometry, status, valid_from
) values
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000007', 'DK7-WAW-001', 12.000, 14.800, 'PRAWA', 'rosnacy kilometraz', ST_GeomFromText('LINESTRING(20.907 52.165,20.942 52.191,20.984 52.220)', 4326), 'AKTYWNY', date '2024-01-01'),
  ('00000000-0000-0000-0001-000000000079', '00000000-0000-0000-0000-000000000079', 'DK79-WAW-001', 5.400, 9.900, 'JEDNA', 'rosnacy kilometraz', ST_GeomFromText('LINESTRING(21.015 52.170,21.055 52.190,21.096 52.212)', 4326), 'AKTYWNY', date '2024-01-01'),
  ('00000000-0000-0000-0001-000000000700', '00000000-0000-0000-0000-000000000700', 'S7-WAW-001', 20.000, 23.750, 'PRAWA', 'rosnacy kilometraz', ST_GeomFromText('LINESTRING(20.900 52.240,20.935 52.267,20.970 52.292)', 4326), 'AKTYWNY', date '2024-01-01'),
  ('00000000-0000-0000-0001-000000000721', '00000000-0000-0000-0000-000000000721', 'DW721-WAW-001', 1.200, 4.600, 'JEDNA', 'rosnacy kilometraz', ST_GeomFromText('LINESTRING(20.890 52.100,20.940 52.112,20.990 52.125)', 4326), 'AKTYWNY', date '2024-01-01')
on conflict (id) do nothing;

insert into reference_points (id, road_id, point_code, mileage_km, geometry, point_type, status) values
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000007', 'DK7-RP-12+000', 12.000, ST_GeomFromText('POINT(20.907 52.165)', 4326), 'PODSTAWOWY', 'AKTYWNY'),
  ('00000000-0000-0000-0002-000000000079', '00000000-0000-0000-0000-000000000079', 'DK79-RP-5+400', 5.400, ST_GeomFromText('POINT(21.015 52.170)', 4326), 'PODSTAWOWY', 'AKTYWNY'),
  ('00000000-0000-0000-0002-000000000700', '00000000-0000-0000-0000-000000000700', 'S7-RP-20+000', 20.000, ST_GeomFromText('POINT(20.900 52.240)', 4326), 'PODSTAWOWY', 'AKTYWNY')
on conflict (id) do nothing;

insert into infrastructure_objects (
  id, object_type, object_code, name, road_id, reference_segment_id,
  global_mileage_from, global_mileage_to, local_mileage_from, local_mileage_to,
  geometry, geometry_type, owner, branch, district, status, validation_status, draft_status,
  valid_from, created_by, attributes
) values
  (
    '10000000-0000-0000-0000-000000000001', 'ROAD_BARRIER', 'BAR-DK7-012-450-P',
    'Bariera energochlonna DK7 km 12+450-12+820',
    '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-000000000007',
    12.450, 12.820, 0.450, 0.820,
    ST_GeomFromText('LINESTRING(20.914 52.171,20.922 52.176)', 4326), 'LINESTRING',
    'Skarb Panstwa', 'Oddzial Warszawa', 'Rejon Warszawa', 'AKTYWNY', 'OK', 'NIE_DOTYCZY',
    date '2024-01-01', 'seed',
    '{"material":"stal","side":"P","lengthM":370,"protectionClass":"H2","conditionRating":"dobry"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000002', 'TRAFFIC_COUNTING_STATION', 'SCPR-DK79-006-200',
    'Stacja ciaglego pomiaru ruchu DK79 km 6+200',
    '00000000-0000-0000-0000-000000000079', '00000000-0000-0000-0001-000000000079',
    6.200, 6.200, 0.800, 0.800,
    ST_GeomFromText('POINT(21.027 52.176)', 4326), 'POINT',
    'GDDKiA', 'Oddzial Warszawa', 'Rejon Warszawa', 'AKTYWNY', 'OK', 'NIE_DOTYCZY',
    date '2024-01-01', 'seed',
    '{"stationClass":"SCPR","stationName":"Warszawa DK79 Zachod","deviceSymbol":"RPP-7","deviceId":"DK79-WAW-062","powerType":"sieciowe","communicationType":"LTE","detectorType":"petla indukcyjna","countingDirection":"obie","active":true}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000003', 'TECHNICAL_CHANNEL', 'KT-S7-021-100',
    'Kanal technologiczny S7 km 21+100-21+850',
    '00000000-0000-0000-0000-000000000700', '00000000-0000-0000-0001-000000000700',
    21.100, 21.850, 1.100, 1.850,
    ST_GeomFromText('LINESTRING(20.912 52.249,20.925 52.258,20.935 52.267)', 4326), 'LINESTRING',
    'GDDKiA', 'Oddzial Warszawa', 'Rejon Warszawa', 'WERYFIKOWANY', 'OSTRZEZENIE', 'W_MODYFIKACJI',
    date '2024-01-01', 'seed',
    '{"type":"rurociag kablowy","material":"HDPE","diameter":110,"lengthM":750}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000004', 'ROAD_PARCEL', 'DZ-WAW-142103-238',
    'Dzialka pasa drogowego - test Warszawa',
    '00000000-0000-0000-0000-000000000721', null,
    2.100, 2.450, null, null,
    ST_GeomFromText('POLYGON((20.915 52.106,20.940 52.110,20.936 52.119,20.910 52.115,20.915 52.106))', 4326), 'POLYGON',
    'Skarb Panstwa', 'Oddzial Warszawa', 'Rejon Warszawa', 'AKTYWNY', 'OK', 'NIE_DOTYCZY',
    date '2024-01-01', 'seed',
    '{"voivodeship":"mazowieckie","county":"warszawski","commune":"Warszawa","precinct":"Testowy","sheet":"12","parcelNumber":"238","parcelId":"142103_8.0005.238","owner":"Skarb Panstwa"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000005', 'ROAD_BARRIER', 'BAR-BEZ-SR-001',
    'Bariera bez dowiazania do SR',
    '00000000-0000-0000-0000-000000000007', null,
    13.050, 13.250, null, null,
    ST_GeomFromText('LINESTRING(20.945 52.195,20.950 52.198)', 4326), 'LINESTRING',
    'Nieustalony', 'Oddzial Warszawa', 'Rejon Warszawa', 'NOWY', 'BRAK_DOWIAZANIA_DO_SR', 'DODANY_DO_WERSJI_ROBOCZEJ',
    date '2024-01-01', 'seed',
    '{"material":"stal","side":"L","lengthM":205,"protectionClass":"N2","conditionRating":"wymaga kontroli"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000006', 'TRAFFIC_COUNTING_STATION', 'SCPR-BRAK-URZ-001',
    'Stacja pomiaru bez symbolu urzadzenia',
    '00000000-0000-0000-0000-000000000079', '00000000-0000-0000-0001-000000000079',
    8.700, 8.700, 3.300, 3.300,
    ST_GeomFromText('POINT(21.078 52.203)', 4326), 'POINT',
    'GDDKiA', 'Oddzial Warszawa', 'Rejon Warszawa', 'WERYFIKOWANY', 'BRAK_WYMAGANYCH_ATRYBUTOW', 'GOTOWY_DO_WALIDACJI',
    date '2024-01-01', 'seed',
    '{"stationClass":"SCPR","stationName":"Warszawa DK79 Wschod","powerType":"solar","communicationType":"LTE","detectorType":"radar","countingDirection":"rosnacy","active":true}'::jsonb
  )
on conflict (id) do nothing;

insert into validation_issues (id, object_id, severity, issue_type, field_name, message, geometry_marker)
select '20000000-0000-0000-0000-000000000005', id, 'BLOCKING', 'MISSING_REFERENCE_SEGMENT', 'referenceSegmentId',
       'Obiekt ewidencyjny musi byc dowiazany do odcinka systemu referencyjnego.', geometry
from infrastructure_objects
where id = '10000000-0000-0000-0000-000000000005'
on conflict (id) do nothing;

insert into validation_issues (id, object_id, severity, issue_type, field_name, message, geometry_marker)
select '20000000-0000-0000-0000-000000000006', id, 'BLOCKING', 'TRAFFIC_STATION_DEVICE_REQUIRED', 'deviceSymbol',
       'Stacja pomiaru ruchu musi miec symbol urzadzenia albo oznaczenie jako stacja inna.', geometry
from infrastructure_objects
where id = '10000000-0000-0000-0000-000000000006'
on conflict (id) do nothing;

insert into draft_workspaces (id, name, created_by, scope_geometry, status) values
  (
    '30000000-0000-0000-0000-000000000001',
    'Robocza aktualizacja barier DK7',
    'operator.warszawa',
    ST_GeomFromText('POLYGON((20.900 52.160,20.990 52.160,20.990 52.225,20.900 52.225,20.900 52.160))', 4326),
    'AKTYWNY'
  )
on conflict (id) do nothing;

insert into draft_object_states (
  id, workspace_id, object_id, edit_status, validation_status, original_snapshot, current_snapshot, changed_by
)
select
  '30000000-0000-0000-0001-000000000005',
  '30000000-0000-0000-0000-000000000001',
  io.id,
  'DODANY_DO_WERSJI_ROBOCZEJ',
  io.validation_status,
  snapshot.payload,
  snapshot.payload,
  'seed'
from infrastructure_objects io
left join roads r on r.id = io.road_id
left join reference_segments rs on rs.id = io.reference_segment_id
cross join lateral (
  select jsonb_build_object(
    'id', io.id,
    'objectType', io.object_type,
    'objectCode', io.object_code,
    'name', io.name,
    'roadId', io.road_id,
    'roadNumber', r.road_number,
    'referenceSegmentId', io.reference_segment_id,
    'referenceSegmentCode', rs.segment_code,
    'globalMileageFrom', io.global_mileage_from,
    'globalMileageTo', io.global_mileage_to,
    'localMileageFrom', io.local_mileage_from,
    'localMileageTo', io.local_mileage_to,
    'geometry', case when io.geometry is null then null else ST_AsGeoJSON(io.geometry)::jsonb end,
    'geometryType', io.geometry_type,
    'owner', io.owner,
    'branch', io.branch,
    'district', io.district,
    'status', io.status,
    'validationStatus', io.validation_status,
    'draftStatus', io.draft_status,
    'validFrom', io.valid_from,
    'validTo', io.valid_to,
    'createdBy', io.created_by,
    'createdAt', io.created_at,
    'updatedAt', io.updated_at,
    'attributes', io.attributes
  ) as payload
) snapshot
where io.id = '10000000-0000-0000-0000-000000000005'
on conflict (workspace_id, object_id) do nothing;

insert into change_history (id, object_id, operation_type, field_name, old_value, new_value, changed_by, reason) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CREATE', null, null, 'BAR-DK7-012-450-P', 'seed', 'Seed danych demonstracyjnych'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'VALIDATION', 'referenceSegmentId', null, 'BRAK_DOWIAZANIA_DO_SR', 'seed', 'Przykladowy blad walidacji do trybu roboczego')
on conflict (id) do nothing;

insert into report_definitions (report_code, report_name, report_type, parameters_schema) values
  ('VALIDATION_ISSUES', 'Raport bledow walidacji', 'VALIDATION', '{"roadNumber":"optional"}'::jsonb),
  ('ROAD_INVENTORY', 'Raport ewidencyjny drogi', 'INVENTORY', '{"roadNumber":"required"}'::jsonb),
  ('TRAFFIC_STATIONS', 'Raport stacji pomiaru ruchu', 'TRAFFIC', '{}'::jsonb),
  ('GUS_PLACEHOLDER', 'Miejsce pod sprawozdawczosc GUS', 'GUS', '{"todo":"weryfikacja formularzy GUS"}'::jsonb),
  ('ROAD_BOOK_PLACEHOLDER', 'Miejsce pod ksiazke drogi', 'ROAD_BOOK', '{"todo":"pelny zakres ksiazki drogi"}'::jsonb)
on conflict (report_code) do nothing;

insert into layer_catalog (
  layer_code, layer_name, group_name, geometry_type, visible_by_default, min_scale_label, style_hint, sort_order
) values
  ('reference-segments', 'Odcinki referencyjne', 'System referencyjny', 'LINESTRING', true, '1:500 000', 'reference-blue', 10),
  ('roads', 'Drogi', 'Drogi', 'LINESTRING', true, '1:1 000 000', 'road-network', 20),
  ('road-barriers', 'Bariery energochlonne', 'Obiekty infrastruktury', 'LINESTRING', true, '1:50 000', 'status-line', 30),
  ('traffic-stations', 'Stacje pomiaru ruchu', 'Stacje pomiaru ruchu', 'POINT', true, '1:100 000', 'traffic-point', 40),
  ('technical-channels', 'Kanaly technologiczne', 'Warstwy techniczne', 'LINESTRING', true, '1:50 000', 'technical-channel', 50),
  ('parcels', 'Dzialki pasa drogowego', 'Dzialki', 'POLYGON', true, '1:25 000', 'parcel-pink', 60),
  ('validation-issues', 'Bledy walidacji', 'Warstwy techniczne', 'GEOMETRY', true, '1:100 000', 'validation-red', 70),
  ('osm', 'OpenStreetMap', 'Podklady mapowe', 'RASTER', true, 'bez limitu', 'osm-base', 80)
on conflict (layer_code) do nothing;
