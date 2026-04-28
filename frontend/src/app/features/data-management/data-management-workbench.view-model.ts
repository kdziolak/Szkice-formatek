import {WorkflowKind} from '../../domains/road-gis/models/road-gis-domain.models';

export interface WorkbenchAction {
  readonly kind: WorkflowKind;
  readonly label: string;
  readonly icon: string;
}

export const DEFAULT_EXPANDED_LAYER_GROUPS: Record<string, boolean> = {
  OpenStreetMap: true,
  'Geoportal / GUGiK': false,
  'Działki ewidencyjne': true,
  'Kontury klasyfikacyjne': false,
  'System Referencyjny': true,
  'Obiekty ZID': true,
  'Obiekty w wersji roboczej': true,
  'Warstwy pomocnicze': false
};

export const MODULE_ACTIONS: readonly WorkbenchAction[] = [
  {kind: 'map-composition', label: 'Mapa', icon: 'pi pi-map'},
  {kind: 'workset', label: 'Wersja robocza', icon: 'pi pi-pencil'},
  {kind: 'object-editor', label: 'Edycja', icon: 'pi pi-file-edit'},
  {kind: 'reference-binding', label: 'System referencyjny', icon: 'pi pi-link'},
  {kind: 'infrastructure-import', label: 'Import obiektów', icon: 'pi pi-upload'},
  {kind: 'parcel-import', label: 'Import działek', icon: 'pi pi-th-large'},
  {kind: 'validation', label: 'Walidacja', icon: 'pi pi-verified'},
  {kind: 'reports-export', label: 'Raporty i eksport', icon: 'pi pi-file-export'}
];

export const LEFT_RAIL_ACTIONS: readonly WorkbenchAction[] = [
  {kind: 'map-composition', label: 'Kompozycja mapowa', icon: 'pi pi-compass'},
  {kind: 'workset', label: 'Tryb zarządzania danymi', icon: 'pi pi-database'},
  {kind: 'infrastructure-import', label: 'Import infrastruktury', icon: 'pi pi-cloud-upload'},
  {kind: 'parcel-import', label: 'Import działek', icon: 'pi pi-table'},
  {kind: 'validation', label: 'Centrum walidacji', icon: 'pi pi-exclamation-triangle'},
  {kind: 'reports-export', label: 'Raportowanie', icon: 'pi pi-chart-bar'}
];

