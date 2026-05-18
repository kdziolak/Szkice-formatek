import {CommonModule} from '@angular/common';
import {Component, OnInit, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DialogModule} from 'primeng/dialog';

import {ObjectEntryMapComponent} from '../../map/object-entry-map.component';
import {DataManagementGridComponent} from './data-management-grid.component';
import {
  ImportManagerFacade,
  LayerFacade,
  ObjectEditorFacade,
  ParcelImportFacade,
  ReportFacade,
  RoadGisWorkflowFacade
} from '../../domains/road-gis/data-access/road-gis-facades';
import {LayerDefinition, WorkflowKind, WorkflowStep} from '../../domains/road-gis/models/road-gis-domain.models';
import {
  InfrastructureObjectDto,
  LayerDto,
  ReferenceSegmentDto,
  RightPanelTab,
  RoadDto,
  RoadSectionDto,
  TableTab,
  ValidationIssueDto
} from '../../core/road-infra-gis.models';
import {RoadInfraGisStore} from '../../state/road-infra-gis.store';
import {
  DEFAULT_EDITOR_TAB,
  DEFAULT_EXPANDED_LAYER_GROUPS,
  DEFAULT_RIGHT_PANEL_TAB,
  LEFT_RAIL_ACTIONS,
  MAP_TOOLBAR_ACTIONS,
  MapToolKind,
  MODULE_ACTIONS
} from './data-management-workbench.view-model';

type DockablePanel = 'map' | 'table' | 'right-panel';
type PortalPosition = 'top' | 'bottom' | 'left' | 'center' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

@Component({
  selector: 'rgp-data-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ObjectEntryMapComponent, DataManagementGridComponent],
  templateUrl: './data-management-page.component.html',
  styleUrl: './data-management-page.component.css'
})
export class DataManagementPageComponent implements OnInit {
  readonly store = inject(RoadInfraGisStore);
  readonly layerFacade = inject(LayerFacade);
  readonly workflowFacade = inject(RoadGisWorkflowFacade);
  readonly importManagerFacade = inject(ImportManagerFacade);
  readonly parcelImportFacade = inject(ParcelImportFacade);
  readonly objectEditorFacade = inject(ObjectEditorFacade);
  readonly reportFacade = inject(ReportFacade);

  readonly activeObject = this.store.activeObject;
  readonly activeRoadSection = this.store.activeRoadSection;
  readonly activeRoad = computed(() => {
    const roadId = this.activeObject()?.roadId ?? this.activeRoadSection()?.roadId;
    return roadId ? this.store.roads().find((road) => road.id === roadId) ?? null : null;
  });
  readonly selectedReferenceSegment = computed(() => {
    const segmentId = this.store.selectedReferenceSegmentId();
    return segmentId
      ? this.store.referenceSegments().find((segment) => segment.id === segmentId) ?? null
      : null;
  });

