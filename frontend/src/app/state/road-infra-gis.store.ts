import {Injectable, computed, inject, signal} from '@angular/core';
import {Observable, forkJoin, of, switchMap, tap} from 'rxjs';

import {RoadInfraGisApiService} from '../core/road-infra-gis-api.service';
import {
  DataGridMode,
  DataGridRow,
  GeoJsonFeatureCollection,
  GeoJsonGeometry,
  InfrastructureObjectDto,
  InfrastructureObjectRequest,
  LayerDto,
  LayerGroup,
  ReferenceSegmentDto,
  RightPanelTab,
  RoadDto,
  RoadSectionDto,
  RoadSectionUpdateRequest,
  TableTab,
  ValidationIssueDto,
  WorkspaceDto,
  WorkspaceObjectUpdateRequest
} from '../core/road-infra-gis.models';

@Injectable({providedIn: 'root'})
export class RoadInfraGisStore {
  private readonly api = inject(RoadInfraGisApiService);

  readonly roads = signal<RoadDto[]>([]);
  readonly referenceSegments = signal<ReferenceSegmentDto[]>([]);
  readonly infrastructureObjects = signal<InfrastructureObjectDto[]>([]);
  readonly roadSections = signal<RoadSectionDto[]>([]);
  readonly validationIssues = signal<ValidationIssueDto[]>([]);
  readonly layers = signal<LayerDto[]>([]);
  readonly workspaces = signal<WorkspaceDto[]>([]);
  readonly layerVisibility = signal<Record<string, boolean>>({});
  readonly selectedObjectId = signal<string | null>(null);
  readonly selectedRoadSectionId = signal<string | null>(null);
  readonly selectedReferenceSegmentId = signal<string | null>(null);
  readonly selectedValidationIssueId = signal<string | null>(null);
  readonly focusedValidationField = signal<string | null>(null);
  readonly validationMapFocus = signal<GeoJsonGeometry | null>(null);
  readonly rightPanelTab = signal<RightPanelTab>('Warstwy');
  readonly activeTableTab = signal<TableTab>('Wszystkie obiekty');
  readonly tableFilter = signal('');
  readonly gridGlobalFilter = signal('');
  readonly gridColumnFilters = signal<Record<string, string>>({});
  readonly gridFilterRevision = signal(0);
  readonly statusMessage = signal('Ładowanie danych systemu GIS...');
  readonly loading = signal(false);
  readonly importText = signal('');

  readonly activeObject = computed(() => {
    const id = this.selectedObjectId();
    return this.infrastructureObjects().find((object) => object.id === id) ?? null;
  });

  readonly activeRoadSection = computed(() => {
    const id = this.selectedRoadSectionId();
    return this.roadSections().find((section) => section.id === id) ?? null;
  });

  readonly activeWorkspace = computed(() => {
    return this.workspaces().find((workspace) => workspace.status === 'AKTYWNY' || workspace.status === 'W_WALIDACJI')
      ?? null;
  });

  readonly activeValidationIssues = computed(() => {
    const roadSectionId = this.selectedRoadSectionId();
    if (roadSectionId) {
      return this.validationIssues().filter((issue) =>
        issue.targetType === 'ROAD_SECTION' && issue.targetId === roadSectionId && !issue.resolved
      );
    }

    const objectId = this.selectedObjectId();
    return objectId
      ? this.validationIssues().filter((issue) =>
          issue.targetType !== 'ROAD_SECTION' && (issue.targetId ?? issue.objectId) === objectId && !issue.resolved
        )
      : [];
  });

  readonly workspaceObjectCount = computed(() => {
    const objectCount = this.infrastructureObjects().filter((object) => this.isObjectInActiveWorkspace(object)).length;
    const roadSectionCount = this.roadSections().filter((section) => this.isRoadSectionInActiveWorkspace(section)).length;
    return objectCount + roadSectionCount;
  });

  readonly blockingIssueCount = computed(() => {
    return this.validationIssues().filter((issue) => this.isBlockingSeverity(issue.severity) && !issue.resolved).length;
  });

  readonly activeGridMode = computed<DataGridMode>(() => {
    switch (this.activeTableTab()) {
      case 'Odcinki drogi':
        return 'ROAD_SECTIONS';
      case 'System referencyjny':
        return 'REFERENCE_SEGMENTS';
      default:
        return 'OBJECTS';
    }
  });

