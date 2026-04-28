export type GeometryType = 'POINT' | 'LINESTRING' | 'POLYGON';
export type RightPanelTab = 'Legenda' | 'Warstwy' | 'Info' | 'Atrybuty' | 'Proces';
export type TableTab =
  | 'Wszystkie obiekty'
  | 'Obiekty w edycji'
  | 'Błędy walidacji'
  | 'Działki'
  | 'Stacje pomiaru ruchu'
  | 'Bariery'
  | 'Odcinki drogi'
  | 'System referencyjny';

export interface GeoJsonGeometry {
  type: string;
  coordinates?: unknown;
  geometries?: GeoJsonGeometry[];
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: GeoJsonGeometry | null;
  properties: Record<string, unknown>;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface RoadDto {
  id: string;
  roadNumber: string;
  category: string;
  name: string;
  managingAuthority: string;
  totalLengthKm: number;
}

export interface ReferenceSegmentDto {
  id: string;
  roadId: string;
  roadNumber: string;
  segmentCode: string;
  startMileageKm: number;
  endMileageKm: number;
  carriageway: string;
  direction: string;
  status: string;
  validFrom: string;
  validTo: string | null;
  geometry: GeoJsonGeometry;
}

export interface ReferenceBindingDto {
  referenceSegmentId: string;
  referenceSegmentCode: string;
  roadId: string;
  roadNumber: string;
  mileageFrom: number;
  mileageTo: number;
  locationMethod: string;
  consistencyStatus: string;
}

export interface RoadSectionDto {
  id: string;
  businessId: string;
  roadId: string;
  roadNumber: string;
  referenceSegmentId: string | null;
  referenceSegmentCode: string | null;
  sectionCode: string;
  name: string;
  kilometerFrom: number;
  kilometerTo: number;
  carriageway: string;
  direction: string;
  geometry: GeoJsonGeometry | null;
  status: string;
  validationStatus: string;
  draftStatus: string;
  validFrom: string | null;
  validTo: string | null;
  updatedAt: string | null;
  referenceBinding: ReferenceBindingDto | null;
}

export interface RoadSectionUpdateRequest {
  name: string;
  referenceSegmentId: string | null;
  kilometerFrom: number | null;
  kilometerTo: number | null;
  geometry: GeoJsonGeometry | null;
  status: string;
}

export interface WorkspaceRoadSectionRequest {
  roadSectionId: string;
}

export interface InfrastructureObjectDto {
  id: string;
  objectType: string;
  objectCode: string;
  name: string;
  roadId: string | null;
  roadNumber: string | null;
  referenceSegmentId: string | null;
  referenceSegmentCode: string | null;
  globalMileageFrom: number | null;
  globalMileageTo: number | null;
  localMileageFrom: number | null;
  localMileageTo: number | null;
  geometry: GeoJsonGeometry | null;
  geometryType: GeometryType;
  owner: string | null;
  branch: string | null;
  district: string | null;
  status: string;
  validationStatus: string;
  draftStatus: string;
  validFrom: string | null;
  validTo: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  attributes: Record<string, unknown>;
}

export interface InfrastructureObjectRequest {
  objectType: string;
  objectCode: string;
  name: string;
  roadId: string | null;
  referenceSegmentId: string | null;
  globalMileageFrom: number | null;
  globalMileageTo: number | null;
  localMileageFrom: number | null;
  localMileageTo: number | null;
  geometry: GeoJsonGeometry | null;
  geometryType: GeometryType;
  owner: string | null;
  branch: string | null;
  district: string | null;
  status: string;
  validationStatus: string;
  draftStatus: string;
  attributes: Record<string, unknown>;
}

export interface WorkspaceObjectUpdateRequest {
  name: string;
  globalMileageFrom: number | null;
  globalMileageTo: number | null;
  referenceSegmentId: string | null;
  geometry: GeoJsonGeometry | null;
  attributes: Record<string, unknown>;
}

export interface LayerDto {
  layerCode: string;
  layerName: string;
  groupName: string;
  geometryType: string;
  visibleByDefault: boolean;
  minScaleLabel: string;
  styleHint: string;
}

export interface LayerGroup {
  name: string;
  layers: LayerDto[];
}

export interface WorkspaceDto {
  id: string;
  name: string;
  createdBy: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
  scopeGeometry: GeoJsonGeometry | null;
  objectCount: number;
  blockingIssueCount: number;
}

export interface ValidationIssueDto {
  id: string;
  targetType: string;
  targetId: string | null;
  targetCode: string | null;
  objectId: string | null;
  objectCode: string | null;
  severity: string;
  issueType: string;
  fieldName: string | null;
  message: string;
  geometryMarker: GeoJsonGeometry | null;
  createdAt: string;
  resolved: boolean;
}

export interface ObjectValidationResponse {
  objectId: string;
  validationStatus: string;
  issues: ValidationIssueDto[];
}

export interface ImportJobDto {
  id: string;
  importType: string;
  sourceName: string;
  status: string;
  importedCount: number;
  rejectedCount: number;
  createdAt: string;
  errorReport: Record<string, unknown>;
}

export type DataGridMode = 'OBJECTS' | 'ROAD_SECTIONS' | 'REFERENCE_SEGMENTS';
export type DataGridRowKind = 'OBJECT' | 'ROAD_SECTION' | 'REFERENCE_SEGMENT';
export type LifecycleBadgeKind = 'neutral' | 'published' | 'draft' | 'modified' | 'ready' | 'warning' | 'danger';

export interface GridColumnDefinition {
  field: string;
  header: string;
  width: string;
  frozen?: boolean;
  alignFrozen?: 'left' | 'right';
  filterType?: 'text' | 'numeric';
}

export interface DataGridRow {
  id: string;
  kind: DataGridRowKind;
  primaryCode: string;
  secondaryLabel: string;
  roadNumber: string;
  referenceLabel: string;
  mileageLabel: string;
  status: string;
  validationStatus: string;
  draftStatus: string;
  issueCount: number;
  geometry: GeoJsonGeometry | null;
  source: InfrastructureObjectDto | RoadSectionDto | ReferenceSegmentDto;
}
