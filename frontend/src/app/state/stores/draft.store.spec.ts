import { TestBed } from '@angular/core/testing';
import { DraftStore } from './draft.store';
import { RoadGisApiService } from '../../core/api/road-gis-api.service';

describe('DraftStore', () => {
  it('should persist created draft in localStorage', async () => {
    const api = {
      createDraft: vi.fn().mockResolvedValue({
        draftId: '11111111-1111-1111-1111-111111111111',
        draftName: 'Workspace draft',
        draftScope: 'ROAD_SECTION',
        draftStatus: 'OPEN',
        createdAt: '2026-03-31T07:00:00Z'
      })
    };

    TestBed.configureTestingModule({
      providers: [DraftStore, { provide: RoadGisApiService, useValue: api }]
    });

    const store = TestBed.inject(DraftStore);

    await store.createDraft();

    expect(store.activeDraft()?.draftId).toBe('11111111-1111-1111-1111-111111111111');
    expect(localStorage.getItem('road-gis.data-management.active-draft')).toContain(
      '11111111-1111-1111-1111-111111111111'
    );
  });

  it('should hydrate active draft from localStorage', () => {
    localStorage.setItem(
      'road-gis.data-management.active-draft',
      JSON.stringify({
        draftId: '22222222-2222-2222-2222-222222222222',
        draftName: 'Hydrated draft',
        draftScope: 'ROAD_SECTION',
        draftStatus: 'OPEN',
        createdAt: '2026-03-31T07:15:00Z'
      })
    );

    TestBed.configureTestingModule({
      providers: [
        DraftStore,
        {
          provide: RoadGisApiService,
          useValue: {
            createDraft: vi.fn()
          }
        }
      ]
    });

    const store = TestBed.inject(DraftStore);

    store.hydrateFromStorage();

    expect(store.activeDraft()?.draftName).toBe('Hydrated draft');
  });

  it('should clear state and storage for stale draft', () => {
    localStorage.setItem(
      'road-gis.data-management.active-draft',
      JSON.stringify({
        draftId: '33333333-3333-3333-3333-333333333333',
        draftName: 'Stale draft',
        draftScope: 'ROAD_SECTION',
        draftStatus: 'OPEN',
        createdAt: '2026-03-31T07:30:00Z'
      })
    );

    TestBed.configureTestingModule({
      providers: [
        DraftStore,
        {
          provide: RoadGisApiService,
          useValue: {
            createDraft: vi.fn()
          }
        }
      ]
    });

    const store = TestBed.inject(DraftStore);

    store.hydrateFromStorage();
    store.clearDraft('Draft wygasl.');

    expect(store.activeDraft()).toBeNull();
    expect(localStorage.getItem('road-gis.data-management.active-draft')).toBeNull();
    expect(store.error()).toBe('Draft wygasl.');
  });
});
