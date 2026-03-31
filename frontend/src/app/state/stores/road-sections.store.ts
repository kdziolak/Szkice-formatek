import { Injectable, inject, signal } from '@angular/core';
import { RoadGisApiService } from '../../core/api/road-gis-api.service';
import {
  PageMetadata,
  RoadSectionRowViewModel,
  RoadSectionSummary
} from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class RoadSectionsStore {
  private readonly api = inject(RoadGisApiService);

  readonly rows = signal<RoadSectionRowViewModel[]>([]);
  readonly page = signal<PageMetadata>({
    page: 0,
    size: 50,
    totalElements: 0,
    totalPages: 0
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(draftId?: string | null): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.api.listRoadSections({ draftId, page: 0, size: 50 });
      this.rows.set(response.content.map((row) => this.toViewModel(row)));
      this.page.set(response.page);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Nie udalo sie pobrac listy odcinkow drogowych.'
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  private toViewModel(row: RoadSectionSummary): RoadSectionRowViewModel {
    return {
      ...row,
      chainageLabel: this.formatChainage(row.chainageFrom, row.chainageTo),
      statusLabel: row.lifecycleStatus ?? 'BRAK'
    };
  }

  private formatChainage(from: number | null, to: number | null): string {
    const formatter = new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    });

    if (from === null && to === null) {
      return 'Brak';
    }

    return `${from === null ? '-' : formatter.format(from)} - ${to === null ? '-' : formatter.format(to)}`;
  }
}