  readonly tableTabs: TableTab[] = [
    'Wszystkie obiekty',
    'Obiekty w edycji',
    'Błędy walidacji',
    'Działki',
    'Stacje pomiaru ruchu',
    'Bariery',
    'Odcinki drogi',
    'System referencyjny'
  ];
  readonly rightTabs: RightPanelTab[] = ['Legenda', 'Warstwy', 'Info', 'Atrybuty', 'Proces'];
  readonly layerFilter = signal('');
  readonly floatingPanels = signal<Record<DockablePanel, boolean>>({
    map: false,
    table: false,
    'right-panel': false
  });
  readonly portalLabels: Record<DockablePanel, string> = {
    map: 'Mapa robocza',
    table: 'Tabela danych',
    'right-panel': 'Panel szczegolow'
  };
  readonly portalStyles: Record<DockablePanel, Record<string, string>> = {
    map: {width: 'min(860px, 64vw)', height: 'min(640px, 76vh)', transform: 'translateX(54px)'},
    table: {width: 'min(1010px, 70vw)', height: 'min(460px, 54vh)', transform: 'translateX(54px)'},
    'right-panel': {width: 'min(440px, 32vw)', height: 'min(760px, 84vh)'}
  };
  readonly portalPositions: Record<DockablePanel, PortalPosition> = {
    map: 'left',
    table: 'bottomleft',
    'right-panel': 'right'
  };
  readonly portalBaseZIndexes: Record<DockablePanel, number> = {
    map: 1100,
    'right-panel': 1200,
    table: 1300
  };
  readonly expandedLayerGroups = signal<Record<string, boolean>>({...DEFAULT_EXPANDED_LAYER_GROUPS});
  readonly activeEditorTab = this.objectEditorFacade.activeTab;
  readonly productionLayerGroups = computed(() => {
    const filter = this.layerFilter().trim().toLowerCase();
    const groups = new Map<string, LayerDefinition[]>();
    for (const layer of this.layerFacade.layers()) {
      if (filter && !`${layer.name} ${layer.group}`.toLowerCase().includes(filter)) {
        continue;
      }
      groups.set(layer.group, [...(groups.get(layer.group) ?? []), layer]);
    }
    return Array.from(groups.entries()).map(([name, layers]) => ({name, layers}));
  });
  readonly filteredLayerGroups = computed(() => {
    const filter = this.layerFilter().trim().toLowerCase();
    return this.store.layerGroups()
      .map((group) => ({
        name: group.name,
        layers: group.layers.filter((layer) => !filter || layer.layerName.toLowerCase().includes(filter))
      }))
      .filter((group) => group.layers.length > 0);
  });
  readonly toolbarTools = MAP_TOOLBAR_ACTIONS;
  readonly activeMapTool = signal<MapToolKind>('select');
  readonly snapEnabled = signal(true);
  readonly objectStatusOptions = ['NOWY', 'AKTYWNY', 'ARCHIWALNY', 'USUNIETY_LOGICZNIE', 'WERYFIKOWANY'];
  readonly draftStatusOptions = [
    'NIE_DOTYCZY',
    'DODANY_DO_WERSJI_ROBOCZEJ',
    'W_MODYFIKACJI',
    'ZAPISANY_W_WERSJI_ROBOCZEJ',
    'GOTOWY_DO_WALIDACJI',
    'GOTOWY_DO_ZAPISU_FINALNEGO'
  ];
  readonly moduleActions = MODULE_ACTIONS;
  readonly leftRailActions = LEFT_RAIL_ACTIONS;

  ngOnInit(): void {
    this.store.initialize();
  }

  trackByObjectId(_index: number, object: InfrastructureObjectDto): string {
    return object.id;
  }

  trackByRoadSectionId(_index: number, section: RoadSectionDto): string {
    return section.id;
  }

  trackByRoadId(_index: number, road: RoadDto): string {
    return road.id;
  }

  trackBySegmentId(_index: number, segment: ReferenceSegmentDto): string {
    return segment.id;
  }

  trackByIssueId(_index: number, issue: ValidationIssueDto): string {
    return issue.id;
  }

  trackByLayerCode(_index: number, layer: LayerDto): string {
    return layer.layerCode;
  }

  trackByLayerDefinitionId(_index: number, layer: LayerDefinition): string {
    return layer.id;
  }

  trackByWorkflowStepId(_index: number, step: WorkflowStep): string {
    return step.id;
  }

  selectObject(objectId: string): void {
    this.store.selectObject(objectId);
  }

  selectRoadSection(roadSectionId: string): void {
    this.store.selectRoadSection(roadSectionId);
  }

  selectSegment(segmentId: string): void {
    this.store.selectReferenceSegment(segmentId);
  }

  selectValidationIssue(issue: ValidationIssueDto): void {
    this.store.selectValidationIssue(issue);
    window.setTimeout(() => this.focusValidationField(issue.fieldName), 0);
  }

  updateTextField(field: 'name' | 'objectCode' | 'owner' | 'branch' | 'district' | 'status' | 'draftStatus', value: string): void {
    this.store.updateActiveObject({[field]: value} as Partial<InfrastructureObjectDto>);
  }

  updateRoadSectionText(field: 'name' | 'status', value: string): void {
    this.store.updateActiveRoadSection({[field]: value} as Partial<RoadSectionDto>);
  }

  updateMileage(
    field: 'globalMileageFrom' | 'globalMileageTo' | 'localMileageFrom' | 'localMileageTo',
    value: string | number | null
  ): void {
    const parsed = Number.parseFloat(String(value ?? ''));
    this.store.updateActiveObject({[field]: Number.isFinite(parsed) ? parsed : null} as Partial<InfrastructureObjectDto>);
  }

