CREATE SCHEMA road;
GO

CREATE TABLE road.road (
  road_id BIGINT IDENTITY(1,1) NOT NULL,
  business_id UNIQUEIDENTIFIER NOT NULL,
  road_number NVARCHAR(30) NOT NULL,
  road_class_code NVARCHAR(30) NOT NULL,
  road_name NVARCHAR(255) NULL,
  description NVARCHAR(1000) NULL,
  created_at DATETIME2(0) NOT NULL,
  created_by NVARCHAR(100) NOT NULL,
  updated_at DATETIME2(0) NOT NULL,
  updated_by NVARCHAR(100) NOT NULL,
  CONSTRAINT PK_road PRIMARY KEY (road_id),
  CONSTRAINT UQ_road_business_id UNIQUE (business_id),
  CONSTRAINT UQ_road_road_number UNIQUE (road_number)
);
GO

CREATE INDEX IX_road_number_class
  ON road.road (road_number, road_class_code);
GO

CREATE TABLE road.road_section (
  road_section_id BIGINT IDENTITY(1,1) NOT NULL,
  business_id UNIQUEIDENTIFIER NOT NULL,
  road_id BIGINT NOT NULL,
  reference_segment_id BIGINT NULL,
  section_code NVARCHAR(100) NOT NULL,
  chainage_from DECIMAL(12,3) NOT NULL,
  chainage_to DECIMAL(12,3) NOT NULL,
  geometry_value geometry NOT NULL,
  srid INT NOT NULL,
  lifecycle_status NVARCHAR(30) NOT NULL,
  valid_from DATETIME2(0) NOT NULL,
  valid_to DATETIME2(0) NULL,
  created_at DATETIME2(0) NOT NULL,
  created_by NVARCHAR(100) NOT NULL,
  updated_at DATETIME2(0) NOT NULL,
  updated_by NVARCHAR(100) NOT NULL,
  CONSTRAINT PK_road_section PRIMARY KEY (road_section_id),
  CONSTRAINT UQ_road_section_business_id UNIQUE (business_id),
  CONSTRAINT UQ_road_section_road_section_code UNIQUE (road_id, section_code),
  CONSTRAINT FK_road_section_road FOREIGN KEY (road_id)
    REFERENCES road.road(road_id),
  CONSTRAINT FK_road_section_reference_segment FOREIGN KEY (reference_segment_id)
    REFERENCES ref.reference_segment(reference_segment_id),
  CONSTRAINT CK_road_section_srid CHECK (srid = 2180),
  CONSTRAINT CK_road_section_chainage CHECK (chainage_from <= chainage_to),
  CONSTRAINT CK_road_section_lifecycle_status CHECK (
    lifecycle_status IN ('DRAFT', 'VALID', 'INVALID', 'CONFLICT', 'PUBLISHED', 'ARCHIVED', 'UNBOUND')
  ),
  CONSTRAINT CK_road_section_validity CHECK (valid_to IS NULL OR valid_from <= valid_to)
);
GO

CREATE INDEX IX_road_section_reference_chainage
  ON road.road_section (reference_segment_id, chainage_from, chainage_to);
GO

CREATE SPATIAL INDEX SIX_road_section_geometry
  ON road.road_section (geometry_value);
GO