  readonly layerGroups = computed<LayerGroup[]>(() => {
    const groups = new Map<string, LayerDto[]>();
    for (const layer of this.layers()) {
      groups.set(layer.groupName, [...(groups.get(layer.groupName) ?? []), layer]);
    }
    return Array.from(groups.entries()).map(([name, layers]) => ({name, layers}));
  });

  readonly filteredObjects = computed(() => {
    const filter = this.tableFilter().trim().toLowerCase();
    const issueObjectIds = new Set(
      this.validationIssues()
        .filter((issue) => issue.targetType !== 'ROAD_SECTION')
        .map((issue) => issue.targetId ?? issue.objectId)
        .filter(isPresent)
    );
    return this.infrastructureObjects().filter((object) => {
      const tabMatch = this.tableTabMatches(object, issueObjectIds);
      const filterMatch = !filter || [
        object.objectCode,
        object.name,
        object.objectType,
        object.roadNumber ?? '',
        object.referenceSegmentCode ?? ''
      ].join(' ').toLowerCase().includes(filter);
      return tabMatch && filterMatch;
    });
  });

  readonly filteredRoadSections = computed(() => {
    const filter = this.tableFilter().trim().toLowerCase();
    return this.roadSections().filter((section) => {
      const filterMatch = !filter || [
        section.sectionCode,
        section.businessId,
        section.name,
        section.roadNumber,
        section.referenceSegmentCode ?? '',
        section.carriageway,
        section.direction
      ].join(' ').toLowerCase().includes(filter);
      return filterMatch;
    });
  });

  readonly gridRows = computed<DataGridRow[]>(() => {
    const filter = this.gridFilterValue();
    const columnFilters = this.gridColumnFilters();

    switch (this.activeGridMode()) {
      case 'ROAD_SECTIONS':
        return this.roadSections()
          .map((section) => this.toRoadSectionGridRow(section))
          .filter((row) => this.matchesGridFilters(row, filter, columnFilters));
      case 'REFERENCE_SEGMENTS':
        return this.referenceSegments()
          .map((segment) => this.toReferenceSegmentGridRow(segment))
          .filter((row) => this.matchesGridFilters(row, filter, columnFilters));
      default:
        return this.filteredObjects()
          .map((object) => this.toObjectGridRow(object))
          .filter((row) => this.matchesGridFilters(row, filter, columnFilters));
    }
  });

  readonly selectedGridRow = computed<DataGridRow | null>(() => {
    const selectedId = this.activeGridMode() === 'ROAD_SECTIONS'
      ? this.selectedRoadSectionId()
      : this.activeGridMode() === 'REFERENCE_SEGMENTS'
        ? this.selectedReferenceSegmentId()
        : this.selectedObjectId();

    return selectedId ? this.gridRows().find((row) => row.id === selectedId) ?? null : null;
  });

  readonly filteredGridGeometries = computed(() => {
    return this.gridRows().map((row) => row.geometry).filter(isPresent);
  });

  initialize(): void {
    this.loading.set(true);
    forkJoin({
      roads: this.api.roads(),
      referenceSegments: this.api.referenceSegments(),
      objects: this.api.infrastructureObjects(),
      roadSections: this.api.roadSections(),
      issues: this.api.validationIssues(),
      layers: this.api.layers(),
      workspaces: this.api.workspaces()
    }).subscribe({
      next: ({roads, referenceSegments, objects, roadSections, issues, layers, workspaces}) => {
        this.roads.set(roads);
        this.referenceSegments.set(referenceSegments);
        this.infrastructureObjects.set(objects);
        this.roadSections.set(roadSections);
        this.validationIssues.set(issues);
        this.layers.set(layers);
        this.workspaces.set(workspaces);
        this.layerVisibility.set(Object.fromEntries(layers.map((layer) => [layer.layerCode, layer.visibleByDefault])));
        this.selectedObjectId.set(objects[0]?.id ?? null);
        this.selectedRoadSectionId.set(null);
        this.statusMessage.set(
          `Załadowano ${objects.length} obiektów infrastruktury, ${roadSections.length} odcinków drogi i ${referenceSegments.length} odcinków SR.`
        );
        this.loading.set(false);
      },
      error: () => {
        this.statusMessage.set('Nie udało się pobrać danych. Sprawdź, czy backend Spring Boot działa na porcie 8080.');
        this.loading.set(false);
      }
    });
  }

