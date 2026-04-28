import {Injectable, computed, signal} from '@angular/core';

import {
  ROAD_GIS_EXPORT_JOBS,
  ROAD_GIS_IMPORT_REPORT,
  ROAD_GIS_IMPORT_SESSION,
  ROAD_GIS_LAYER_DEFINITIONS,
  ROAD_GIS_MAP_COMPOSITION,
  ROAD_GIS_PARCEL_COMPARISON,
  ROAD_GIS_REPORT_DEFINITIONS,
  ROAD_GIS_WORKFLOWS
} from './road-gis-production.mock';
import {WorkflowKind} from '../models/road-gis-domain.models';

@Injectable({providedIn: 'root'})
export class LayerFacade {
  readonly layers = signal(ROAD_GIS_LAYER_DEFINITIONS);
  readonly mapComposition = signal(ROAD_GIS_MAP_COMPOSITION);

  toggleLayer(layerId: string): void {
    this.layers.update((layers) =>
      layers.map((layer) => layer.id === layerId ? {...layer, visible: !layer.visible, active: !layer.visible} : layer)
    );
  }
}

@Injectable({providedIn: 'root'})
export class MapSelectionFacade {
  readonly selectedFeatureId = signal<string | null>(null);
  readonly selectedLayerId = signal<string | null>(null);

  selectFeature(featureId: string, layerId: string): void {
    this.selectedFeatureId.set(featureId);
    this.selectedLayerId.set(layerId);
  }
}

@Injectable({providedIn: 'root'})
export class ObjectEditorFacade {
  readonly editorTabs = signal([
    'Dane podstawowe',
    'Dane szczegółowe',
    'Lokalizacja i system referencyjny',
    'Dane techniczne',
    'Walidacja',
    'Załączniki / źródła danych'
  ]);
  readonly trafficStationTabs = signal(['Dane podstawowe', 'Dane szczegółowe', 'Dane o licznikach', 'Dane o stacjach', 'Dane o detektorach']);
  readonly activeTab = signal('Dane podstawowe');
}

@Injectable({providedIn: 'root'})
export class WorksetFacade {
  readonly workflow = signal(ROAD_GIS_WORKFLOWS.find((workflow) => workflow.kind === 'workset')!);
}

@Injectable({providedIn: 'root'})
export class ImportManagerFacade {
  readonly session = signal(ROAD_GIS_IMPORT_SESSION);
  readonly workflow = signal(ROAD_GIS_WORKFLOWS.find((workflow) => workflow.kind === 'infrastructure-import')!);
}

@Injectable({providedIn: 'root'})
export class ParcelImportFacade {
  readonly comparison = signal(ROAD_GIS_PARCEL_COMPARISON);
  readonly report = signal(ROAD_GIS_IMPORT_REPORT);
  readonly workflow = signal(ROAD_GIS_WORKFLOWS.find((workflow) => workflow.kind === 'parcel-import')!);
}

@Injectable({providedIn: 'root'})
export class ValidationFacade {
  readonly workflow = signal(ROAD_GIS_WORKFLOWS.find((workflow) => workflow.kind === 'validation')!);
}

@Injectable({providedIn: 'root'})
export class ReferenceBindingFacade {
  readonly workflow = signal(ROAD_GIS_WORKFLOWS.find((workflow) => workflow.kind === 'reference-binding')!);
}

@Injectable({providedIn: 'root'})
export class ReportFacade {
  readonly definitions = signal(ROAD_GIS_REPORT_DEFINITIONS);
  readonly exportJobs = signal(ROAD_GIS_EXPORT_JOBS);
  readonly workflow = signal(ROAD_GIS_WORKFLOWS.find((workflow) => workflow.kind === 'reports-export')!);
}

@Injectable({providedIn: 'root'})
export class RoadGisWorkflowFacade {
  readonly workflows = signal(ROAD_GIS_WORKFLOWS);
  readonly activeWorkflowKind = signal<WorkflowKind>('map-composition');
  readonly activeStepIndex = signal<Record<WorkflowKind, number>>({
    'map-composition': 1,
    'infrastructure-import': 2,
    'parcel-import': 2,
    workset: 1,
    'object-editor': 0,
    'reference-binding': 1,
    validation: 0,
    'reports-export': 0
  });
  readonly activeWorkflow = computed(() => {
    const kind = this.activeWorkflowKind();
    return this.workflows().find((workflow) => workflow.kind === kind) ?? this.workflows()[0];
  });
  readonly activeStep = computed(() => this.activeWorkflow().steps[this.activeStepIndex()[this.activeWorkflowKind()] ?? 0]);

  activate(kind: WorkflowKind): void {
    this.activeWorkflowKind.set(kind);
  }

  setStep(kind: WorkflowKind, index: number): void {
    this.activeStepIndex.update((steps) => ({...steps, [kind]: index}));
  }
}
