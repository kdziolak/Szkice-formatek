import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DataManagementPageComponent } from './data-management-page.component';
import { DraftStore } from '../../state/stores/draft.store';
import { ObjectFormStore } from '../../state/stores/object-form.store';
import { RoadSectionsStore } from '../../state/stores/road-sections.store';
import { SelectionStore } from '../../state/stores/selection.store';
import { WorkspaceStore } from '../../state/stores/workspace.store';
import { RoadGisApiError } from '../../core/api/road-gis-api.service';

describe('DataManagementPageComponent', () => {
  function createStores() {
    const activeDraft = signal<any>(null);
    const hasDraft = signal(false);

    return {
      draftStore: {
        activeDraft,
        creating: signal(false),
        error: signal<string | null>(null),
        hasDraft,
        hydrateFromStorage: vi.fn(),
        createDraft: vi.fn(),
        clearDraft: vi.fn((message?: string) => {
          activeDraft.set(null);
          hasDraft.set(false);
        })
      },
      objectFormStore: {
        detail: signal(null),
        loading: signal(false),
        saving: signal(false),
        error: signal<string | null>(null),
        isDirty: signal(false),
        load: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn(),
        resetToWorking: vi.fn(),
        saveDraft: vi.fn().mockResolvedValue(undefined),
        setFormValue: vi.fn()
      },
      roadSectionsStore: {
        rows: signal([{ businessId: '55555555-5555-5555-5555-555555555555', sectionCode: 'A4-001', overlayStatus: 'NONE' }]),
        page: signal({ page: 0, size: 50, totalElements: 1, totalPages: 1 }),
        loading: signal(false),
        error: signal<string | null>(null),
        load: vi.fn().mockResolvedValue(undefined)
      },
      selectionStore: {
        selectedBusinessId: signal<string | null>(null),
        select: vi.fn(),
        clear: vi.fn()
      },
      workspaceStore: {
        config: signal({
          activeEditableLayerId: 'road-section-draft',
          layers: [],
          layout: { mode: 'three-panel', leftPanelWidth: 320, rightPanelWidth: 360, bottomPanelHeight: 240 }
        }),
        layers: signal([]),
        publishedFeatures: signal([]),
        draftFeatures: signal([]),
        referenceFeatures: signal([]),
        loadingConfig: signal(false),
        loadingFeatures: signal(false),
        error: signal<string | null>(null),
        loadWorkspace: vi.fn().mockResolvedValue(undefined),
        refreshFeatures: vi.fn().mockResolvedValue(undefined),
        setViewport: vi.fn(),
        toggleLayer: vi.fn()
      }
    };
  }

  it('should hydrate draft before first refresh', async () => {
    const stores = createStores();
    stores.draftStore.activeDraft.set({
      draftId: '11111111-1111-1111-1111-111111111111',
      draftName: 'Persisted draft',
      draftScope: 'ROAD_SECTION',
      draftStatus: 'OPEN',
      createdAt: '2026-03-31T07:00:00Z'
    });
    stores.draftStore.hasDraft.set(true);

    TestBed.configureTestingModule({
      providers: [
        { provide: DraftStore, useValue: stores.draftStore },
        { provide: ObjectFormStore, useValue: stores.objectFormStore },
        { provide: RoadSectionsStore, useValue: stores.roadSectionsStore },
        { provide: SelectionStore, useValue: stores.selectionStore },
        { provide: WorkspaceStore, useValue: stores.workspaceStore }
      ]
    });

    const component = TestBed.runInInjectionContext(() => new DataManagementPageComponent());
    await component.ngOnInit();

    expect(stores.draftStore.hydrateFromStorage).toHaveBeenCalled();
    expect(stores.roadSectionsStore.load).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
  });

  it('should clear stale draft and retry in published mode', async () => {
    const stores = createStores();
    stores.draftStore.activeDraft.set({
      draftId: 'deadbeef-dead-beef-dead-beefdeadbeef',
      draftName: 'Stale draft',
      draftScope: 'ROAD_SECTION',
      draftStatus: 'OPEN',
      createdAt: '2026-03-31T07:00:00Z'
    });
    stores.draftStore.hasDraft.set(true);
    stores.roadSectionsStore.load
      .mockRejectedValueOnce(new RoadGisApiError(404, 'DRAFT_NOT_FOUND', 'Draft wygasl.'))
      .mockResolvedValueOnce(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: DraftStore, useValue: stores.draftStore },
        { provide: ObjectFormStore, useValue: stores.objectFormStore },
        { provide: RoadSectionsStore, useValue: stores.roadSectionsStore },
        { provide: SelectionStore, useValue: stores.selectionStore },
        { provide: WorkspaceStore, useValue: stores.workspaceStore }
      ]
    });

    const component = TestBed.runInInjectionContext(() => new DataManagementPageComponent());
    await component.refreshAll();

    expect(stores.draftStore.clearDraft).toHaveBeenCalled();
    expect(stores.roadSectionsStore.load).toHaveBeenLastCalledWith(null);
  });
});
