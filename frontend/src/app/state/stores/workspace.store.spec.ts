import { TestBed } from '@angular/core/testing';
import { WorkspaceStore } from './workspace.store';
import { RoadGisApiService } from '../../core/api/road-gis-api.service';

describe('WorkspaceStore', () => {
  it('should refresh road-section and reference-segment features separately', async () => {
    const api = {
      getWorkspaceConfiguration: vi.fn().mockResolvedValue({
        activeEditableLayerId: 'road-section-draft',
        layers: [],
        layout: {
          mode: 'three-panel',
          leftPanelWidth: 320,
          rightPanelWidth: 360,
          bottomPanelHeight: 240
        }
      }),
      queryFeatures: vi.fn().mockImplementation(async (layer: string) => {
        if (layer === 'ROAD_SECTION') {
          return {
            publishedFeatures: [{ businessId: 'r1', label: 'A4-001', overlayStatus: 'NONE', draftOnly: false, geometry: null }],
            draftFeatures: []
          };
        }

        return {
          publishedFeatures: [{ businessId: 'ref1', label: 'REF-001', overlayStatus: 'NONE', draftOnly: false, geometry: null }],
          draftFeatures: []
        };
      })
    };

    TestBed.configureTestingModule({
      providers: [WorkspaceStore, { provide: RoadGisApiService, useValue: api }]
    });

    const store = TestBed.inject(WorkspaceStore);

    await store.refreshFeatures('draft-1');

    expect(api.queryFeatures).toHaveBeenCalledWith('ROAD_SECTION', store.viewport(), 'draft-1');
    expect(api.queryFeatures).toHaveBeenCalledWith('REFERENCE_SEGMENT', store.viewport());
    expect(store.publishedFeatures()).toHaveLength(1);
    expect(store.referenceFeatures()).toHaveLength(1);
  });
});
