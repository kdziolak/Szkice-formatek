import { TestBed } from '@angular/core/testing';
import { ObjectFormStore } from './object-form.store';
import { RoadGisApiService } from '../../core/api/road-gis-api.service';
import { RoadSectionComparisonDetail } from '../../shared/models/api.models';

describe('ObjectFormStore', () => {
  it('should save draft command with explicit reference binding payload', async () => {
    const detail: RoadSectionComparisonDetail = {
      businessId: '55555555-5555-5555-5555-555555555555',
      overlayStatus: 'NONE',
      draftCommandId: null,
      published: null,
      working: {
        businessId: '55555555-5555-5555-5555-555555555555',
        roadNumber: 'A4',
        roadClassCode: 'A',
        roadName: 'Autostrada A4',
        sectionCode: 'A4-ODC-001',
        referenceSegmentBusinessId: '22222222-2222-2222-2222-222222222222',
        chainageFrom: 12.345,
        chainageTo: 18.9,
        lifecycleStatus: 'PUBLISHED',
        geometry: null
      }
    };
    const api = {
      getRoadSection: vi.fn().mockResolvedValue(detail),
      saveDraftCommand: vi.fn().mockResolvedValue({
        draftCommandId: '99999999-9999-9999-9999-999999999999'
      })
    };

    TestBed.configureTestingModule({
      providers: [ObjectFormStore, { provide: RoadGisApiService, useValue: api }]
    });

    const store = TestBed.inject(ObjectFormStore);

    await store.load(detail.businessId, '11111111-1111-1111-1111-111111111111');
    store.setFormValue({
      roadNumber: 'A4',
      roadClassCode: 'A',
      roadName: 'Autostrada A4',
      sectionCode: 'A4-ODC-001',
      referenceSegmentBusinessId: '22222222-2222-2222-2222-222222222222',
      chainageFrom: 12.345,
      chainageTo: 18.9,
      lifecycleStatus: 'VALID'
    });

    await store.saveDraft('11111111-1111-1111-1111-111111111111');

    expect(api.saveDraftCommand).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      expect.objectContaining({
        payload: expect.objectContaining({
          referenceBinding: {
            referenceSegmentBusinessId: '22222222-2222-2222-2222-222222222222',
            chainageFrom: 12.345,
            chainageTo: 18.9,
            bindingMethod: 'REFERENCE_SEGMENT',
            bindingQuality: null,
            geometryConsistency: 'NOT_CHECKED'
          }
        })
      })
    );
  });
});
