import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {Table, TableModule} from 'primeng/table';

import {DataGridMode, DataGridRow, GridColumnDefinition, TableTab} from '../../core/road-infra-gis.models';
import {RoadInfraGisStore} from '../../state/road-infra-gis.store';
import {StatusBadgeComponent} from './status-badge.component';

interface DataManagementGridStorePort {
  activeTableTab(): TableTab;
  activeGridMode?: () => DataGridMode;
  gridRows?: () => DataGridRow[];
  selectedGridRow?: () => DataGridRow | null;
  setGridGlobalFilter?: (value: string) => void;
  setGridColumnFilter?: (field: string, value: string) => void;
  clearGridFilters?: () => void;
  setTableTab(tab: TableTab): void;
  selectObject(objectId: string): void;
  selectRoadSection(roadSectionId: string): void;
  selectReferenceSegment(segmentId: string): void;
  exportCsv(): void;
  exportGeoJson(): void;
}

interface TableTabOption {
  label: TableTab;
  mode: DataGridMode;
}

type PrimeTableFilterMeta =
  | {
      value?: unknown;
      constraints?: Array<{value?: unknown}>;
    }
  | Array<{value?: unknown}>
  | unknown;

interface PrimeTableFilterEvent {
  filters?: Record<string, PrimeTableFilterMeta>;
}