  updateRoadSectionMileage(field: 'kilometerFrom' | 'kilometerTo', value: string | number | null): void {
    const parsed = Number.parseFloat(String(value ?? ''));
    this.store.updateActiveRoadSection({[field]: Number.isFinite(parsed) ? parsed : 0} as Partial<RoadSectionDto>);
  }

  updateAttribute(field: string, value: string | number | boolean | null): void {
    this.store.updateActiveAttribute(field, value);
  }

  updateImportText(value: string): void {
    this.store.importText.set(value);
  }

  updateLayerFilter(value: string): void {
    this.layerFilter.set(value);
  }

  activateWorkflow(kind: WorkflowKind): void {
    this.workflowFacade.activate(kind);
    this.store.setRightPanelTab('Proces');
    this.store.statusMessage.set(`Aktywny proces: ${this.workflowFacade.activeWorkflow().title}.`);
  }

  selectWorkflowStep(index: number): void {
    this.workflowFacade.setStep(this.workflowFacade.activeWorkflowKind(), index);
  }

  toggleProductionLayer(layerId: string): void {
    this.layerFacade.toggleLayer(layerId);
  }

  toggleLayerGroup(groupName: string): void {
    this.expandedLayerGroups.update((groups) => ({...groups, [groupName]: !(groups[groupName] ?? true)}));
  }

  togglePanelDock(panel: DockablePanel): void {
    this.floatingPanels.update((panels) => ({...panels, [panel]: !panels[panel]}));
  }

  setPanelFloating(panel: DockablePanel, floating: boolean): void {
    this.floatingPanels.update((panels) => ({...panels, [panel]: floating}));
  }

  dockPanel(panel: DockablePanel): void {
    this.setPanelFloating(panel, false);
  }

  portalHeader(panel: DockablePanel): string {
    return this.portalLabels[panel];
  }

  portalStyle(panel: DockablePanel): Record<string, string> {
    return this.portalStyles[panel];
  }

  portalPosition(panel: DockablePanel): PortalPosition {
    return this.portalPositions[panel];
  }

  portalBaseZIndex(panel: DockablePanel): number {
    return this.portalBaseZIndexes[panel];
  }

  restoreWorkspaceLayout(): void {
    this.floatingPanels.set({map: false, table: false, 'right-panel': false});
    this.expandedLayerGroups.set({...DEFAULT_EXPANDED_LAYER_GROUPS});
    this.layerFilter.set('');
    this.activeMapTool.set('select');
    this.snapEnabled.set(true);
    this.workflowFacade.activate('map-composition');
    this.objectEditorFacade.activeTab.set(DEFAULT_EDITOR_TAB);
    this.store.setRightPanelTab(DEFAULT_RIGHT_PANEL_TAB);
    this.store.statusMessage.set('Przywrocono uklad roboczy: mapa, tabela i panel warstw sa zadokowane.');
  }

  activateMapTool(tool: MapToolKind): void {
    this.activeMapTool.set(tool);
    this.store.statusMessage.set(this.mapToolStatus(tool));
  }

  toggleSnap(): void {
    this.snapEnabled.update((enabled) => !enabled);
    this.store.statusMessage.set(this.snapEnabled()
      ? 'Dociaganie geometrii jest wlaczone.'
      : 'Dociaganie geometrii jest wylaczone.');
  }

  isMapToolActive(tool: MapToolKind): boolean {
    return this.activeMapTool() === tool;
  }

  isPanelFloating(panel: DockablePanel): boolean {
    return this.floatingPanels()[panel];
  }

  isLayerGroupExpanded(groupName: string): boolean {
    return this.expandedLayerGroups()[groupName] ?? true;
  }

  setEditorTab(tab: string): void {
    this.activeEditorTab.set(tab);
  }

  bindReference(segmentId: string): void {
    if (segmentId) {
      this.store.bindActiveToSegment(segmentId);
    }
  }

  bindRoadSectionReference(segmentId: string): void {
    if (segmentId) {
      this.store.bindActiveRoadSectionToSegment(segmentId);
    }
  }

  isLayerVisible(layerCode: string): boolean {
    return this.store.layerVisibility()[layerCode] ?? false;
  }

  attributeValue(object: InfrastructureObjectDto | null, key: string): string {
    const value = object?.attributes?.[key];
    return value === null || value === undefined ? '' : String(value);
  }

