import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';

import {RoadInfraGisApiService} from '../core/road-infra-gis-api.service';
import {
  InfrastructureObjectDto,
  ReferenceSegmentDto,
  RoadSectionDto,
  ValidationIssueDto,
  WorkspaceDto
} from '../core/road-infra-gis.models';
import {RoadInfraGisStore} from './road-infra-gis.store';

describe('RoadInfraGisStore', () => {
  let store: RoadInfraGisStore;
  let api: jasmine.SpyObj<RoadInfraGisApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<RoadInfraGisApiService>('RoadInfraGisApiService', [
      'updateInfrastructureObject',
      'updateWorkspaceObject',
      'bindReferenceSegment',
      'bindWorkspaceReferenceSegment',
      'updateWorkspaceRoadSection',
      'bindWorkspaceRoadSectionReferenceSegment'
    ]);

    TestBed.configureTestingModule({
      providers: [
        RoadInfraGisStore,
        {provide: RoadInfraGisApiService, useValue: api}
      ]
    });

    store = TestBed.inject(RoadInfraGisStore);
  });

  it('does not use a closed workspace as active workspace', () => {
    store.workspaces.set([
      workspace({id: 'closed-1', status: 'SFINALIZOWANY'}),
      workspace({id: 'closed-2', status: 'ODRZUCONY'})
    ]);

    expect(store.activeWorkspace()).toBeNull();
    expect(store.workspaceObjectCount()).toBe(0);
  });

  it('keeps a local edit outside draft mode until the object is added to workspace', () => {
    const original = object({draftStatus: 'NIE_DOTYCZY'});
    const saved = object({name: 'Po zapisie finalnym', draftStatus: 'NIE_DOTYCZY'});
    api.updateInfrastructureObject.and.returnValue(of(saved));

    store.infrastructureObjects.set([original]);
    store.selectedObjectId.set(original.id);
    store.updateActiveObject({name: 'Edycja lokalna'});
    store.saveActiveObject();

    expect(store.activeObject()?.draftStatus).toBe('NIE_DOTYCZY');
    expect(api.updateInfrastructureObject).toHaveBeenCalled();
    expect(api.updateWorkspaceObject).not.toHaveBeenCalled();
  });

  it('routes save and reference binding through workspace API only for draft objects in an open workspace', () => {
    const draft = object({draftStatus: 'DODANY_DO_WERSJI_ROBOCZEJ'});
    api.updateWorkspaceObject.and.returnValue(of(object({draftStatus: 'ZAPISANY_W_WERSJI_ROBOCZEJ'})));
    api.bindWorkspaceReferenceSegment.and.returnValue(of(object({referenceSegmentId: 'segment-1'})));

    store.workspaces.set([workspace({status: 'AKTYWNY'})]);
    store.infrastructureObjects.set([draft]);
    store.selectedObjectId.set(draft.id);
    store.saveActiveObject();
    store.bindActiveToSegment('segment-1');

    expect(api.updateWorkspaceObject).toHaveBeenCalledWith('workspace-1', draft.id, jasmine.any(Object));
    expect(api.bindWorkspaceReferenceSegment).toHaveBeenCalledWith('workspace-1', draft.id, 'segment-1');
    expect(api.updateInfrastructureObject).not.toHaveBeenCalled();
    expect(api.bindReferenceSegment).not.toHaveBeenCalled();
  });

  it('selects a road section and scopes active validation issues to that section', () => {
    const section = roadSection({referenceSegmentId: 'segment-1'});
    store.infrastructureObjects.set([object()]);
    store.roadSections.set([section]);
    store.validationIssues.set([roadSectionIssue(section)]);

    store.selectRoadSection(section.id);

    expect(store.activeRoadSection()).toEqual(section);
    expect(store.selectedObjectId()).toBeNull();
    expect(store.selectedReferenceSegmentId()).toBe('segment-1');
    expect(store.activeValidationIssues().map((issue) => issue.targetId)).toEqual([section.id]);
  });

  it('routes road section save and reference binding through workspace API for draft sections', () => {
    const draft = roadSection({draftStatus: 'DODANY_DO_WERSJI_ROBOCZEJ'});
    api.updateWorkspaceRoadSection.and.returnValue(of(roadSection({draftStatus: 'ZAPISANY_W_WERSJI_ROBOCZEJ'})));
    api.bindWorkspaceRoadSectionReferenceSegment.and.returnValue(of(roadSection({referenceSegmentId: 'segment-2'})));

    store.workspaces.set([workspace({status: 'AKTYWNY'})]);
    store.roadSections.set([draft]);
    store.selectedRoadSectionId.set(draft.id);
    store.saveActiveRoadSection();
    store.bindActiveRoadSectionToSegment('segment-2');

    expect(api.updateWorkspaceRoadSection).toHaveBeenCalledWith('workspace-1', draft.id, jasmine.any(Object));
    expect(api.bindWorkspaceRoadSectionReferenceSegment).toHaveBeenCalledWith('workspace-1', draft.id, 'segment-2');
    expect(api.updateWorkspaceObject).not.toHaveBeenCalledWith('workspace-1', draft.id, jasmine.any(Object));
    expect(api.bindWorkspaceReferenceSegment).not.toHaveBeenCalledWith('workspace-1', draft.id, 'segment-2');
  });

  it('derives the active grid row from the shared map table form selection', () => {
    const selectedObject = object({id: 'object-2', objectCode: 'BAR-DK7-002'});
    const selectedSection = roadSection({id: 'road-section-2', sectionCode: 'DK7-WAW-002-ODC'});
    const selectedSegment = referenceSegment({id: 'segment-2', segmentCode: 'DK7-WAW-002'});
    store.infrastructureObjects.set([object(), selectedObject]);
    store.roadSections.set([roadSection(), selectedSection]);
    store.referenceSegments.set([referenceSegment(), selectedSegment]);

    store.selectObject(selectedObject.id);
    expect(store.selectedGridRow()).toEqual(jasmine.objectContaining({kind: 'OBJECT', id: selectedObject.id}));

    store.setTableTab('Odcinki drogi');
    store.selectRoadSection(selectedSection.id);
    expect(store.selectedGridRow()).toEqual(jasmine.objectContaining({kind: 'ROAD_SECTION', id: selectedSection.id}));

    store.setTableTab('System referencyjny');
    store.selectReferenceSegment(selectedSegment.id);
    expect(store.selectedGridRow()).toEqual(jasmine.objectContaining({kind: 'REFERENCE_SEGMENT', id: selectedSegment.id}));
  });

  it('filters grid rows across object, road section, and reference segment views', () => {
    store.infrastructureObjects.set([
      object({id: 'object-1', objectCode: 'BAR-DK7-001', roadNumber: 'DK7'}),
      object({id: 'object-2', objectCode: 'KAN-S8-001', roadNumber: 'S8', objectType: 'TECHNICAL_CHANNEL'})
    ]);
    store.roadSections.set([
      roadSection({id: 'section-1', sectionCode: 'DK7-WAW-001-ODC'}),
      roadSection({id: 'section-2', sectionCode: 'S8-WAW-001-ODC', roadNumber: 'S8'})
    ]);
    store.referenceSegments.set([
      referenceSegment({id: 'segment-1', segmentCode: 'DK7-WAW-001'}),
      referenceSegment({id: 'segment-2', segmentCode: 'S8-WAW-001', roadNumber: 'S8'})
    ]);

    store.setGridGlobalFilter('s8');
    expect(store.gridRows().map((row) => row.id)).toEqual(['object-2']);

    store.setTableTab('Odcinki drogi');
    expect(store.gridRows().map((row) => row.id)).toEqual(['section-2']);

    store.setTableTab('System referencyjny');
    expect(store.gridRows().map((row) => row.id)).toEqual(['segment-2']);
  });

  it('normalizes blocker and blocking validation severities as blocking issues', () => {
    store.validationIssues.set([
      validationIssue({id: 'issue-1', severity: 'BLOCKER'}),
      validationIssue({id: 'issue-2', severity: 'BLOCKING'}),
      validationIssue({id: 'issue-3', severity: 'WARNING'})
    ]);

    expect(store.blockingIssueCount()).toBe(2);
    expect(store.isBlockingSeverity('BLOCKER')).toBeTrue();
    expect(store.isBlockingSeverity('BLOCKING')).toBeTrue();
    expect(store.isBlockingSeverity('WARNING')).toBeFalse();
  });

  it('opens a validation issue like an IDE problem by selecting target, field, and map focus', () => {
    const selectedObject = object({id: 'object-2', objectCode: 'BAR-DK7-002'});
    const marker = {type: 'Point', coordinates: [20.91, 52.11]};
    const issue = validationIssue({
      id: 'issue-2',
      targetId: selectedObject.id,
      objectId: selectedObject.id,
      objectCode: selectedObject.objectCode,
      fieldName: 'referenceSegmentId',
      geometryMarker: marker
    });
    store.infrastructureObjects.set([object(), selectedObject]);
    store.validationIssues.set([issue]);

    store.selectValidationIssue(issue);

    expect(store.selectedObjectId()).toBe(selectedObject.id);
    expect(store.selectedRoadSectionId()).toBeNull();
    expect(store.rightPanelTab()).toBe('Atrybuty');
    expect(store.activeTableTab()).toBe('Błędy walidacji');
    expect(store.selectedValidationIssueId()).toBe(issue.id);
    expect(store.focusedValidationField()).toBe('referenceSegmentId');
    expect(store.validationMapFocus()).toEqual(marker);
    expect(store.statusMessage()).toContain('Przejście do błędu');
  });
});