  selectObject(objectId: string): void {
    this.selectedObjectId.set(objectId);
    this.selectedRoadSectionId.set(null);
    this.selectedValidationIssueId.set(null);
    this.focusedValidationField.set(null);
    this.validationMapFocus.set(null);
    this.rightPanelTab.set('Atrybuty');
    const object = this.infrastructureObjects().find((item) => item.id === objectId);
    if (object?.referenceSegmentId) {
      this.selectedReferenceSegmentId.set(object.referenceSegmentId);
    }
  }

  selectRoadSection(roadSectionId: string): void {
    this.selectedRoadSectionId.set(roadSectionId);
    this.selectedObjectId.set(null);
    this.selectedValidationIssueId.set(null);
    this.focusedValidationField.set(null);
    this.validationMapFocus.set(null);
    this.rightPanelTab.set('Atrybuty');
    const section = this.roadSections().find((item) => item.id === roadSectionId);
    if (section?.referenceSegmentId) {
      this.selectedReferenceSegmentId.set(section.referenceSegmentId);
    }
  }

  selectReferenceSegment(segmentId: string): void {
    this.selectedReferenceSegmentId.set(segmentId);
    this.selectedValidationIssueId.set(null);
    this.focusedValidationField.set(null);
    this.validationMapFocus.set(null);
    this.rightPanelTab.set('Info');
  }

  selectValidationIssue(issue: ValidationIssueDto): void {
    const targetId = issue.targetId ?? issue.objectId;
    if (issue.targetType === 'ROAD_SECTION' && targetId) {
      this.selectedRoadSectionId.set(targetId);
      this.selectedObjectId.set(null);
      const section = this.roadSections().find((item) => item.id === targetId);
      if (section?.referenceSegmentId) {
        this.selectedReferenceSegmentId.set(section.referenceSegmentId);
      }
    } else if (targetId) {
      this.selectedObjectId.set(targetId);
      this.selectedRoadSectionId.set(null);
      const object = this.infrastructureObjects().find((item) => item.id === targetId);
      if (object?.referenceSegmentId) {
        this.selectedReferenceSegmentId.set(object.referenceSegmentId);
      }
    }

    this.selectedValidationIssueId.set(issue.id);
    this.focusedValidationField.set(issue.fieldName);
    this.validationMapFocus.set(issue.geometryMarker ?? this.activeObject()?.geometry ?? this.activeRoadSection()?.geometry ?? null);
    this.activeTableTab.set('Błędy walidacji');
    this.rightPanelTab.set('Atrybuty');
    this.statusMessage.set(`Przejście do błędu ${issue.issueType}: ${issue.targetCode ?? issue.objectCode ?? 'rekord'}.`);
  }

  setRightPanelTab(tab: RightPanelTab): void {
    this.rightPanelTab.set(tab);
  }

  setTableTab(tab: TableTab): void {
    this.activeTableTab.set(tab);
  }

  setGridGlobalFilter(filter: string): void {
    this.gridGlobalFilter.set(filter);
    this.tableFilter.set(filter);
    this.gridFilterRevision.update((revision) => revision + 1);
  }

  setGridColumnFilter(field: string, value: string): void {
    this.gridColumnFilters.update((filters) => {
      const next = {...filters};
      const normalized = value.trim();
      if (normalized) {
        next[field] = normalized;
      } else {
        delete next[field];
      }
      return next;
    });
    this.gridFilterRevision.update((revision) => revision + 1);
  }

  clearGridFilters(): void {
    this.gridGlobalFilter.set('');
    this.tableFilter.set('');
    this.gridColumnFilters.set({});
    this.gridFilterRevision.update((revision) => revision + 1);
  }

  isBlockingSeverity(severity: string | null | undefined): boolean {
    return severity === 'BLOCKING' || severity === 'BLOCKER';
  }

  toggleLayer(layerCode: string): void {
    this.layerVisibility.update((visibility) => ({
      ...visibility,
      [layerCode]: !visibility[layerCode]
    }));
  }

  updateActiveObject(patch: Partial<InfrastructureObjectDto>): void {
    const object = this.activeObject();
    if (!object) {
      return;
    }
    const draftStatus = this.isObjectInActiveWorkspace(object) && object.draftStatus === 'DODANY_DO_WERSJI_ROBOCZEJ'
      ? 'W_MODYFIKACJI'
      : object.draftStatus;
    this.replaceObject({
      ...object,
      ...patch,
      draftStatus: patch.draftStatus ?? draftStatus
    });
  }

