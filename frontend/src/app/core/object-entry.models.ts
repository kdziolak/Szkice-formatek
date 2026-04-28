export type ObjectGeometryType = 'point' | 'line' | 'polygon';

export type DraftStatus =
  | 'idle'
  | 'draft'
  | 'validated'
  | 'rejected'
  | 'published';

export type ObjectLifecycleStatus =
  | 'draft'
  | 'validated'
  | 'rejected'
  | 'published'
  | 'archived';

export type DraftCommand =
  | 'create'
  | 'updateAttributes'
  | 'updateGeometry'
  | 'bindReference'
  | 'validate'
  | 'publish';

export type GeometryToolMode = ObjectGeometryType | 'select' | null;

export type ValidationSeverity = 'error' | 'warning';

export type ReferenceBindingStatus = 'unbound' | 'candidate' | 'bound';

export interface PointGeometry {
  type: 'point';
  srid: 3857;
  coordinates: [number, number];
}

export interface LineGeometry {
  type: 'line';
  srid: 3857;
  coordinates: Array<[number, number]>;
}

export interface PolygonGeometry {
  type: 'polygon';
  srid: 3857;
  coordinates: Array<[number, number]>;
}

export type ObjectGeometry = PointGeometry | LineGeometry | PolygonGeometry;

export interface ReferenceBinding {
  roadId: string;
  roadNumber: string;
  sectionId: string;
  sectionLabel: string;
  chainageStart: number;
  chainageEnd: number;
  carriageway?: string;
  lane?: string;
  offsetMeters?: number;
  status: ReferenceBindingStatus;
  boundAt?: string;
}

export interface ReferenceCandidate extends ReferenceBinding {
  score: number;
  source: 'reference-system' | 'operator';
  label: string;
}

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  field?: string;
  objectId?: string;
  draftId?: string;
}

export interface ObjectAttributes {
  typeCode: string;
  category: string;
  name: string;
  label: string;
  roadNumber: string;
  condition: 'good' | 'fair' | 'poor';
  owner: string;
  notes?: string;
}

export interface RoadObject {
  id: string;
  businessId: string;
  geometryType: ObjectGeometryType;
  lifecycleStatus: ObjectLifecycleStatus;
  attributes: ObjectAttributes;
  geometry: ObjectGeometry;
  referenceBinding: ReferenceBinding | null;
  availableReferenceCandidates: ReferenceCandidate[];
  draftCommands: DraftCommand[];
  lastModifiedAt: string;
}

export interface WorkspaceSummary {
  objects: RoadObject[];
  draftId: string | null;
  draftStatus: DraftStatus;
  validationIssues: ValidationIssue[];
  statusMessage: string;
}