function object(overrides: Partial<InfrastructureObjectDto> = {}): InfrastructureObjectDto {
  return {
    id: 'object-1',
    objectType: 'ROAD_BARRIER',
    objectCode: 'BAR-DK7-001',
    name: 'Bariera DK7',
    roadId: 'road-1',
    roadNumber: 'DK7',
    referenceSegmentId: null,
    referenceSegmentCode: null,
    globalMileageFrom: 12,
    globalMileageTo: 12.5,
    localMileageFrom: null,
    localMileageTo: null,
    geometry: {type: 'LineString', coordinates: [[20.9, 52.1], [20.91, 52.11]]},
    geometryType: 'LINESTRING',
    owner: 'GDDKiA',
    branch: 'Oddzial Warszawa',
    district: 'Rejon Warszawa',
    status: 'AKTYWNY',
    validationStatus: 'OK',
    draftStatus: 'NIE_DOTYCZY',
    validFrom: null,
    validTo: null,
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    attributes: {},
    ...overrides
  };
}

function workspace(overrides: Partial<WorkspaceDto> = {}): WorkspaceDto {
  return {
    id: 'workspace-1',
    name: 'Workspace testowy',
    createdBy: 'operator',
    status: 'AKTYWNY',
    createdAt: '2026-01-01T00:00:00Z',
    closedAt: null,
    scopeGeometry: null,
    objectCount: 1,
    blockingIssueCount: 0,
    ...overrides
  };
}

