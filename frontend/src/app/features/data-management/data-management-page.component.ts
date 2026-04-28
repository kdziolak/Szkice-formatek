import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
  ObjectGeometryType,
  ReferenceCandidate,
  RoadObject,
  ValidationIssue,
} from '../../core/object-entry.models';
import { ObjectEntryMapComponent } from '../../map/object-entry-map.component';
import { ObjectEntryWorkspaceStore } from '../../state/object-entry-workspace.store';

@Component({
  selector: 'rgp-data-management-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    ObjectEntryMapComponent,
  ],
  templateUrl: './data-management-page.component.html',
  styleUrl: './data-management-page.component.css',
})
export class DataManagementPageComponent implements OnInit {
  protected readonly store = inject(ObjectEntryWorkspaceStore);
  protected readonly objects = this.store.objects;
  protected readonly activeObject = this.store.activeObject;
  protected readonly selectedObjectId = this.store.selectedObjectId;
  protected readonly activeTool = this.store.activeGeometryTool;
  protected readonly draftStatus = this.store.draftStatus;
  protected readonly dirtyFields = this.store.dirtyFields;
  protected readonly validationIssues = this.store.validationIssues;
  protected readonly statusMessage = this.store.statusMessage;
  protected readonly referenceCandidates = computed(
    () => this.activeObject()?.availableReferenceCandidates ?? [],
  );
  protected readonly canUseDraftActions = computed(() => {
    const activeObject = this.activeObject();

    return this.store.draftId() !== null && !!activeObject && activeObject.lifecycleStatus !== 'published';
  });
  protected readonly canPublish = computed(
    () => this.canUseDraftActions() && this.draftStatus() === 'validated',
  );
  protected readonly workspaceStats = computed(() => {
    const objects = this.objects();
    const issues = this.validationIssues();

    return {
      all: objects.length,
      draft: objects.filter((roadObject) => roadObject.lifecycleStatus !== 'published').length,
      published: objects.filter((roadObject) => roadObject.lifecycleStatus === 'published').length,
      errors: issues.filter((issue) => issue.severity === 'error').length,
      warnings: issues.filter((issue) => issue.severity === 'warning').length,
    };
  });

  ngOnInit(): void {
    void this.store.initialize();
  }

  protected createObject(type: ObjectGeometryType): void {
    void this.store.startCreate(type);
  }

  protected selectObject(objectId: string): void {
    this.store.selectObject(objectId);
  }

  protected updateAttributes(patch: Partial<RoadObject['attributes']>): void {
    void this.store.updateActiveAttributes(patch);
  }

  protected bindReference(candidate: ReferenceCandidate): void {
    void this.store.bindReference(candidate);
  }

  protected saveDraft(): void {
    this.store.saveDraft();
  }

  protected validateDraft(): void {
    void this.store.validateDraft();
  }

  protected publishDraft(): void {
    void this.store.publishDraft();
  }

  protected focusIssue(issue: ValidationIssue): void {
    if (issue.objectId) {
      this.store.selectObject(issue.objectId);
    }
  }

  protected chainageLabel(roadObject: RoadObject): string {
    const reference = roadObject.referenceBinding;
    if (!reference) {
      return 'brak powiazania';
    }

    if (reference.chainageStart === reference.chainageEnd) {
      return `${reference.roadNumber} km ${reference.chainageStart.toFixed(3)}`;
    }

    return `${reference.roadNumber} km ${reference.chainageStart.toFixed(3)} - ${reference.chainageEnd.toFixed(3)}`;
  }

  protected lifecycleLabel(roadObject: RoadObject): string {
    switch (roadObject.lifecycleStatus) {
      case 'draft':
        return 'Draft';
      case 'validated':
        return 'Po walidacji';
      case 'rejected':
        return 'Odrzucony';
      case 'published':
        return 'Opublikowany';
      case 'archived':
        return 'Archiwalny';
    }
  }

  protected lifecycleSeverity(roadObject: RoadObject): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (roadObject.lifecycleStatus) {
      case 'published':
        return 'success';
      case 'validated':
        return 'info';
      case 'draft':
        return 'warn';
      case 'rejected':
        return 'danger';
      case 'archived':
        return 'secondary';
    }
  }

  protected issueLabel(issue: ValidationIssue): string {
    return issue.field ? `${issue.code} / ${issue.field}` : issue.code;
  }

  protected isDirty(field: string): boolean {
    return this.dirtyFields().includes(field);
  }
}