  updateActiveRoadSection(patch: Partial<RoadSectionDto>): void {
    const section = this.activeRoadSection();
    if (!section) {
      return;
    }
    const draftStatus = this.isRoadSectionInActiveWorkspace(section) && section.draftStatus === 'DODANY_DO_WERSJI_ROBOCZEJ'
      ? 'W_MODYFIKACJI'
      : section.draftStatus;
    this.replaceRoadSection({
      ...section,
      ...patch,
      draftStatus: patch.draftStatus ?? draftStatus
    });
  }

  updateActiveAttribute(field: string, value: string | number | boolean | null): void {
    const object = this.activeObject();
    if (!object) {
      return;
    }
    this.updateActiveObject({
      attributes: {
        ...object.attributes,
        [field]: value
      }
    });
  }

  saveActiveSelection(): void {
    if (this.activeRoadSection()) {
      this.saveActiveRoadSection();
      return;
    }
    this.saveActiveObject();
  }

  validateActiveSelection(): void {
    if (this.activeRoadSection()) {
      this.validateWorkspace();
      return;
    }
    this.validateActiveObject();
  }

  saveActiveObject(): void {
    const object = this.activeObject();
    if (!object) {
      return;
    }
    const workspace = this.activeWorkspace();
    const save$ = workspace && this.isObjectInActiveWorkspace(object)
      ? this.api.updateWorkspaceObject(workspace.id, object.id, this.toWorkspaceUpdateRequest(object))
      : this.api.updateInfrastructureObject(object.id, this.toRequest(object));
    this.loading.set(true);
    save$.subscribe({
      next: (updated) => {
        this.replaceObject(updated);
        this.statusMessage.set(`Zapisano wersję roboczą obiektu ${updated.objectCode}.`);
        this.loading.set(false);
      },
      error: () => {
        this.statusMessage.set('Zapis wersji roboczej nie powiódł się.');
        this.loading.set(false);
      }
    });
  }

  saveActiveRoadSection(): void {
    const section = this.activeRoadSection();
    if (!section) {
      return;
    }

    this.loading.set(true);
    this.ensureRoadSectionWorkspace(section).pipe(
      switchMap((workspace) => this.api.updateWorkspaceRoadSection(
        workspace.id,
        section.id,
        this.toRoadSectionUpdateRequest(this.activeRoadSection() ?? section)
      ))
    ).subscribe({
      next: (updated) => {
        this.replaceRoadSection(updated);
        this.statusMessage.set(`Zapisano wersję roboczą odcinka ${updated.sectionCode}.`);
        this.loading.set(false);
      },
      error: () => {
        this.statusMessage.set('Zapis odcinka drogi w wersji roboczej nie powiódł się.');
        this.loading.set(false);
      }
    });
  }

  validateActiveObject(): void {
    const object = this.activeObject();
    if (!object) {
      return;
    }
    this.api.validateInfrastructureObject(object.id).subscribe({
      next: (response) => {
        this.validationIssues.update((issues) => [
          ...issues.filter((issue) => (issue.targetId ?? issue.objectId) !== object.id),
          ...response.issues
        ]);
        this.updateActiveObject({validationStatus: response.validationStatus});
        this.statusMessage.set(`Walidacja obiektu ${object.objectCode}: ${response.validationStatus}.`);
      },
      error: () => this.statusMessage.set('Walidacja obiektu nie powiodła się.')
    });
  }

  createWorkspace(): void {
    this.api.createWorkspace().subscribe({
      next: (workspace) => {
        this.workspaces.update((items) => [workspace, ...items.filter((item) => item.id !== workspace.id)]);
        this.statusMessage.set(`Utworzono workspace: ${workspace.name}.`);
      },
      error: () => this.statusMessage.set('Nie udało się utworzyć workspace.')
    });
  }

  addActiveToWorkspace(): void {
    if (this.activeRoadSection()) {
      this.addActiveRoadSectionToWorkspace();
      return;
    }

    const object = this.activeObject();
    const workspace = this.activeWorkspace();
    if (!object) {
      return;
    }
    const request$ = workspace
      ? this.api.addObjectToWorkspace(workspace.id, object.id)
      : this.api.createWorkspace().pipe(switchMap((created) => this.api.addObjectToWorkspace(created.id, object.id)));
    request$.subscribe({
      next: (updatedWorkspace) => {
        this.workspaces.update((items) => [updatedWorkspace, ...items.filter((item) => item.id !== updatedWorkspace.id)]);
        this.updateActiveObject({draftStatus: 'DODANY_DO_WERSJI_ROBOCZEJ'});
        this.statusMessage.set(`Dodano ${object.objectCode} do wersji roboczej.`);
      },
      error: () => this.statusMessage.set('Dodanie obiektu do wersji roboczej nie powiodło się.')
    });
  }

