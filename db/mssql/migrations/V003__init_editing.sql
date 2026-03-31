CREATE SCHEMA edit;
GO

CREATE TABLE edit.draft (
  draft_id BIGINT IDENTITY(1,1) NOT NULL,
  business_id UNIQUEIDENTIFIER NOT NULL,
  draft_name NVARCHAR(200) NOT NULL,
  draft_scope NVARCHAR(50) NOT NULL,
  draft_status NVARCHAR(30) NOT NULL,
  created_at DATETIME2(0) NOT NULL,
  created_by NVARCHAR(100) NOT NULL,
  updated_at DATETIME2(0) NOT NULL,
  updated_by NVARCHAR(100) NOT NULL,
  CONSTRAINT PK_draft PRIMARY KEY (draft_id),
  CONSTRAINT UQ_draft_business_id UNIQUE (business_id),
  CONSTRAINT CK_draft_scope CHECK (draft_scope IN ('ROAD_SECTION')),
  CONSTRAINT CK_draft_status CHECK (draft_status IN ('OPEN', 'LOCKED', 'PUBLISHED', 'ARCHIVED'))
);
GO

CREATE INDEX IX_draft_business_id
  ON edit.draft (business_id);
GO

CREATE TABLE edit.draft_object (
  draft_object_id BIGINT IDENTITY(1,1) NOT NULL,
  business_id UNIQUEIDENTIFIER NOT NULL,
  draft_id BIGINT NOT NULL,
  entity_type NVARCHAR(100) NOT NULL,
  target_business_id UNIQUEIDENTIFIER NOT NULL,
  action_type NVARCHAR(30) NOT NULL,
  payload_json NVARCHAR(MAX) NOT NULL,
  geometry_value geometry NULL,
  srid INT NULL,
  validation_state NVARCHAR(30) NOT NULL,
  conflict_state NVARCHAR(30) NOT NULL,
  created_at DATETIME2(0) NOT NULL,
  created_by NVARCHAR(100) NOT NULL,
  updated_at DATETIME2(0) NOT NULL,
  updated_by NVARCHAR(100) NOT NULL,
  CONSTRAINT PK_draft_object PRIMARY KEY (draft_object_id),
  CONSTRAINT UQ_draft_object_business_id UNIQUE (business_id),
  CONSTRAINT UQ_draft_object_snapshot UNIQUE (draft_id, entity_type, target_business_id),
  CONSTRAINT FK_draft_object_draft FOREIGN KEY (draft_id)
    REFERENCES edit.draft(draft_id),
  CONSTRAINT CK_draft_object_entity_type CHECK (entity_type IN ('ROAD_SECTION')),
  CONSTRAINT CK_draft_object_action_type CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
  CONSTRAINT CK_draft_object_validation_state CHECK (
    validation_state IN ('PENDING', 'VALID', 'INVALID')
  ),
  CONSTRAINT CK_draft_object_conflict_state CHECK (
    conflict_state IN ('NONE', 'CONFLICT')
  ),
  CONSTRAINT CK_draft_object_payload_json CHECK (ISJSON(payload_json) = 1),
  CONSTRAINT CK_draft_object_geometry_pair CHECK (
    (geometry_value IS NULL AND srid IS NULL)
    OR (geometry_value IS NOT NULL AND srid IS NOT NULL)
  ),
  CONSTRAINT CK_draft_object_srid CHECK (
    geometry_value IS NULL OR (srid = 2180 AND geometry_value.STSrid = srid)
  )
);
GO

CREATE INDEX IX_draft_object_business_id
  ON edit.draft_object (business_id);
GO

CREATE INDEX IX_draft_object_draft_id
  ON edit.draft_object (draft_id, entity_type, target_business_id);
GO

CREATE SPATIAL INDEX SIX_draft_object_geometry
  ON edit.draft_object (geometry_value);
GO
