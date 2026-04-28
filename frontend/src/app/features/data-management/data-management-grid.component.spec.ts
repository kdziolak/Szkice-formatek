import {signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';

import {DataGridMode, DataGridRow, InfrastructureObjectDto, TableTab} from '../../core/road-infra-gis.models';
import {RoadInfraGisStore} from '../../state/road-infra-gis.store';
import {DataManagementGridComponent} from './data-management-grid.component';

describe('DataManagementGridComponent', () => {
  let fixture: ComponentFixture<DataManagementGridComponent>;
  let store: FakeGridStore;

  beforeEach(async () => {
    store = new FakeGridStore();

    await TestBed.configureTestingModule({
      imports: [DataManagementGridComponent],
      providers: [
        provideNoopAnimations(),
        {provide: RoadInfraGisStore, useValue: store}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DataManagementGridComponent);
  });

  it('renders infrastructure object columns', () => {
    store.mode.set('OBJECTS');
    store.rows.set([gridRow({kind: 'OBJECT', id: 'object-1', primaryCode: 'BAR-DK7-001'})]);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Identyfikator');
    expect(fixture.nativeElement.textContent).toContain('Typ i nazwa');
    expect(fixture.nativeElement.textContent).toContain('BAR-DK7-001');
  });

  it('keeps the existing domain object tabs available', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Obiekty w edycji');
    expect(text).toContain('Błędy walidacji');
    expect(text).toContain('Działki');
    expect(text).toContain('Stacje pomiaru ruchu');
    expect(text).toContain('Bariery');
  });

  it('renders road section columns', () => {
    store.mode.set('ROAD_SECTIONS');
    store.activeTab.set('Odcinki drogi');
    store.rows.set([gridRow({kind: 'ROAD_SECTION', id: 'section-1', primaryCode: 'DK7-WAW-001-ODC'})]);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nazwa odcinka');
  });

  it('renders reference segment columns', () => {
    store.mode.set('REFERENCE_SEGMENTS');
    store.activeTab.set('System referencyjny');
    store.rows.set([gridRow({kind: 'REFERENCE_SEGMENT', id: 'segment-1', primaryCode: 'DK7-WAW-001'})]);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Jezdnia / kierunek');
  });

  it('selects rows through the existing store selection methods', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.selectRow(gridRow({kind: 'OBJECT', id: 'object-1'}));
    component.selectRow(gridRow({kind: 'ROAD_SECTION', id: 'section-1'}));
    component.selectRow(gridRow({kind: 'REFERENCE_SEGMENT', id: 'segment-1'}));

    expect(store.selectedObjectId).toBe('object-1');
    expect(store.selectedRoadSectionId).toBe('section-1');
    expect(store.selectedReferenceSegmentId).toBe('segment-1');
  });

  it('shows a professional empty state for an empty result', () => {
    store.rows.set([]);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Brak obiektów infrastruktury');
  });
});

class FakeGridStore {
  readonly activeTab = signal<TableTab>('Wszystkie obiekty');
  readonly mode = signal<DataGridMode>('OBJECTS');
  readonly rows = signal<DataGridRow[]>([]);
  readonly selected = signal<DataGridRow | null>(null);
  selectedObjectId: string | null = null;
  selectedRoadSectionId: string | null = null;
  selectedReferenceSegmentId: string | null = null;

  activeTableTab(): TableTab {
    return this.activeTab();
  }

  activeGridMode(): DataGridMode {
    return this.mode();
  }

  gridRows(): DataGridRow[] {
    return this.rows();
  }

  selectedGridRow(): DataGridRow | null {
    return this.selected();
  }

  setGridGlobalFilter(): void {
    return;
  }

  setGridColumnFilter(): void {
    return;
  }

  clearGridFilters(): void {
    return;
  }

  setTableTab(tab: TableTab): void {
    this.activeTab.set(tab);
  }

  selectObject(objectId: string): void {
    this.selectedObjectId = objectId;
  }

  selectRoadSection(roadSectionId: string): void {
    this.selectedRoadSectionId = roadSectionId;
  }

  selectReferenceSegment(segmentId: string): void {
    this.selectedReferenceSegmentId = segmentId;
  }

  exportCsv(): void {
    return;
  }

  exportGeoJson(): void {
    return;
  }
}

function gridRow(overrides: Partial<DataGridRow> = {}): DataGridRow {
  return {
    id: 'object-1',
    kind: 'OBJECT',
    primaryCode: 'BAR-DK7-001',
    secondaryLabel: 'ROAD_BARRIER - Bariera DK7',
    roadNumber: 'DK7',
    referenceLabel: 'DK7-WAW-001',
    mileageLabel: '12.000 - 12.500 km',
    status: 'AKTYWNY',
    validationStatus: 'OK',
    draftStatus: 'NIE_DOTYCZY',
    issueCount: 0,
    geometry: null,
    source: {} as InfrastructureObjectDto,
    ...overrides
  };
}
