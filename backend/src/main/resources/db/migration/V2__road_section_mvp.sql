alter table validation_issues
  alter column object_id drop not null;

alter table validation_issues
  add column if not exists target_type varchar(64) not null default 'INFRASTRUCTURE_OBJECT',
  add column if not exists target_id uuid,
  add column if not exists target_code varchar(128);

update validation_issues vi
set target_type = 'INFRASTRUCTURE_OBJECT',
    target_id = vi.object_id,
    target_code = io.object_code
from infrastructure_objects io
where io.id = vi.object_id
  and vi.target_id is null;

create table if not exists road_sections (
  id uuid primary key,
  business_id varchar(96) not null unique,
  road_id uuid not null references roads(id),
  reference_segment_id uuid references reference_segments(id),
  section_code varchar(96) not null unique,
  name varchar(255) not null,
  kilometer_from numeric(12, 3) not null,
  kilometer_to numeric(12, 3) not null,
  carriageway varchar(32) not null,
  direction varchar(64) not null,
  geometry geometry(LineString, 4326) not null,
  status varchar(64) not null,
  validation_status varchar(96) not null,
  draft_status varchar(96) not null,
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists road_section_reference_bindings (
  id uuid primary key,
  road_section_id uuid not null references road_sections(id) on delete cascade,
  reference_segment_id uuid not null references reference_segments(id),
  mileage_from numeric(12, 3) not null,
  mileage_to numeric(12, 3) not null,
  location_method varchar(64) not null,
  consistency_status varchar(64) not null,
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now()
);

create table if not exists draft_road_section_states (
  id uuid primary key,
  workspace_id uuid not null references draft_workspaces(id) on delete cascade,
  road_section_id uuid not null references road_sections(id),
  edit_status varchar(96) not null,
  validation_status varchar(96) not null,
  original_snapshot jsonb not null,
  current_snapshot jsonb not null,
  changed_by varchar(128) not null,
  changed_at timestamptz not null default now(),
  unique (workspace_id, road_section_id)
);

create index if not exists idx_road_sections_geometry on road_sections using gist (geometry);
create index if not exists idx_road_sections_road on road_sections(road_id);
create index if not exists idx_road_sections_reference_segment on road_sections(reference_segment_id);
create index if not exists idx_road_section_bindings_section on road_section_reference_bindings(road_section_id);
create index if not exists idx_draft_road_section_states_workspace on draft_road_section_states(workspace_id);
create index if not exists idx_validation_issues_target on validation_issues(target_type, target_id);

insert into road_sections (
  id, business_id, road_id, reference_segment_id, section_code, name,
  kilometer_from, kilometer_to, carriageway, direction, geometry,
  status, validation_status, draft_status, valid_from
) values
  (
    '50000000-0000-0000-0000-000000000007',
    'RS-DK7-WAW-001',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0001-000000000007',
    'DK7-WAW-001-ODC',
    'Odcinek drogi DK7 Warszawa km 12+000-14+800',
    12.000,
    14.800,
    'PRAWA',
    'rosnacy kilometraz',
    ST_GeomFromText('LINESTRING(20.907 52.165,20.942 52.191,20.984 52.220)', 4326),
    'AKTYWNY',
    'OK',
    'NIE_DOTYCZY',
    date '2024-01-01'
  ),
  (
    '50000000-0000-0000-0000-000000000079',
    'RS-DK79-WAW-001',
    '00000000-0000-0000-0000-000000000079',
    '00000000-0000-0000-0001-000000000079',
    'DK79-WAW-001-ODC',
    'Odcinek drogi DK79 Warszawa km 5+400-9+900',
    5.400,
    9.900,
    'JEDNA',
    'rosnacy kilometraz',
    ST_GeomFromText('LINESTRING(21.015 52.170,21.055 52.190,21.096 52.212)', 4326),
    'AKTYWNY',
    'OK',
    'NIE_DOTYCZY',
    date '2024-01-01'
  ),
  (
    '50000000-0000-0000-0000-000000000700',
    'RS-S7-WAW-001',
    '00000000-0000-0000-0000-000000000700',
    '00000000-0000-0000-0001-000000000700',
    'S7-WAW-001-ODC',
    'Odcinek drogi S7 Warszawa km 20+000-23+750',
    20.000,
    23.750,
    'PRAWA',
    'rosnacy kilometraz',
    ST_GeomFromText('LINESTRING(20.900 52.240,20.935 52.267,20.970 52.292)', 4326),
    'AKTYWNY',
    'OK',
    'NIE_DOTYCZY',
    date '2024-01-01'
  ),
  (
    '50000000-0000-0000-0000-000000000721',
    'RS-DW721-WAW-001',
    '00000000-0000-0000-0000-000000000721',
    '00000000-0000-0000-0001-000000000721',
    'DW721-WAW-001-ODC',
    'Odcinek drogi DW721 km 1+200-4+600',
    1.200,
    4.600,
    'JEDNA',
    'rosnacy kilometraz',
    ST_GeomFromText('LINESTRING(20.890 52.100,20.940 52.112,20.990 52.125)', 4326),
    'AKTYWNY',
    'OK',
    'NIE_DOTYCZY',
    date '2024-01-01'
  )
on conflict (id) do nothing;

insert into road_section_reference_bindings (
  id, road_section_id, reference_segment_id, mileage_from, mileage_to, location_method, consistency_status, valid_from
)
select
  gen_random_uuid(),
  rs.id,
  rs.reference_segment_id,
  rs.kilometer_from,
  rs.kilometer_to,
  'SYSTEM_REFERENCYJNY',
  'ZGODNE',
  rs.valid_from
from road_sections rs
where rs.reference_segment_id is not null
  and not exists (
    select 1
    from road_section_reference_bindings existing
    where existing.road_section_id = rs.id
      and existing.reference_segment_id = rs.reference_segment_id
      and existing.valid_to is null
  );

insert into layer_catalog (
  layer_code, layer_name, group_name, geometry_type, visible_by_default, min_scale_label, style_hint, sort_order
) values
  ('road-sections', 'Odcinki drogi', 'Drogi', 'LINESTRING', true, '1:500 000', 'road-section-line', 25)
on conflict (layer_code) do update set
  layer_name = excluded.layer_name,
  group_name = excluded.group_name,
  geometry_type = excluded.geometry_type,
  visible_by_default = excluded.visible_by_default,
  min_scale_label = excluded.min_scale_label,
  style_hint = excluded.style_hint,
  sort_order = excluded.sort_order;