  addActiveRoadSectionToWorkspace(): void {
    const section = this.activeRoadSection();
    if (!section) {
      return;
    }

    this.ensureRoadSectionWorkspace(section).subscribe({
      next: () => this.statusMessage.set(`Dodano odcinek ${section.sectionCode} do wersji roboczej.`),
      error: () => this.statusMessage.set('Dodanie odcinka drogi do wersji roboczej nie powiodło się.')
    });
  }

  validateWorkspace(): void {
    const workspace = this.activeWorkspace();
    if (!workspace) {
      this.statusMessage.set('Najpierw utwórz workspace.');
      return;
    }
    this.api.validateWorkspace(workspace.id).subscribe({
      next: (issues) => {
        const workspaceObjectIds = this.workspaceObjectIds();
        const workspaceRoadSectionIds = this.workspaceRoadSectionIds();
        this.validationIssues.update((current) => [
          ...current.filter((issue) => !this.issueBelongsToWorkspace(issue, workspaceObjectIds, workspaceRoadSectionIds)),
          ...issues
        ]);
        this.statusMessage.set(`Walidacja workspace: ${issues.length} aktywnych problemów.`);
      },
      error: () => this.statusMessage.set('Walidacja workspace nie powiodła się.')
    });
  }

  finalizeWorkspace(): void {
    const workspace = this.activeWorkspace();
    if (!workspace) {
      return;
    }
    this.api.finalizeWorkspace(workspace.id).subscribe({
      next: (updated) => {
        this.workspaces.update((items) => [updated, ...items.filter((item) => item.id !== updated.id)]);
        this.refreshOperationalData();
        this.statusMessage.set(updated.status === 'SFINALIZOWANY'
          ? 'Workspace zapisany do bazy finalnej.'
          : 'Workspace wymaga usunięcia błędów blokujących.');
      },
      error: () => this.statusMessage.set('Finalizacja workspace nie powiodła się.')
    });
  }

  rejectWorkspace(): void {
    const workspace = this.activeWorkspace();
    if (!workspace) {
      return;
    }
    this.api.rejectWorkspace(workspace.id).subscribe({
      next: (updated) => {
        this.workspaces.update((items) => [updated, ...items.filter((item) => item.id !== updated.id)]);
        this.refreshOperationalData();
        this.statusMessage.set('Odrzucono zmiany w wersji roboczej.');
      },
      error: () => this.statusMessage.set('Odrzucenie workspace nie powiodło się.')
    });
  }

  bindActiveToSegment(segmentId: string): void {
    if (this.activeRoadSection()) {
      this.bindActiveRoadSectionToSegment(segmentId);
      return;
    }

    const object = this.activeObject();
    if (!object) {
      return;
    }
    this.bindReferenceSegmentRequest(object, segmentId).subscribe({
      next: (updated) => {
        this.replaceObject(updated);
        this.selectedReferenceSegmentId.set(segmentId);
        this.statusMessage.set(`Dowiązano ${updated.objectCode} do odcinka SR.`);
      },
      error: () => this.statusMessage.set('Dowiązanie do SR nie powiodło się.')
    });
  }

  bindActiveRoadSectionToSegment(segmentId: string): void {
    const section = this.activeRoadSection();
    if (!section || !segmentId) {
      return;
    }

    this.ensureRoadSectionWorkspace(section).pipe(
      switchMap((workspace) => this.api.bindWorkspaceRoadSectionReferenceSegment(workspace.id, section.id, segmentId))
    ).subscribe({
      next: (updated) => {
        this.replaceRoadSection(updated);
        this.selectedReferenceSegmentId.set(segmentId);
        this.statusMessage.set(`Dowiązano odcinek ${updated.sectionCode} do odcinka SR.`);
      },
      error: () => this.statusMessage.set('Dowiązanie odcinka drogi do SR nie powiodło się.')
    });
  }

