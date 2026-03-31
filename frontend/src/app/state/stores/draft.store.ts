import { Injectable, computed, inject, signal } from '@angular/core';
import { DraftCreateResponse, DraftSummary } from '../../shared/models/api.models';
import { RoadGisApiService } from '../../core/api/road-gis-api.service';

const ACTIVE_DRAFT_STORAGE_KEY = 'road-gis.data-management.active-draft';

@Injectable({ providedIn: 'root' })
export class DraftStore {
  private readonly api = inject(RoadGisApiService);

  readonly activeDraft = signal<DraftSummary | null>(null);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasDraft = computed(() => this.activeDraft() !== null);

  async createDraft(): Promise<DraftSummary> {
    this.creating.set(true);
    this.error.set(null);

    try {
      const draft = await this.api.createDraft({
        draftName: this.defaultDraftName(),
        draftScope: 'ROAD_SECTION'
      });
      const summary = this.toSummary(draft);
      this.setActiveDraft(summary);
      return summary;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Nie udalo sie utworzyc draftu.');
      throw error;
    } finally {
      this.creating.set(false);
    }
  }

  hydrateFromStorage(): DraftSummary | null {
    this.error.set(null);

    const storage = this.storage();
    const raw = storage?.getItem(ACTIVE_DRAFT_STORAGE_KEY);
    if (!raw) {
      this.activeDraft.set(null);
      return null;
    }

    try {
      const draft = JSON.parse(raw) as DraftSummary;
      this.activeDraft.set(draft);
      return draft;
    } catch {
      storage?.removeItem(ACTIVE_DRAFT_STORAGE_KEY);
      this.activeDraft.set(null);
      return null;
    }
  }

  clearDraft(message?: string): void {
    this.storage()?.removeItem(ACTIVE_DRAFT_STORAGE_KEY);
    this.activeDraft.set(null);
    this.error.set(message ?? null);
  }

  private defaultDraftName(): string {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return `Data management ${timestamp}`;
  }

  private toSummary(response: DraftCreateResponse): DraftSummary {
    return {
      draftId: response.draftId,
      draftName: response.draftName,
      draftScope: response.draftScope,
      draftStatus: response.draftStatus,
      createdAt: response.createdAt
    };
  }

  private setActiveDraft(summary: DraftSummary): void {
    this.activeDraft.set(summary);
    this.storage()?.setItem(ACTIVE_DRAFT_STORAGE_KEY, JSON.stringify(summary));
  }

  private storage(): Storage | null {
    return typeof window === 'undefined' ? null : window.localStorage;
  }
}
