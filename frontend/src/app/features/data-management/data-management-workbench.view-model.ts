import {WorkflowKind} from '../../domains/road-gis/models/road-gis-domain.models';
import {RightPanelTab} from '../../core/road-infra-gis.models';

export interface WorkbenchAction {
  readonly kind: WorkflowKind;
  readonly label: string;
  readonly icon: string;
}

export type MapToolKind =
  | 'select'
  | 'pan'
  | 'draw-point'
  | 'draw-line'
  | 'draw-polygon'
  | 'modify'
  | 'measure-line'
  | 'measure-area';

export interface MapToolbarAction {
  readonly kind: MapToolKind;
  readonly label: string;
  readonly icon: string;
  readonly group: 'navigation' | 'drawing' | 'measurement';
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

export const DEFAULT_RIGHT_PANEL_TAB: RightPanelTab = 'Warstwy';
export const DEFAULT_EDITOR_TAB = 'Dane podstawowe';

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

export const MAP_TOOLBAR_ACTIONS: readonly MapToolbarAction[] = [
  {kind: 'select', label: 'Wybierz obiekt', icon: 'pi pi-bullseye', group: 'navigation'},
  {kind: 'pan', label: 'Przesuwaj mapę', icon: 'pi pi-arrows-alt', group: 'navigation'},
  {kind: 'draw-point', label: 'Rysuj punkt', icon: 'pi pi-map-marker', group: 'drawing'},
  {kind: 'draw-line', label: 'Rysuj linię', icon: 'pi pi-minus', group: 'drawing'},
  {kind: 'draw-polygon', label: 'Rysuj poligon', icon: 'pi pi-stop', group: 'drawing'},
  {kind: 'modify', label: 'Edytuj geometrię', icon: 'pi pi-pencil', group: 'drawing'},
  {kind: 'measure-line', label: 'Zmierz odległość', icon: 'pi pi-chart-line', group: 'measurement'},
  {kind: 'measure-area', label: 'Zmierz powierzchnię', icon: 'pi pi-stop-circle', group: 'measurement'}
];

export const LEFT_RAIL_ACTIONS: readonly WorkbenchAction[] = [
  {kind: 'map-composition', label: 'Kompozycja mapowa', icon: 'pi pi-compass'},
  {kind: 'workset', label: 'Tryb zarządzania danymi', icon: 'pi pi-database'},
  {kind: 'infrastructure-import', label: 'Import infrastruktury', icon: 'pi pi-cloud-upload'},
  {kind: 'parcel-import', label: 'Import działek', icon: 'pi pi-table'},
  {kind: 'validation', label: 'Centrum walidacji', icon: 'pi pi-exclamation-triangle'},
  {kind: 'reports-export', label: 'Raportowanie', icon: 'pi pi-chart-bar'}
];