  suggestAndBindReference(): void {
    const object = this.activeObject();
    const point = object ? this.geometryRepresentativePoint(object.geometry) : null;
    if (!object || !point) {
      this.statusMessage.set('Brak geometrii do automatycznej sugestii SR.');
      return;
    }
    this.api.nearestReferenceSegment(point.lat, point.lon, object.roadNumber ?? undefined).pipe(
      switchMap((segment) => this.bindReferenceSegmentRequest(object, segment.id))
    ).subscribe({
      next: (updated) => {
        this.replaceObject(updated);
        this.statusMessage.set(`Automatycznie dowiązano ${updated.objectCode} do najbliższego odcinka SR.`);
      },
      error: () => this.statusMessage.set('Nie znaleziono najbliższego odcinka referencyjnego.')
    });
  }

  importGeoJson(): void {
    try {
      const payload = JSON.parse(this.importText()) as GeoJsonFeatureCollection;
      this.api.importGeoJson(payload).subscribe({
        next: (job) => {
          this.statusMessage.set(`Import GeoJSON zakończony: ${job.importedCount} obiektów, odrzucone ${job.rejectedCount}.`);
          this.initialize();
        },
        error: () => this.statusMessage.set('Import GeoJSON nie powiódł się.')
      });
    } catch {
      this.statusMessage.set('Pole importu nie zawiera poprawnego GeoJSON FeatureCollection.');
    }
  }

  exportCsv(): void {
    window.location.href = '/api/export/objects.csv';
  }

  exportGeoJson(): void {
    window.location.href = '/api/export/objects.geojson';
  }

  objectLayerCode(object: InfrastructureObjectDto): string {
    return switchObjectLayer(object.objectType);
  }

  private gridFilterValue(): string {
    return (this.gridGlobalFilter() || this.tableFilter()).trim().toLowerCase();
  }

  private matchesGridFilters(
    row: DataGridRow,
    globalFilter: string,
    columnFilters: Record<string, string>
  ): boolean {
    const haystack = [
      row.primaryCode,
      row.secondaryLabel,
      row.roadNumber,
      row.referenceLabel,
      row.mileageLabel,
      row.status,
      row.validationStatus,
      row.draftStatus
    ].join(' ').toLowerCase();

    if (globalFilter && !haystack.includes(globalFilter)) {
      return false;
    }

    return Object.entries(columnFilters).every(([field, value]) => {
      const cellValue = this.gridCellValue(row, field).toLowerCase();
      return cellValue.includes(value.toLowerCase());
    });
  }

  private gridCellValue(row: DataGridRow, field: string): string {
    const value = row[field as keyof DataGridRow];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }

  private toObjectGridRow(object: InfrastructureObjectDto): DataGridRow {
    return {
      id: object.id,
      kind: 'OBJECT',
      primaryCode: object.objectCode,
      secondaryLabel: `${object.objectType} - ${object.name}`,
      roadNumber: object.roadNumber ?? '-',
      referenceLabel: object.referenceSegmentCode ?? 'Brak dowiązania SR',
      mileageLabel: this.formatMileageRange(object.globalMileageFrom, object.globalMileageTo),
      status: object.status,
      validationStatus: object.validationStatus,
      draftStatus: object.draftStatus,
      issueCount: this.issueCountFor('OBJECT', object.id),
      geometry: object.geometry,
      source: object
    };
  }

  private toRoadSectionGridRow(section: RoadSectionDto): DataGridRow {
    return {
      id: section.id,
      kind: 'ROAD_SECTION',
      primaryCode: section.sectionCode,
      secondaryLabel: section.name,
      roadNumber: section.roadNumber,
      referenceLabel: section.referenceSegmentCode ?? 'Brak dowiązania SR',
      mileageLabel: this.formatMileageRange(section.kilometerFrom, section.kilometerTo),
      status: section.status,
      validationStatus: section.validationStatus,
      draftStatus: section.draftStatus,
      issueCount: this.issueCountFor('ROAD_SECTION', section.id),
      geometry: section.geometry,
      source: section
    };
  }

  private toReferenceSegmentGridRow(segment: ReferenceSegmentDto): DataGridRow {
    return {
      id: segment.id,
      kind: 'REFERENCE_SEGMENT',
      primaryCode: segment.segmentCode,
      secondaryLabel: `${segment.carriageway} - ${segment.direction}`,
      roadNumber: segment.roadNumber,
      referenceLabel: segment.segmentCode,
      mileageLabel: this.formatMileageRange(segment.startMileageKm, segment.endMileageKm),
      status: segment.status,
      validationStatus: 'NIE_DOTYCZY',
      draftStatus: 'NIE_DOTYCZY',
      issueCount: this.issueCountFor('REFERENCE_SEGMENT', segment.id),
      geometry: segment.geometry,
      source: segment
    };
  }

