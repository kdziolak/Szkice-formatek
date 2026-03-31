export type OverlayStatus = 'NONE' | 'CREATED' | 'UPDATED' | 'DELETED';
export type DraftScope = 'ROAD_SECTION';
export type DraftStatus = 'OPEN' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED';
export type DraftActionType = 'CREATE' | 'UPDATE' | 'DELETE';
export type DraftValidationState = 'PENDING' | 'VALID' | 'INVALID';
export type DraftConflictState = 'NONE' | 'CONFLICT';
export type DraftEntityType = 'ROAD_SECTION';
export type WorkspaceLayerType = 'published' | 'draft' | 'context';
export type FeatureLayer = 'ROAD_SECTION' | 'REFERENCE_SEGMENT';

export interface ApiErrorResponse {
  code: string;
  message: string;
}

export interface PageMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface RoadSectionSummary {
  businessId: string;
  roadNumber: string | null;
  roadClassCode: string | null;
  roadName: string | null;
  sectionCode: string | null;
  referenceSegmentBusinessId: string | null;
  chainageFrom: number | null;
  chainageTo: number | null;
  lifecycleStatus: string | null;
  overlayStatus: OverlayStatus;
  draftCommandId: string | null;
  isDraftOnly: boolean;
}

export interface PagedRoadSectionsResponse {
  content: RoadSectionSummary[];
  page: PageMetadata;
}

export interface RoadSectionState {
  businessId: string;
  roadNumber: string | null;
  roadClassCode: string | null;
  roadName: string | null;
  sectionCode: string | null;
  referenceSegmentBusinessId: string | null;
  chainageFrom: number | null;
  chainageTo: number | null;
  lifecycleStatus: string | null;
  geometry: GeoJsonGeometry | null;
}

export interface RoadSectionComparisonDetail {
  businessId: string;
  overlayStatus: OverlayStatus;
  draftCommandId: string | null;
  published: RoadSectionState | null;
  working: RoadSectionState | null;
}

export interface FeatureView {
  businessId: string;
  label: string;
  overlayStatus: OverlayStatus;
  draftOnly: boolean;
  geometry: GeoJsonGeometry | null;
}

export interface FeatureQueryResponse {
  publishedFeatures: FeatureView[];
  draftFeatures: FeatureView[];
}

export interface WorkspaceLayerDefinition {
  id: string;
  label: string;
  layerType: WorkspaceLayerType;
  visible: boolean;
  editable: boolean;
  zIndex: number;
}

export interface WorkspaceLayout {
  mode: string;
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
}

export interface WorkspaceConfigResponse {
  activeEditableLayerId: string;
  layers: WorkspaceLayerDefinition[];
  layout: WorkspaceLayout;
}

export interface DraftCreateRequest {
  draftName: string;
  draftScope: DraftScope;
}

export interface DraftCreateResponse {
  draftId: string;
  draftName: string;
  draftScope: DraftScope;
  draftStatus: DraftStatus;
  createdAt: string;
}

export interface DraftCommandRequest {
  entityType: DraftEntityType;
  actionType: DraftActionType;
  targetBusinessId: string | null;
  payload: Record<string, unknown>;
  geometry: GeoJsonGeometry | null;
}

export interface DraftCommandResponse {
  draftCommandId: string;
  draftId: string;
  entityType: DraftEntityType;
  actionType: DraftActionType;
  targetBusinessId: string;
  validationState: DraftValidationState;
  conflictState: DraftConflictState;
  receivedAt: string;
}

export interface DraftSummary {
  draftId: string;
  draftName: string;
  draftScope: DraftScope;
  draftStatus: DraftStatus;
  createdAt: string;
}

export interface LayerViewModel extends WorkspaceLayerDefinition {}

export interface RoadSectionRowViewModel extends RoadSectionSummary {
  chainageLabel: string;
  statusLabel: string;
}

export interface RoadSectionComparisonViewModel extends RoadSectionComparisonDetail {}

export interface MapFeatureViewModel extends FeatureView {}

export interface RoadSectionFormValue {
  roadNumber: string;
  roadClassCode: string;
  roadName: string;
  sectionCode: string;
  referenceSegmentBusinessId: string;
  chainageFrom: number | null;
  chainageTo: number | null;
  lifecycleStatus: string;
}

export interface ViewportState {
  bbox: string;
  scaleDenominator: number;
}
