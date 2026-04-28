import { computed, inject, Injectable, signal } from '@angular/core';

import { MockObjectEntryApiService } from '../core/mock-object-entry-api.service';
import {
  DraftStatus,
  GeometryToolMode,
  ObjectGeometry,
  ObjectGeometryType,
  ReferenceCandidate,
  RoadObject,
  ValidationIssue,
} from '../core/object-entry.models';

@Injectable({
  providedIn: 'root',
})
export class ObjectEntryWorkspaceStore {
  private readonly api = inject(MockObjectEntryApiService);

  readonly objects = signal<RoadObject[]>([]);
  readonly selectedObjectId = signal<string | null>(null);
  readonly selectedObjectIds = signal<string[]>([]);
  readonly activeGeometryTool = signal<GeometryToolMode>('select');
  readonly draftId = signal<string | null>(null);
  readonly draftStatus = signal<DraftStatus>('idle');
  readonly validationIssues = signal<ValidationIssue[]>([]);
  readonly dirtyFields = signal<string[]>([]);
  readonly statusMessage = signal<string>('Workspace nie zostal jeszcze zainicjalizowany.');

  readonly activeObject = computed<RoadObject | null>(() => {
    const activeId = this.selectedObjectId();
    if (!activeId) {
      return null;
    }

    return this.objects().find((roadObject) => roadObject.id === activeId) ?? null;
  });

  async initialize(): Promise<void> {
    const summary = await this.api.loadWorkspaceSummary();
    this.objects.set(summary.objects);
    this.selectedObjectId.set(summary.objects[0]?.id ?? null);
    this.selectedObjectIds.set(summary.objects[0] ? [summary.objects[0].id] : []);
    this.activeGeometryTool.set('select');
    this.draftId.set(summary.draftId);
    this.draftStatus.set(summary.draftStatus);
    this.validationIssues.set(summary.validationIssues);
    this.dirtyFields.set([]);
    this.statusMessage.set(summary.statusMessage);
  }

  selectObject(id: string): void {
    const exists = this.objects().some((roadObject) => roadObject.id === id);
    if (!exists) {
      this.statusMessage.set(`Nie znaleziono obiektu ${id}.`);
      return;
    }

    this.selectedObjectId.set(id);
    this.selectedObjectIds.set([id]);
    this.activeGeometryTool.set('select');
    this.statusMessage.set(`Wybrano obiekt ${id}.`);
  }

  async startCreate(type: ObjectGeometryType): Promise<void> {
    const result = await this.api.startCreate(type);
    this.upsertObject(result.object);
    this.selectedObjectId.set(result.object.id);
    this.selectedObjectIds.set([result.object.id]);
    this.activeGeometryTool.set(type);
    this.draftId.set(result.draftId);
    this.draftStatus.set(result.draftStatus);
    this.validationIssues.set(result.validationIssues);
    this.dirtyFields.set([]);
    this.statusMessage.set(result.statusMessage);
  }

  async updateActiveAttributes(patch: Partial<RoadObject['attributes']>): Promise<void> {
    const activeObject = this.activeObject();
    const draftId = this.draftId();
    if (!activeObject || !draftId) {
      this.statusMessage.set('Brak aktywnego szkicu do edycji atrybutow.');
      return;
    }

    const result = await this.api.updateObjectAttributes(draftId, activeObject.id, patch);
    this.upsertObject(result.object);
    this.draftStatus.set(result.draftStatus);
    this.validationIssues.set(result.validationIssues);
    this.dirtyFields.set(mergeDirtyFields(this.dirtyFields(), Object.keys(patch).map((key) => `attributes.${key}`)));
    this.statusMessage.set(result.statusMessage);
  }

  async saveGeometry(geometry: ObjectGeometry): Promise<void> {
    const activeObject = this.activeObject();
    const draftId = this.draftId();
    if (!activeObject || !draftId) {
      this.statusMessage.set('Brak aktywnego szkicu do zapisu geometrii.');
      return;
    }

    const result = await this.api.updateObjectGeometry(draftId, activeObject.id, geometry);
    this.upsertObject(result.object);
    this.activeGeometryTool.set('select');
    this.draftStatus.set(result.draftStatus);
    this.validationIssues.set(result.validationIssues);
    this.dirtyFields.set(mergeDirtyFields(this.dirtyFields(), ['geometry']));
    this.statusMessage.set(result.statusMessage);
  }

  saveDraft(): void {
    const activeObject = this.activeObject();
    const draftId = this.draftId();
    if (!activeObject || !draftId || activeObject.lifecycleStatus === 'published') {
      this.statusMessage.set('Brak aktywnego szkicu do zapisu.');
      return;
    }

    this.dirtyFields.set([]);
    this.statusMessage.set(`Szkic ${activeObject.businessId} zostal zapisany lokalnie.`);
  }

  async bindReference(candidate: ReferenceCandidate): Promise<void> {
    const activeObject = this.activeObject();
    const draftId = this.draftId();
    if (!activeObject || !draftId) {
      this.statusMessage.set('Brak aktywnego szkicu do powiazania referencji.');
      return;
    }

    const result = await this.api.bindReference(draftId, activeObject.id, candidate);
    this.upsertObject(result.object);
    this.draftStatus.set(result.draftStatus);
    this.validationIssues.set(result.validationIssues);
    this.dirtyFields.set(mergeDirtyFields(this.dirtyFields(), ['referenceBinding']));
    this.statusMessage.set(result.statusMessage);
  }

  async validateDraft(): Promise<void> {
    const activeObject = this.activeObject();
    const draftId = this.draftId();
    if (!activeObject || !draftId) {
      this.statusMessage.set('Brak aktywnego szkicu do walidacji.');
      return;
    }

    const result = await this.api.validateDraft(draftId, activeObject.id);
    this.upsertObject(result.object);
    this.draftStatus.set(result.draftStatus);
    this.validationIssues.set(result.validationIssues);
    this.statusMessage.set(result.statusMessage);
  }

  async publishDraft(): Promise<void> {
    const activeObject = this.activeObject();
    const draftId = this.draftId();
    if (!activeObject || !draftId) {
      this.statusMessage.set('Brak aktywnego szkicu do publikacji.');
      return;
    }

    const result = await this.api.publishDraft(draftId, activeObject.id);
    this.upsertObject(result.object);
    this.draftStatus.set(result.draftStatus);
    this.validationIssues.set(result.validationIssues);
    this.dirtyFields.set(result.draftStatus === 'published' ? [] : this.dirtyFields());
    this.statusMessage.set(result.statusMessage);
  }

  clearSelection(): void {
    this.selectedObjectId.set(null);
    this.selectedObjectIds.set([]);
    this.activeGeometryTool.set('select');
    this.validationIssues.set([]);
    this.statusMessage.set('Wyczyszczono selekcje obiektow.');
  }

  private upsertObject(nextObject: RoadObject): void {
    this.objects.update((objects) => {
      const index = objects.findIndex((roadObject) => roadObject.id === nextObject.id);
      if (index === -1) {
        return [...objects, nextObject];
      }

      return objects.map((roadObject, currentIndex) => (currentIndex === index ? nextObject : roadObject));
    });
  }
}

function mergeDirtyFields(current: string[], next: string[]): string[] {
  return Array.from(new Set([...current, ...next]));
}