  private issueCountFor(kind: DataGridRow['kind'], id: string): number {
    return this.validationIssues().filter((issue) => {
      if (issue.resolved) {
        return false;
      }
      if (kind === 'ROAD_SECTION') {
        return issue.targetType === 'ROAD_SECTION' && issue.targetId === id;
      }
      if (kind === 'REFERENCE_SEGMENT') {
        return issue.targetType === 'REFERENCE_SEGMENT' && issue.targetId === id;
      }
      return issue.targetType !== 'ROAD_SECTION' && (issue.targetId ?? issue.objectId) === id;
    }).length;
  }

  private formatMileageRange(from: number | null, to: number | null): string {
    if (from === null && to === null) {
      return '-';
    }
    if (from === null || to === null || from === to) {
      return `${this.formatMileageValue(from ?? to)}`;
    }
    return `${this.formatMileageValue(from)} - ${this.formatMileageValue(to)}`;
  }

  private formatMileageValue(value: number | null): string {
    return value === null ? '-' : `${value.toFixed(3)} km`;
  }

  private tableTabMatches(object: InfrastructureObjectDto, issueObjectIds: Set<string>): boolean {
    switch (this.activeTableTab()) {
      case 'Obiekty w edycji':
        return this.isObjectInActiveWorkspace(object);
      case 'Błędy walidacji':
        return issueObjectIds.has(object.id) || object.validationStatus !== 'OK';
      case 'Działki':
        return object.objectType === 'ROAD_PARCEL';
      case 'Stacje pomiaru ruchu':
        return object.objectType === 'TRAFFIC_COUNTING_STATION';
      case 'Bariery':
        return object.objectType === 'ROAD_BARRIER';
      case 'Odcinki drogi':
      case 'System referencyjny':
        return false;
      default:
        return true;
    }
  }

  private replaceObject(updated: InfrastructureObjectDto): void {
    this.infrastructureObjects.update((objects) => objects.map((object) => object.id === updated.id ? updated : object));
  }

  private replaceRoadSection(updated: RoadSectionDto): void {
    this.roadSections.update((sections) => sections.map((section) => section.id === updated.id ? updated : section));
  }

  private toRequest(object: InfrastructureObjectDto): InfrastructureObjectRequest {
    return {
      objectType: object.objectType,
      objectCode: object.objectCode,
      name: object.name,
      roadId: object.roadId,
      referenceSegmentId: object.referenceSegmentId,
      globalMileageFrom: object.globalMileageFrom,
      globalMileageTo: object.globalMileageTo,
      localMileageFrom: object.localMileageFrom,
      localMileageTo: object.localMileageTo,
      geometry: object.geometry,
      geometryType: object.geometryType,
      owner: object.owner,
      branch: object.branch,
      district: object.district,
      status: object.status,
      validationStatus: object.validationStatus,
      draftStatus: object.draftStatus,
      attributes: object.attributes ?? {}
    };
  }

  private toWorkspaceUpdateRequest(object: InfrastructureObjectDto): WorkspaceObjectUpdateRequest {
    return {
      name: object.name,
      globalMileageFrom: object.globalMileageFrom,
      globalMileageTo: object.globalMileageTo,
      referenceSegmentId: object.referenceSegmentId,
      geometry: object.geometry,
      attributes: object.attributes ?? {}
    };
  }

  private toRoadSectionUpdateRequest(section: RoadSectionDto): RoadSectionUpdateRequest {
    return {
      name: section.name,
      referenceSegmentId: section.referenceSegmentId,
      kilometerFrom: section.kilometerFrom,
      kilometerTo: section.kilometerTo,
      geometry: section.geometry,
      status: section.status
    };
  }

  private bindReferenceSegmentRequest(
    object: InfrastructureObjectDto,
    segmentId: string
  ): Observable<InfrastructureObjectDto> {
    const workspace = this.activeWorkspace();
    if (workspace && this.isObjectInActiveWorkspace(object)) {
      return this.api.bindWorkspaceReferenceSegment(workspace.id, object.id, segmentId);
    }
    return this.api.bindReferenceSegment(object.id, segmentId);
  }

