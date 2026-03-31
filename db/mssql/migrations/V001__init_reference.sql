CREATE SCHEMA ref;
GO

CREATE TABLE ref.reference_axis (
  reference_axis_id BIGINT IDENTITY(1,1) NOT NULL,
  business_id UNIQUEIDENTIFIER NOT NULL,
  road_number NVARCHAR(30) NOT NULL,
  axis_code NVARCHAR(50) NOT NULL,
  direction_code NVARCHAR(30) NULL,
  axis_name NVARCHAR(255) NULL,
  geometry_value geometry NOT NULL,
  srid INT NOT NULL,
  valid_from DATETIME2(0) NOT NULL,
  valid_to DATETIME2(0) NULL,
  created_at DATETIME2(0) NOT NULL,
  created_by NVARCHAR(100) NOT NULL,
  updated_at DATETIME2(0) NOT NULL,
  updated_by NVARCHAR(100) NOT NULL,
  CONSTRAINT PK_reference_axis PRIMARY KEY (reference_axis_id),
  CONSTRAINT UQ_reference_axis_business_id UNIQUE (business_id),
  CONSTRAINT UQ_reference_axis_axis_code UNIQUE (axis_code),
  CONSTRAINT CK_reference_axis_srid CHECK (srid = 2180),
  CONSTRAINT CK_reference_axis_validity CHECK (valid_to IS NULL OR valid_from <= valid_to)
);
GO

CREATE INDEX IX_reference_axis_road_number
  ON ref.reference_axis (road_number, direction_code);
GO

CREATE SPATIAL INDEX SIX_reference_axis_geometry
  ON ref.reference_axis (geometry_value);
GO

CREATE TABLE ref.reference_segment (
  reference_segment_id BIGINT IDENTITY(1,1) NOT NULL,
  business_id UNIQUEIDENTIFIER NOT NULL,
  reference_axis_id BIGINT NOT NULL,
  segment_code NVARCHAR(100) NOT NULL,
  chainage_from DECIMAL(12,3) NOT NULL,
  chainage_to DECIMAL(12,3) NOT NULL,
  geometry_value geometry NOT NULL,
  srid INT NOT NULL,
  valid_from DATETIME2(0) NOT NULL,
  valid_to DATETIME2(0) NULL,
  created_at DATETIME2(0) NOT NULL,
  created_by NVARCHAR(100) NOT NULL,
  updated_at DATETIME2(0) NOT NULL,
  updated_by NVARCHAR(100) NOT NULL,
  CONSTRAINT PK_reference_segment PRIMARY KEY (reference_segment_id),
  CONSTRAINT UQ_reference_segment_business_id UNIQUE (business_id),
  CONSTRAINT UQ_reference_segment_axis_segment_code UNIQUE (reference_axis_id, segment_code),
  CONSTRAINT FK_reference_segment_axis FOREIGN KEY (reference_axis_id)
    REFERENCES ref.reference_axis(reference_axis_id),
  CONSTRAINT CK_reference_segment_srid CHECK (srid = 2180),
  CONSTRAINT CK_reference_segment_chainage CHECK (chainage_from <= chainage_to),
  CONSTRAINT CK_reference_segment_validity CHECK (valid_to IS NULL OR valid_from <= valid_to)
);
GO

CREATE INDEX IX_reference_segment_chainage
  ON ref.reference_segment (reference_axis_id, chainage_from, chainage_to);
GO

CREATE SPATIAL INDEX SIX_reference_segment_geometry
  ON ref.reference_segment (geometry_value);
GO
