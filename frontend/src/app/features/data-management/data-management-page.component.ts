import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { MapCanvasComponent } from '../../map/components/map-canvas.component';
import { RibbonBarComponent } from '../../shell/components/ribbon-bar.component';
import { StatusBarComponent } from '../../shell/components/status-bar.component';
import { DraftStore } from '../../state/stores/draft.store';
import { ObjectFormStore } from '../../state/stores/object-form.store';
import { RoadSectionsStore } from '../../state/stores/road-sections.store';
import { SelectionStore } from '../../state/stores/selection.store';
import { WorkspaceStore } from '../../state/stores/workspace.store';
import { RoadSectionFormValue, ViewportState } from '../../shared/models/api.models';
import { LayerTreePanelComponent } from './components/layer-tree-panel.component';
import { RoadSectionFormPanelComponent } from './components/road-section-form-panel.component';
import { RoadSectionGridComponent } from './components/road-section-grid.component';
import { RoadGisApiError } from '../../core/api/road-gis-api.service';

@Component({
  selector: 'rgp-data-management-page',
  standalone: true,
  imports: [
    CommonModule,
    RibbonBarComponent,
    LayerTreePanelComponent,
    MapCanvasComponent,
    RoadSectionFormPanelComponent,
    RoadSectionGridComponent,
    StatusBarComponent
  ],
  template: `
    <section
      class="page-shell"
      [style.--left-panel-width.px]="layout().leftPanelWidth"
      [style.--right-panel-width.px]="layout().rightPanelWidth"
      [style.--bottom-panel-height.px]="layout().bottomPanelHeight"
    >
      <rgp-ribbon-bar
        [draftName]="draftStore.activeDraft()?.draftName || null"
        [hasDraft]="draftStore.hasDraft()"
        [canSave]="canSave()"
        [loading]="isBusy()"
        (refreshClicked)="refreshAll()"
        (createDraftClicked)="createDraft()"
        (saveClicked)="saveDraft()"
      />

      <div class="alert-strip" *ngIf="errorMessage() as errorMessage">
        {{ errorMessage }}
      </div>

      <main class="workspace-main">
        <rgp-layer-tree-panel
          [layers]="workspaceStore.layers()"
          [activeEditableLayerId]="workspaceStore.config()?.activeEditableLayerId || null"
          (toggleLayer)="toggleLayer($event)"
        />

        <rgp-map-canvas
          [publishedFeatures]="publishedFeatures()"
          [draftFeatures]="draftFeatures()"
          [referenceFeatures]="referenceFeatures()"
          [selectedBusinessId]="selectionStore.selectedBusinessId()"
          [publishedVisible]="isLayerVisible('road-section-published')"
          [draftVisible]="isLayerVisible('road-section-draft')"
          [referenceVisible]="isLayerVisible('reference-segment')"
          (featureSelected)="selectRoadSection($event)"
          (viewportChanged)="onViewportChanged($event)"
        />

        <rgp-road-section-form-panel
          [comparison]="objectFormStore.detail()"
          [editable]="draftStore.hasDraft()"
          [loading]="objectFormStore.loading()"
          [saving]="objectFormStore.saving()"
          (saveRequested)="onFormSaveRequested($event)"
          (resetRequested)="objectFormStore.resetToWorking()"
        />
      </main>

      <rgp-road-section-grid
        [rows]="roadSectionsStore.rows()"
        [loading]="roadSectionsStore.loading()"
        [selectedBusinessId]="selectionStore.selectedBusinessId()"
        (rowSelected)="selectRoadSection($event)"
      />

      <rgp-status-bar
        [activeDraftName]="draftStore.activeDraft()?.draftName || null"
        [selectedLabel]="selectedLabel()"
        [totalRows]="roadSectionsStore.page().totalElements"
        [overlayCount]="overlayCount()"
        [formDirty]="objectFormStore.isDirty()"
      />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        padding: 1.1rem;
      }

      .page-shell {
        display: grid;
        grid-template-rows: auto auto minmax(360px, 1fr) minmax(220px, var(--bottom-panel-height)) auto;
        gap: 0.95rem;
      }

      .alert-strip {
        padding: 0.85rem 1rem;
        border-radius: 14px;
        border: 1px solid rgba(184, 92, 56, 0.24);
        background: rgba(184, 92, 56, 0.12);
        color: var(--rgp-danger);
        font-weight: 700;
      }

      .workspace-main {
        display: grid;
        grid-template-columns:
          minmax(260px, var(--left-panel-width))
          minmax(0, 1fr)
          minmax(300px, var(--right-panel-width));
        gap: 0.95rem;
        min-height: 0;
      }

      @media (max-width: 1280px) {
        .workspace-main {
          grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
          grid-template-areas:
            'layers map'
            'form form';
        }

        .workspace-main > :nth-child(1) {
          grid-area: layers;
        }

        .workspace-main > :nth-child(2) {
          grid-area: map;
        }

        .workspace-main > :nth-child(3) {
          grid-area: form;
          min-height: 340px;
        }
      }

      @media (max-width: 980px) {
        .page-shell {
          grid-template-rows: auto auto repeat(3, minmax(260px, auto)) auto auto;
        }

        .workspace-main {
          grid-template-columns: minmax(0, 1fr);
          grid-template-areas:
            'layers'
            'map'
            'form';
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataManagementPageComponent implements OnInit {
  protected readonly draftStore = inject(DraftStore);
  protected readonly objectFormStore = inject(ObjectFormStore);
  protected readonly roadSectionsStore = inject(RoadSectionsStore);
  protected readonly selectionStore = inject(SelectionStore);
  protected readonly workspaceStore = inject(WorkspaceStore);

  protected readonly layout = computed(() => {
    return (
      this.workspaceStore.config()?.layout ?? {
        mode: 'three-panel',
        leftPanelWidth: 320,
        rightPanelWidth: 360,
        bottomPanelHeight: 240
      }
    );
  });

  protected readonly canSave = computed(() => {
    return this.draftStore.hasDraft() && this.objectFormStore.isDirty() && !this.objectFormStore.saving();
  });

  protected readonly overlayCount = computed(() => {
    return this.roadSectionsStore.rows().filter((row) => row.overlayStatus !== 'NONE').length;
  });

  protected readonly selectedLabel = computed(() => {
    const selectedBusinessId = this.selectionStore.selectedBusinessId();
    if (!selectedBusinessId) {
      return null;
    }

    const selectedRow = this.roadSectionsStore.rows().find((row) => row.businessId === selectedBusinessId);
    return selectedRow?.sectionCode ?? selectedBusinessId;
  });

  protected readonly publishedFeatures = computed(() => {
    return this.isLayerVisible('road-section-published')
      ? this.workspaceStore.publishedFeatures()
      : [];
  });

  protected readonly draftFeatures = computed(() => {
    return this.isLayerVisible('road-section-draft')
      ? this.workspaceStore.draftFeatures()
      : [];
  });

  protected readonly referenceFeatures = computed(() => {
    return this.isLayerVisible('reference-segment')
      ? this.workspaceStore.referenceFeatures()
      : [];
  });

  protected readonly isBusy = computed(() => {
    return (
      this.draftStore.creating() ||
      this.workspaceStore.loadingConfig() ||
      this.workspaceStore.loadingFeatures() ||
      this.roadSectionsStore.loading() ||
      this.objectFormStore.loading() ||
      this.objectFormStore.saving()
    );
  });

  protected readonly errorMessage = computed(() => {
    return (
      this.draftStore.error() ||
      this.workspaceStore.error() ||
      this.roadSectionsStore.error() ||
      this.objectFormStore.error()
    );
  });

  async ngOnInit(): Promise<void> {
    await this.workspaceStore.loadWorkspace().catch(() => undefined);
    this.draftStore.hydrateFromStorage();
    await this.refreshAll();
  }

  protected async refreshAll(): Promise<void> {
    const draftId = this.draftStore.activeDraft()?.draftId ?? null;

    try {
      await this.roadSectionsStore.load(draftId);
      await this.workspaceStore.refreshFeatures(draftId);
    } catch (error) {
      if (this.isStaleDraftError(error, draftId)) {
        this.draftStore.clearDraft(
          'Aktywny draft nie istnieje lub wygasl. Workspace zostal przelaczony na stan publikowany.'
        );
        await this.refreshAll();
      }
      return;
    }

    const currentSelection =
      this.selectionStore.selectedBusinessId() ?? this.roadSectionsStore.rows().at(0)?.businessId ?? null;

    if (!currentSelection) {
      this.selectionStore.clear();
      this.objectFormStore.clear();
      return;
    }

    this.selectionStore.select(currentSelection);
    try {
      await this.objectFormStore.load(currentSelection, draftId);
    } catch (error) {
      if (this.isStaleDraftError(error, draftId)) {
        this.draftStore.clearDraft(
          'Aktywny draft nie istnieje lub wygasl. Workspace zostal przelaczony na stan publikowany.'
        );
        await this.refreshAll();
      }
    }
  }

  protected async createDraft(): Promise<void> {
    await this.draftStore.createDraft().catch(() => undefined);
    await this.refreshAll();
  }

  protected async saveDraft(): Promise<void> {
    const draftId = this.draftStore.activeDraft()?.draftId;
    if (!draftId) {
      return;
    }

    await this.objectFormStore.saveDraft(draftId).catch(() => undefined);
    await this.refreshAll();
  }

  protected async onFormSaveRequested(formValue: RoadSectionFormValue): Promise<void> {
    this.objectFormStore.setFormValue(formValue);
    await this.saveDraft();
  }

  protected async selectRoadSection(businessId: string): Promise<void> {
    this.selectionStore.select(businessId);
    try {
      await this.objectFormStore.load(businessId, this.draftStore.activeDraft()?.draftId ?? null);
    } catch (error) {
      if (this.isStaleDraftError(error, this.draftStore.activeDraft()?.draftId ?? null)) {
        this.draftStore.clearDraft(
          'Aktywny draft nie istnieje lub wygasl. Workspace zostal przelaczony na stan publikowany.'
        );
        await this.refreshAll();
      }
    }
  }

  protected toggleLayer(layerId: string): void {
    this.workspaceStore.toggleLayer(layerId);
  }

  protected async onViewportChanged(viewport: ViewportState): Promise<void> {
    this.workspaceStore.setViewport(viewport);
    await this.workspaceStore
      .refreshFeatures(this.draftStore.activeDraft()?.draftId ?? null)
      .catch(() => undefined);
  }

  protected isLayerVisible(layerId: string): boolean {
    return this.workspaceStore.layers().find((layer) => layer.id === layerId)?.visible ?? false;
  }

  private isStaleDraftError(error: unknown, draftId: string | null): boolean {
    return (
      draftId !== null &&
      error instanceof RoadGisApiError &&
      error.status === 404 &&
      error.code === 'DRAFT_NOT_FOUND'
    );
  }
}
