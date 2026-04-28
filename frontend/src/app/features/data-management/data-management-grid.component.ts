import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {TableModule} from 'primeng/table';

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

  onGlobalFilterChange(value: string): void {
    this.globalFilter.set(value);
    this.store.setGridGlobalFilter?.(value);
  }

  onColumnFilterChange(field: string, value: string): void {
    this.columnFilters.update((filters) => ({...filters, [field]: value}));
    this.store.setGridColumnFilter?.(field, value);
  }

  clearFilters(): void {
    this.globalFilter.set('');
    this.columnFilters.set({});
    this.store.clearGridFilters?.();
  }

  setTableTab(tab: TableTab): void {
    this.store.setTableTab(tab);
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