  objectTypeLabel(objectType: string): string {
    switch (objectType) {
      case 'ROAD_BARRIER':
        return 'Bariera energochłonna';
      case 'TRAFFIC_COUNTING_STATION':
        return 'Stacja pomiaru ruchu';
      case 'TECHNICAL_CHANNEL':
        return 'Kanał technologiczny';
      case 'ROAD_PARCEL':
        return 'Działka ewidencyjna';
      default:
        return objectType.replaceAll('_', ' ');
    }
  }

  geometryLabel(geometryType: string): string {
    switch (geometryType) {
      case 'POINT':
        return 'Punkt';
      case 'LINESTRING':
        return 'Linia';
      case 'POLYGON':
        return 'Poligon';
      default:
        return geometryType;
    }
  }

  layerIcon(geometryType: string): string {
    switch (geometryType) {
      case 'POINT':
        return 'pi pi-map-marker';
      case 'LINESTRING':
        return 'pi pi-minus';
      case 'POLYGON':
        return 'pi pi-stop';
      default:
        return 'pi pi-clone';
    }
  }

  workflowStepClass(status: WorkflowStep['status']): string {
    return status;
  }

  statusClass(status: string): string {
    return status.toLowerCase().replaceAll('_', '-').replaceAll('ę', 'e').replaceAll('ó', 'o');
  }

  validationClass(validationStatus: string): string {
    return validationStatus === 'OK' ? 'ok' : 'problem';
  }

  isFocusedField(fieldName: string): boolean {
    return this.store.focusedValidationField() === fieldName;
  }

  isSelectedIssue(issue: ValidationIssueDto): boolean {
    return this.store.selectedValidationIssueId() === issue.id;
  }

  issueCount(object: InfrastructureObjectDto): number {
    return this.store.validationIssues()
      .filter((issue) => issue.targetType !== 'ROAD_SECTION' && (issue.targetId ?? issue.objectId) === object.id && !issue.resolved)
      .length;
  }

  roadSectionIssueCount(section: RoadSectionDto): number {
    return this.store.validationIssues()
      .filter((issue) => issue.targetType === 'ROAD_SECTION' && issue.targetId === section.id && !issue.resolved)
      .length;
  }

  formatMileage(value: number | null): string {
    return value === null ? 'brak' : value.toFixed(3);
  }

  roadNumber(roadId: string | null): string {
    return this.store.roads().find((road) => road.id === roadId)?.roadNumber ?? '-';
  }

  selectedSegmentCode(object: InfrastructureObjectDto): string {
    return object.referenceSegmentCode ?? 'Brak dowiązania';
  }

  selectedRoadSectionSegmentCode(section: RoadSectionDto): string {
    return section.referenceBinding
      ? `${section.referenceBinding.referenceSegmentCode} - ${section.referenceBinding.consistencyStatus}`
      : section.referenceSegmentCode ?? 'Brak dowiązania';
  }

  private focusValidationField(fieldName: string | null): void {
    if (!fieldName) {
      return;
    }

    const field = document.querySelector<HTMLElement>(`[data-validation-field="${fieldName}"]`);
    field?.focus({preventScroll: true});
    field?.scrollIntoView({behavior: 'smooth', block: 'center'});
  }

  private mapToolStatus(tool: MapToolKind): string {
    switch (tool) {
      case 'draw-point':
        return 'Tryb mapowy: rysowanie punktu. Kliknij na mapie, aby dodac geometrie robocza.';
      case 'draw-line':
        return 'Tryb mapowy: rysowanie linii. Klikaj kolejne wierzcholki, zakoncz dwuklikiem.';
      case 'draw-polygon':
        return 'Tryb mapowy: rysowanie poligonu. Klikaj wierzcholki, zakoncz dwuklikiem.';
      case 'modify':
        return 'Tryb mapowy: edycja geometrii roboczej z dociaganiem do warstw.';
      case 'measure-line':
        return 'Tryb mapowy: pomiar odleglosci.';
      case 'measure-area':
        return 'Tryb mapowy: pomiar powierzchni.';
      case 'pan':
        return 'Tryb mapowy: przesuwanie i nawigacja mapy.';
      case 'select':
      default:
        return 'Tryb mapowy: identyfikacja i zaznaczanie obiektow.';
    }
  }
}
