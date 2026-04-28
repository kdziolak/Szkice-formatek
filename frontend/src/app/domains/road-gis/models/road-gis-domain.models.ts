import {GeoJsonGeometry, GeometryType} from '../../../core/road-infra-gis.models';

export type DraftStatus =
  | 'NOWY_W_WERSJI_ROBOCZEJ'
  | 'W_MODYFIKACJI'
  | 'ZAPISANY_W_WERSJI_ROBOCZEJ'
  | 'ZAPISANY_W_WERSJI_ROBOCZEJ_I_DALEJ_MODYFIKOWANY'
  | 'GOTOWY_DO_WALIDACJI'
  | 'WYMAGA_POPRAWY'
  | 'GOTOWY_DO_ZATWIERDZENIA'
  | 'ZAPISANY_DO_BAZY_FINALNEJ';

export type ValidationStatus =
  | 'OK'
  | 'OSTRZEZENIE'
  | 'BLAD_KRYTYCZNY'
  | 'NIEPOPRAWNE_DANE_ATRYBUTOWE'
  | 'NIEPOPRAWNA_GEOMETRIA'
  | 'BRAK_DOWIAZANIA_DO_SR'
  | 'KONFLIKT_PRZESTRZENNY'
  | 'WYMAGA_DECYZJI_UZYTKOWNIKA';

export type WorkflowKind =
  | 'map-composition'
  | 'infrastructure-import'
  | 'parcel-import'
  | 'workset'
  | 'object-editor'
  | 'reference-binding'
  | 'validation'
  | 'reports-export';

export type WorkflowStepStatus = 'pending' | 'active' | 'done' | 'blocked';

export interface LegendItem {
  label: string;
  color: string;
  symbol: 'line' | 'polygon' | 'point' | 'raster';
}

export interface LayerDefinition {
  id: string;
  name: string;
  group: string;
  geometryType: GeometryType | 'RASTER' | 'MIXED';
  visible: boolean;
  active: boolean;
  editable: boolean;
  opacity: number;
  minScaleLabel: string;
  sourceKind: 'OSM' | 'GUGIK' | 'GEOSERVER' | 'IMPORT' | 'LOCAL';
  legendItems: LegendItem[];
}

export interface MapComposition {
  id: string;
  name: string;
  epsg: string;
  scaleLabel: string;
  center: [number, number];
  layers: LayerDefinition[];
}

export interface GisFeature {
  id: string;
  layerId: string;
  geometry: GeoJsonGeometry | null;
  geometryType: GeometryType;
  properties: Record<string, unknown>;
}

export interface RoadInfrastructureObject extends GisFeature {
  objectCode: string;
  objectType: string;
  name: string;
  roadNumber: string | null;
  referenceSegmentId: string | null;
  validationStatus: ValidationStatus;
  draftStatus: DraftStatus | 'NIE_DOTYCZY';
}

export interface ReferenceSegment {
  id: string;
  roadNumber: string;
  segmentCode: string;
  mileageFrom: number;
  mileageTo: number;
  geometry: GeoJsonGeometry | null;
}

export interface ReferenceBinding {
  objectId: string;
  referenceSegmentId: string;
  localMileageFrom: number;
  localMileageTo: number;
  globalMileageFrom: number;
  globalMileageTo: number;
  conflict: boolean;
  alternatives: ReferenceSegment[];
}

export interface Workset {
  id: string;
  name: string;
  status: 'AKTYWNY' | 'W_WALIDACJI' | 'GOTOWY_DO_ZATWIERDZENIA' | 'SFINALIZOWANY';
  objectCount: number;
  blockingIssueCount: number;
}

export interface WorksetObject {
  id: string;
  objectId: string;
  objectCode: string;
  objectType: string;
  draftStatus: DraftStatus;
  validationStatus: ValidationStatus;
}

export interface ValidationIssue {
  id: string;
  targetId: string;
  targetCode: string;
  status: ValidationStatus;
  message: string;
  fieldName: string | null;
  geometryMarker: GeoJsonGeometry | null;
}

export interface ImportLayer {
  id: string;
  name: string;
  geometryType: GeometryType;
  featureCount: number;
  selected: boolean;
  targetType: string;
}

export interface AttributeMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  confidence: number;
}

export interface ImportSession {
  id: string;
  sourceName: string;
  format: 'SHP' | 'GML/XML' | 'GeoJSON' | 'DXF' | 'DWG' | 'CSV' | 'XLSX';
  status: 'PLIK_WYBRANY' | 'WARSTWY_ROZPOZNANE' | 'MAPOWANIE' | 'PODGLAD' | 'WALIDACJA' | 'RAPORT';
  layers: ImportLayer[];
  mappings: AttributeMapping[];
}

export interface ParcelImportCandidate {
  id: string;
  parcelNumber: string;
  commune: string;
  source: 'SAP_HANA' | 'ZID' | 'GUGIK';
  status: 'DODANA' | 'ZAKTUALIZOWANA' | 'ZARCHIWIZOWANA' | 'ODRZUCONA' | 'BEZ_ZMIAN' | 'WYMAGA_DECYZJI';
  reason: string;
}

export interface ParcelComparisonResult {
  id: string;
  importSource: string;
  candidates: ParcelImportCandidate[];
  discrepancyCount: number;
}

export interface ImportReport {
  id: string;
  title: string;
  added: number;
  updated: number;
  archived: number;
  rejected: number;
  discrepancies: string[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  category: 'TEREN' | 'PREDEFINIOWANY' | 'WALIDACJA' | 'IMPORT' | 'EKSPORT';
  formats: Array<'XLSX' | 'CSV' | 'PDF' | 'GeoJSON' | 'SHP' | 'GML/XML' | 'DXF'>;
}

export interface ExportJob {
  id: string;
  name: string;
  scope: 'WARSTWA' | 'ZAZNACZENIE' | 'ZAKRES_MAPY';
  format: ReportDefinition['formats'][number];
  status: 'GOTOWY' | 'W_TRAKCIE' | 'ZAKONCZONY';
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: WorkflowStepStatus;
  metric?: string;
}

export interface WorkflowDefinition {
  kind: WorkflowKind;
  title: string;
  contextLabel: string;
  primaryAction: string;
  steps: WorkflowStep[];
}