  private ensureRoadSectionWorkspace(section: RoadSectionDto): Observable<WorkspaceDto> {
    const workspace = this.activeWorkspace();
    if (workspace && this.isRoadSectionInActiveWorkspace(section)) {
      return of(workspace);
    }

    const request$ = workspace
      ? this.api.addRoadSectionToWorkspace(workspace.id, section.id)
      : this.api.createWorkspace().pipe(switchMap((created) => this.api.addRoadSectionToWorkspace(created.id, section.id)));

    return request$.pipe(
      tap((updatedWorkspace) => {
        this.workspaces.update((items) => [updatedWorkspace, ...items.filter((item) => item.id !== updatedWorkspace.id)]);
        this.replaceRoadSection({
          ...section,
          draftStatus: 'DODANY_DO_WERSJI_ROBOCZEJ'
        });
      })
    );
  }

  private workspaceObjectIds(): Set<string> {
    return new Set(
      this.infrastructureObjects()
        .filter((object) => this.isObjectInActiveWorkspace(object))
        .map((object) => object.id)
    );
  }

  private workspaceRoadSectionIds(): Set<string> {
    return new Set(
      this.roadSections()
        .filter((section) => this.isRoadSectionInActiveWorkspace(section))
        .map((section) => section.id)
    );
  }

  private isObjectInActiveWorkspace(object: InfrastructureObjectDto): boolean {
    return this.activeWorkspace() !== null
      && object.draftStatus !== 'NIE_DOTYCZY'
      && object.draftStatus !== 'ZAPISANY_DO_BAZY_FINALNEJ'
      && object.draftStatus !== 'ODRZUCONY';
  }

  private isRoadSectionInActiveWorkspace(section: RoadSectionDto): boolean {
    return this.activeWorkspace() !== null
      && section.draftStatus !== 'NIE_DOTYCZY'
      && section.draftStatus !== 'ZAPISANY_DO_BAZY_FINALNEJ'
      && section.draftStatus !== 'ODRZUCONY';
  }

  private issueBelongsToWorkspace(
    issue: ValidationIssueDto,
    objectIds: Set<string>,
    roadSectionIds: Set<string>
  ): boolean {
    if (issue.targetType === 'ROAD_SECTION') {
      return issue.targetId !== null && roadSectionIds.has(issue.targetId);
    }
    const objectId = issue.targetId ?? issue.objectId;
    return objectId !== null && objectIds.has(objectId);
  }

  private refreshOperationalData(): void {
    forkJoin({
      objects: this.api.infrastructureObjects(),
      roadSections: this.api.roadSections(),
      issues: this.api.validationIssues(),
      workspaces: this.api.workspaces()
    }).subscribe({
      next: ({objects, roadSections, issues, workspaces}) => {
        this.infrastructureObjects.set(objects);
        this.roadSections.set(roadSections);
        this.validationIssues.set(issues);
        this.workspaces.set(workspaces);
        if (!objects.some((object) => object.id === this.selectedObjectId())) {
          this.selectedObjectId.set(objects[0]?.id ?? null);
        }
        if (!roadSections.some((section) => section.id === this.selectedRoadSectionId())) {
          this.selectedRoadSectionId.set(null);
        }
      }
    });
  }

  private geometryRepresentativePoint(geometry: GeoJsonGeometry | null): {lat: number; lon: number} | null {
    if (!geometry?.coordinates) {
      return null;
    }
    const first = firstCoordinate(geometry.coordinates);
    return first ? {lon: first[0], lat: first[1]} : null;
  }
}

function switchObjectLayer(objectType: string): string {
  switch (objectType) {
    case 'ROAD_BARRIER':
      return 'road-barriers';
    case 'TRAFFIC_COUNTING_STATION':
      return 'traffic-stations';
    case 'TECHNICAL_CHANNEL':
      return 'technical-channels';
    case 'ROAD_PARCEL':
      return 'parcels';
    default:
      return 'objects';
  }
}

function firstCoordinate(coordinates: unknown): [number, number] | null {
  if (!Array.isArray(coordinates)) {
    return null;
  }
  if (coordinates.length >= 2 && typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    return [coordinates[0], coordinates[1]];
  }
  for (const child of coordinates) {
    const candidate = firstCoordinate(child);
    if (candidate) {
      return candidate;
    }
  }
  return null;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
