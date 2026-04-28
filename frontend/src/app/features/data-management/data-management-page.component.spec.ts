import {computed, signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {
  LayerFacade,
  ObjectEditorFacade,
  RoadGisWorkflowFacade
} from '../../domains/road-gis/data-access/road-gis-facades';
import {RoadInfraGisStore} from '../../state/road-infra-gis.store';
import {DataManagementPageComponent} from './data-management-page.component';

describe('DataManagementPageComponent', () => {
  let fixture: ComponentFixture<DataManagementPageComponent>;
  let component: DataManagementPageComponent;

  beforeEach(async () => {
    const rightPanelTab = signal('Warstwy');
    const statusMessage = signal('');
    const fakeStore = {
      activeObject: signal(null),
      activeRoadSection: signal(null),
      roads: signal([]),
      selectedReferenceSegmentId: signal(null),
      referenceSegments: signal([]),
      layerGroups: computed(() => []),
      focusedValidationField: signal(null),
      selectedValidationIssueId: signal(null),
      validationIssues: signal([]),
      layerVisibility: signal<Record<string, boolean>>({}),
      rightPanelTab,
      statusMessage,
      setRightPanelTab: jasmine.createSpy('setRightPanelTab').and.callFake((tab: string) => rightPanelTab.set(tab)),
      selectValidationIssue: jasmine.createSpy('selectValidationIssue'),
      initialize: jasmine.createSpy('initialize')
    };

    await TestBed.configureTestingModule({
      imports: [DataManagementPageComponent],
      providers: [
        {provide: RoadInfraGisStore, useValue: fakeStore}
      ]
    })
      .overrideComponent(DataManagementPageComponent, {
        set: {
          template: '<section>{{ objectTypeLabel("ROAD_BARRIER") }}</section>'
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(DataManagementPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders Polish business labels for infrastructure object types', () => {
    expect(fixture.nativeElement.textContent).toContain('Bariera energoch');
  });

  it('initializes GIS store on component start', () => {
    const store = TestBed.inject(RoadInfraGisStore) as unknown as {initialize: jasmine.Spy};
    expect(store.initialize).toHaveBeenCalled();
  });

  it('opens the workflow process panel when a module action is activated', () => {
    const store = TestBed.inject(RoadInfraGisStore) as unknown as {
      setRightPanelTab: jasmine.Spy;
      statusMessage: ReturnType<typeof signal<string>>;
    };
    const workflowFacade = TestBed.inject(RoadGisWorkflowFacade);

    component.activateWorkflow('parcel-import');

    expect(workflowFacade.activeWorkflow()?.kind).toBe('parcel-import');
    expect(store.setRightPanelTab).toHaveBeenCalledWith('Proces');
    expect(store.statusMessage()).toContain('Import działek');
  });

  it('selects a concrete workflow step for the active business process', () => {
    const workflowFacade = TestBed.inject(RoadGisWorkflowFacade);

    component.activateWorkflow('parcel-import');
    component.selectWorkflowStep(3);

    expect(workflowFacade.activeStep()?.id).toBe('diff');
  });

  it('toggles production layer visibility through the layer facade', () => {
    const layerFacade = TestBed.inject(LayerFacade);
    const initialLayer = layerFacade.layers().find((layer) => layer.id === 'parcels');
    expect(initialLayer?.visible).toBeTrue();

    component.toggleProductionLayer('parcels');

    expect(layerFacade.layers().find((layer) => layer.id === 'parcels')?.visible).toBeFalse();
  });

  it('collapses and expands layer groups without losing other groups state', () => {
    expect(component.isLayerGroupExpanded('Obiekty ZID')).toBeTrue();

    component.toggleLayerGroup('Obiekty ZID');

    expect(component.isLayerGroupExpanded('Obiekty ZID')).toBeFalse();
    expect(component.isLayerGroupExpanded('System Referencyjny')).toBeTrue();
  });

  it('changes object editor tab through the editor facade', () => {
    const editorFacade = TestBed.inject(ObjectEditorFacade);

    component.setEditorTab('Walidacja');

    expect(editorFacade.activeTab()).toBe('Walidacja');
  });

  it('delegates validation issue activation to the shared workspace store', () => {
    const issue = {
      id: 'issue-1',
      targetType: 'INFRASTRUCTURE_OBJECT',
      targetId: 'object-1',
      targetCode: 'BAR-DK7-001',
      objectId: 'object-1',
      objectCode: 'BAR-DK7-001',
      severity: 'BLOCKING',
      issueType: 'MISSING_REFERENCE_SEGMENT',
      fieldName: 'referenceSegmentId',
      message: 'Brak dowiazania do SR.',
      geometryMarker: null,
      createdAt: '2026-01-01T00:00:00Z',
      resolved: false
    };
    const store = TestBed.inject(RoadInfraGisStore) as unknown as {selectValidationIssue: jasmine.Spy};

    component.selectValidationIssue(issue);

    expect(store.selectValidationIssue).toHaveBeenCalledWith(issue);
  });
});