@Component({
  selector: 'rgp-data-management-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, StatusBadgeComponent],
  templateUrl: './data-management-grid.component.html',
  styleUrl: './data-management-grid.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataManagementGridComponent {
  private readonly store = inject(RoadInfraGisStore) as unknown as DataManagementGridStorePort;

  readonly floating = input(false);
  readonly dockToggle = output<void>();

  readonly tableTabs: TableTabOption[] = [
    {label: 'Wszystkie obiekty', mode: 'OBJECTS'},
    {label: 'Obiekty w edycji', mode: 'OBJECTS'},
    {label: 'Błędy walidacji', mode: 'OBJECTS'},
    {label: 'Działki', mode: 'OBJECTS'},
    {label: 'Stacje pomiaru ruchu', mode: 'OBJECTS'},
    {label: 'Bariery', mode: 'OBJECTS'},
    {label: 'Odcinki drogi', mode: 'ROAD_SECTIONS'},
    {label: 'System referencyjny', mode: 'REFERENCE_SEGMENTS'}
  ];

  readonly globalFilter = signal('');
  readonly columnFilters = signal<Record<string, string>>({});
  readonly rows = computed(() => this.store.gridRows?.() ?? []);
  readonly selectedRow = computed(() => this.store.selectedGridRow?.() ?? null);
  readonly activeTableTab = computed(() => this.store.activeTableTab());
  readonly activeGridMode = computed(() => this.store.activeGridMode?.() ?? this.modeFromTab(this.activeTableTab()));
  readonly columns = computed<GridColumnDefinition[]>(() => this.columnsForMode(this.activeGridMode()));
  readonly activeColumnFilterCount = computed(() => Object.keys(this.columnFilters()).length);
  readonly globalFilterFields = [
    'primaryCode',
    'secondaryLabel',
    'roadNumber',
    'referenceLabel',
    'mileageLabel',
    'status',
    'validationStatus',
    'draftStatus'
  ];

  readonly emptyStateTitle = computed(() => {
    switch (this.activeGridMode()) {
      case 'ROAD_SECTIONS':
        return 'Brak odcinków drogi dla bieżącego zakresu';
      case 'REFERENCE_SEGMENTS':
        return 'Brak segmentów systemu referencyjnego';
      default:
        return 'Brak obiektów infrastruktury dla bieżącego filtra';
    }
  });

  readonly emptyStateText = computed(() => {
    if (this.globalFilter().trim()) {
      return 'Zmień filtr tekstowy albo wybierz inny widok tabeli.';
    }

    return 'Dane pojawią się po zasileniu widoku z magazynu danych roboczych.';
  });

  onGlobalFilterChange(table: Table, value: string): void {
    this.globalFilter.set(value);
    table.filterGlobal(value, 'contains');
    this.store.setGridGlobalFilter?.(value);
  }

  onColumnFilterChange(table: Table, field: string, value: string): void {
    const normalizedValue = value.trim();
    this.columnFilters.update((filters) => {
      const nextFilters = {...filters};
      if (normalizedValue) {
        nextFilters[field] = normalizedValue;
      } else {
        delete nextFilters[field];
      }

      return nextFilters;
    });
    table.filter(value, field, this.columns().find((column) => column.field === field)?.filterType === 'numeric' ? 'equals' : 'contains');
    this.store.setGridColumnFilter?.(field, value);
  }

  syncPrimeFilters(event: PrimeTableFilterEvent): void {
    const nextFilters: Record<string, string> = {};
    const filters = event.filters ?? {};

    for (const column of this.columns()) {
      const value = this.filterValueFromMeta(filters[column.field]);
      if (value) {
        nextFilters[column.field] = value;
      }
    }

    const previousFilters = this.columnFilters();
    this.columnFilters.set(nextFilters);

    for (const field of new Set([...Object.keys(previousFilters), ...Object.keys(nextFilters)])) {
      this.store.setGridColumnFilter?.(field, nextFilters[field] ?? '');
    }
  }

  clearFilters(table: Table): void {
    this.globalFilter.set('');
    this.columnFilters.set({});
    table.clear();
    this.store.clearGridFilters?.();
  }

  toggleDock(): void {
    this.dockToggle.emit();
  }

  setTableTab(tab: TableTab): void {
    this.store.setTableTab(tab);
  }

  setTableTabFromSelect(tab: TableTab): void {
    this.setTableTab(tab);
  }

  selectRow(row: DataGridRow | null | undefined): void {
    if (!row) {
      return;
    }

    switch (row.kind) {
      case 'ROAD_SECTION':
        this.store.selectRoadSection(row.id);
        break;
      case 'REFERENCE_SEGMENT':
        this.store.selectReferenceSegment(row.id);
        break;
      case 'OBJECT':
      default:
        this.store.selectObject(row.id);
        break;
    }
  }

  selectRowFromTable(data: DataGridRow | DataGridRow[] | undefined): void {
    this.selectRow(Array.isArray(data) ? data[0] : data);
  }

  exportCsv(): void {
    this.store.exportCsv();
  }

  exportGeoJson(): void {
    this.store.exportGeoJson();
  }

  columnValue(row: DataGridRow, field: string): string | number {
    const value = row[field as keyof DataGridRow];
    return typeof value === 'string' || typeof value === 'number' ? value : '';
  }

  isStatusColumn(field: string): boolean {
    return field === 'status' || field === 'validationStatus' || field === 'draftStatus';
  }

  isTabActive(tab: TableTab): boolean {
    return this.activeTableTab() === tab;
  }

  hasColumnFilter(field: string): boolean {
    return Boolean(this.columnFilters()[field]);
  }

  private filterValueFromMeta(meta: PrimeTableFilterMeta): string {
    if (Array.isArray(meta)) {
      return this.normalizeFilterValue(meta.find((constraint) => this.normalizeFilterValue(constraint.value))?.value);
    }

    if (meta && typeof meta === 'object') {
      const singleMeta = meta as {value?: unknown; constraints?: Array<{value?: unknown}>};
      const directValue = this.normalizeFilterValue(singleMeta.value);
      if (directValue) {
        return directValue;
      }

      return this.normalizeFilterValue(singleMeta.constraints?.find((constraint) => this.normalizeFilterValue(constraint.value))?.value);
    }

    return this.normalizeFilterValue(meta);
  }

  private normalizeFilterValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private modeFromTab(tab: TableTab): DataGridMode {
    if (tab === 'Odcinki drogi') {
      return 'ROAD_SECTIONS';
    }

    if (tab === 'System referencyjny') {
      return 'REFERENCE_SEGMENTS';
    }

    return 'OBJECTS';
  }

  private columnsForMode(mode: DataGridMode): GridColumnDefinition[] {
    const common: GridColumnDefinition[] = [
      {field: 'primaryCode', header: 'Identyfikator', width: '210px', frozen: true},
      {field: 'status', header: 'Status', width: '150px', frozen: true},
      {field: 'validationStatus', header: 'Walidacja', width: '160px'},
      {field: 'draftStatus', header: 'Wersja robocza', width: '210px'},
      {field: 'issueCount', header: 'Problemy', width: '110px', filterType: 'numeric'}
    ];

    if (mode === 'REFERENCE_SEGMENTS') {
      return [
        common[0],
        common[1],
        {field: 'roadNumber', header: 'Droga', width: '120px'},
        {field: 'mileageLabel', header: 'Kilometraż', width: '180px'},
        {field: 'secondaryLabel', header: 'Jezdnia / kierunek', width: '260px'},
        common[4]
      ];
    }

    return [
      common[0],
      common[1],
      {field: 'secondaryLabel', header: mode === 'ROAD_SECTIONS' ? 'Nazwa odcinka' : 'Typ i nazwa', width: '320px'},
      {field: 'roadNumber', header: 'Droga', width: '120px'},
      {field: 'referenceLabel', header: 'System referencyjny', width: '210px'},
      {field: 'mileageLabel', header: 'Kilometraż', width: '180px'},
      common[2],
      common[3],
      common[4]
    ];
  }
}
