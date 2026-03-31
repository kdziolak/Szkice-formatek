import { Injectable, inject, signal } from '@angular/core';
import { RoadGisApiService } from '../../core/api/road-gis-api.service';
import {
  LayerViewModel,
  MapFeatureViewModel,
  ViewportState,
  WorkspaceConfigResponse
} from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly api = inject(RoadGisApiService);

  readonly config = signal<WorkspaceConfigResponse | null>(null);
  readonly layers = signal<LayerViewModel[]>([]);
  readonly publishedFeatures = signal<MapFeatureViewModel[]>([]);
  readonly draftFeatures = signal<MapFeatureViewModel[]>([]);
  readonly referenceFeatures = signal<MapFeatureViewModel[]>([]);
  readonly viewport = signal<ViewportState>({
    bbox: '-1000000,-1000000,2000000,2000000',
    scaleDenominator: 25000
  });
  readonly loadingConfig = signal(false);
  readonly loadingFeatures = signal(false);
  readonly error = signal<string | null>(null);

  async loadWorkspace(): Promise<void> {
    this.loadingConfig.set(true);
    this.error.set(null);

    try {
      const response = await this.api.getWorkspaceConfiguration();
      this.config.set(response);
      this.layers.set(response.layers.map((layer) => ({ ...layer })));
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Nie udalo sie pobrac konfiguracji workspace.'
      );
      throw error;
    } finally {
      this.loadingConfig.set(false);
    }
  }

  async refreshFeatures(draftId?: string | null): Promise<void> {
    this.loadingFeatures.set(true);
    this.error.set(null);

    try {
      const [roadSectionResponse, referenceResponse] = await Promise.all([
        this.api.queryFeatures('ROAD_SECTION', this.viewport(), draftId),
        this.api.queryFeatures('REFERENCE_SEGMENT', this.viewport())
      ]);
      this.publishedFeatures.set(roadSectionResponse.publishedFeatures);
      this.draftFeatures.set(roadSectionResponse.draftFeatures);
      this.referenceFeatures.set(referenceResponse.publishedFeatures);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Nie udalo sie pobrac danych mapowych.'
      );
      throw error;
    } finally {
      this.loadingFeatures.set(false);
    }
  }

  setViewport(viewport: ViewportState): void {
    this.viewport.set(viewport);
  }

  toggleLayer(layerId: string): void {
    this.layers.update((layers) =>
        layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        )
      );
  }
}