function roadSection(overrides: Partial<RoadSectionDto> = {}): RoadSectionDto {
  return {
    id: 'road-section-1',
    businessId: 'RS-DK7-001',
    roadId: 'road-1',
    roadNumber: 'DK7',
    referenceSegmentId: 'segment-1',
    referenceSegmentCode: 'DK7-WAW-001',
    sectionCode: 'DK7-WAW-001-ODC',
    name: 'Odcinek DK7 Warszawa',
    kilometerFrom: 12,
    kilometerTo: 13,
    carriageway: 'PRAWA',
    direction: 'rosnacy kilometraz',
    geometry: {type: 'LineString', coordinates: [[20.9, 52.1], [20.92, 52.12]]},
    status: 'AKTYWNY',
    validationStatus: 'OK',
    draftStatus: 'NIE_DOTYCZY',
    validFrom: '2024-01-01',
    validTo: null,
    updatedAt: '2026-01-01T00:00:00Z',
    referenceBinding: {
      referenceSegmentId: 'segment-1',
      referenceSegmentCode: 'DK7-WAW-001',
      roadId: 'road-1',
      roadNumber: 'DK7',
      mileageFrom: 12,
      mileageTo: 13,
      locationMethod: 'SYSTEM_REFERENCYJNY',
      consistencyStatus: 'ZGODNE'
    },
    ...overrides
  };
}

function roadSectionIssue(section: RoadSectionDto): ValidationIssueDto {
  return {
    id: 'issue-1',
    objectId: null,
    objectCode: null,
    targetType: 'ROAD_SECTION',
    targetId: section.id,
    targetCode: section.sectionCode,
    severity: 'BLOCKING',
    issueType: 'MISSING_REFERENCE_SEGMENT',
    fieldName: 'referenceSegmentId',
    message: 'Odcinek drogi musi mieć dowiązanie do SR.',
    geometryMarker: null,
    createdAt: '2026-01-01T00:00:00Z',
    resolved: false
  };
}

function validationIssue(overrides: Partial<ValidationIssueDto> = {}): ValidationIssueDto {
  return {
    id: 'issue-1',
    objectId: 'object-1',
    objectCode: 'BAR-DK7-001',
    targetType: 'INFRASTRUCTURE_OBJECT',
    targetId: 'object-1',
    targetCode: 'BAR-DK7-001',
    severity: 'BLOCKING',
    issueType: 'MISSING_REFERENCE_SEGMENT',
    fieldName: 'referenceSegmentId',
    message: 'Obiekt musi miec dowiazanie do SR.',
    geometryMarker: null,
    createdAt: '2026-01-01T00:00:00Z',
    resolved: false,
    ...overrides
  };
}

function referenceSegment(overrides: Partial<ReferenceSegmentDto> = {}): ReferenceSegmentDto {
  return {
    id: 'segment-1',
    roadId: 'road-1',
    roadNumber: 'DK7',
    segmentCode: 'DK7-WAW-001',
    startMileageKm: 12,
    endMileageKm: 13,
    carriageway: 'PRAWA',
    direction: 'rosnacy kilometraz',
    status: 'AKTYWNY',
    validFrom: '2024-01-01',
    validTo: null,
    geometry: {type: 'LineString', coordinates: [[20.9, 52.1], [20.92, 52.12]]},
    ...overrides
  };
}
