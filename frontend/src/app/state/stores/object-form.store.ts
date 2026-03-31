import { Injectable, computed, inject, signal } from '@angular/core';
import { RoadGisApiService } from '../../core/api/road-gis-api.service';
import {
  DraftCommandRequest,
  RoadSectionComparisonDetail,
  RoadSectionComparisonViewModel,
  RoadSectionFormValue,
  RoadSectionState
} from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class ObjectFormStore {
  private readonly api = inject(RoadGisApiService);

  readonly detail = signal<RoadSectionComparisonViewModel | null>(null);
  readonly formValue = signal<RoadSectionFormValue | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isDirty = computed(() => {
    const detail = this.detail();
    const formValue = this.formValue();

    if (!detail || !formValue) {
      return false;
    }

    return JSON.stringify(formValue) !== JSON.stringify(this.toFormValue(detail.working));
  });

  async load(businessId: string, draftId?: string | null): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.api.getRoadSection(businessId, draftId);
      this.setDetail(response);
    } catch (error) {
      this.detail.set(null);
      this.formValue.set(null);
      this.error.set(
        error instanceof Error ? error.message : 'Nie udalo sie pobrac szczegolow odcinka.'
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  setFormValue(value: RoadSectionFormValue): void {
    this.formValue.set(value);
  }

  resetToWorking(): void {
    this.formValue.set(this.toFormValue(this.detail()?.working ?? null));
  }

  clear(): void {
    this.detail.set(null);
    this.formValue.set(null);
    this.error.set(null);
  }

  async saveDraft(draftId: string): Promise<void> {
    const detail = this.detail();
    const formValue = this.formValue();
    if (!detail || !formValue) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const command = this.toDraftCommand(detail, formValue);
      await this.api.saveDraftCommand(draftId, command);
      await this.load(detail.businessId, draftId);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Nie udalo sie zapisac zmian w drafcie.'
      );
      throw error;
    } finally {
      this.saving.set(false);
    }
  }

  private setDetail(response: RoadSectionComparisonDetail): void {
    this.detail.set(response);
    this.formValue.set(this.toFormValue(response.working));
  }

  private toFormValue(state: RoadSectionState | null): RoadSectionFormValue | null {
    if (!state) {
      return null;
    }

    return {
      roadNumber: state.roadNumber ?? '',
      roadClassCode: state.roadClassCode ?? '',
      roadName: state.roadName ?? '',
      sectionCode: state.sectionCode ?? '',
      referenceSegmentBusinessId: state.referenceSegmentBusinessId ?? '',
      chainageFrom: state.chainageFrom,
      chainageTo: state.chainageTo,
      lifecycleStatus: state.lifecycleStatus ?? 'PUBLISHED'
    };
  }

  private toDraftCommand(
    detail: RoadSectionComparisonViewModel,
    formValue: RoadSectionFormValue
  ): DraftCommandRequest {
    return {
      entityType: 'ROAD_SECTION',
      actionType: 'UPDATE',
      targetBusinessId: detail.businessId,
      payload: {
        roadNumber: formValue.roadNumber,
        roadClassCode: formValue.roadClassCode,
        roadName: formValue.roadName,
        sectionCode: formValue.sectionCode,
        referenceSegmentBusinessId: formValue.referenceSegmentBusinessId || null,
        chainageFrom: formValue.chainageFrom,
        chainageTo: formValue.chainageTo,
        lifecycleStatus: formValue.lifecycleStatus
      },
      geometry: detail.working?.geometry ?? detail.published?.geometry ?? null
    };
  }
}
