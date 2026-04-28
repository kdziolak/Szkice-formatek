import {HttpClient} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';
import {Observable, of} from 'rxjs';

import {
  GeoJsonFeatureCollection,
  ImportJobDto,
  InfrastructureObjectDto,
  InfrastructureObjectRequest,
  LayerDto,
  ObjectValidationResponse,
  ReferenceSegmentDto,
  RoadSectionDto,
  RoadSectionUpdateRequest,
  RoadDto,
  ValidationIssueDto,
  WorkspaceDto,
  WorkspaceObjectUpdateRequest
} from './road-infra-gis.models';
import {
  PREVIEW_INFRASTRUCTURE_OBJECTS,
  PREVIEW_LAYERS,
  PREVIEW_REFERENCE_SEGMENTS,
  PREVIEW_ROADS,
  PREVIEW_ROAD_SECTIONS,
  PREVIEW_VALIDATION_ISSUES,
  PREVIEW_WORKSPACES
} from './road-infra-gis.fake-data';

@Injectable({providedIn: 'root'})
export class RoadInfraGisApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  roads(): Observable<RoadDto[]> {
    return of(cloneItems(PREVIEW_ROADS));
  }

  referenceSegments(roadNumber?: string): Observable<ReferenceSegmentDto[]> {
    return of(cloneItems(PREVIEW_REFERENCE_SEGMENTS.filter((segment) => !roadNumber || segment.roadNumber === roadNumber)));
  }

  nearestReferenceSegment(lat: number, lon: number, roadNumber?: string | null): Observable<ReferenceSegmentDto> {
    const segment = PREVIEW_REFERENCE_SEGMENTS.find((item) => !roadNumber || item.roadNumber === roadNumber)
      ?? PREVIEW_REFERENCE_SEGMENTS[0];
    return of(cloneItem(segment));
  }

  infrastructureObjects(): Observable<InfrastructureObjectDto[]> {
    return of(cloneItems(PREVIEW_INFRASTRUCTURE_OBJECTS));
  }

  roadSections(roadNumber?: string, status?: string): Observable<RoadSectionDto[]> {
    return of(cloneItems(PREVIEW_ROAD_SECTIONS.filter((section) =>
      (!roadNumber || section.roadNumber === roadNumber) && (!status || section.status === status)
    )));
  }

  roadSection(id: string): Observable<RoadSectionDto> {
    const section = PREVIEW_ROAD_SECTIONS.find((item) => item.id === id) ?? PREVIEW_ROAD_SECTIONS[0];
    return of(cloneItem(section));
  }

  updateInfrastructureObject(id: string, request: InfrastructureObjectRequest): Observable<InfrastructureObjectDto> {
    return this.http.put<InfrastructureObjectDto>(`${this.baseUrl}/infrastructure-objects/${id}`, request);
  }

  bindReferenceSegment(id: string, referenceSegmentId: string): Observable<InfrastructureObjectDto> {
    return this.http.post<InfrastructureObjectDto>(`${this.baseUrl}/infrastructure-objects/${id}/bind-reference-segment`, {
      referenceSegmentId
    });
  }

  validateInfrastructureObject(id: string): Observable<ObjectValidationResponse> {
    return this.http.post<ObjectValidationResponse>(`${this.baseUrl}/infrastructure-objects/${id}/validate`, {});
  }

  layers(): Observable<LayerDto[]> {
    return of(cloneItems(PREVIEW_LAYERS));
  }

  layerFeatures(layerCode: string): Observable<GeoJsonFeatureCollection> {
    return of(featuresForLayer(layerCode));
  }

  workspaces(): Observable<WorkspaceDto[]> {
    return of(cloneItems(PREVIEW_WORKSPACES));
  }

  createWorkspace(): Observable<WorkspaceDto> {
    return this.http.post<WorkspaceDto>(`${this.baseUrl}/workspaces`, {
      name: `Wersja robocza ${new Date().toLocaleString('pl-PL')}`,
      createdBy: 'operator.warszawa',
      scopeGeometry: null
    });
  }

  addObjectToWorkspace(workspaceId: string, objectId: string): Observable<WorkspaceDto> {
    return this.http.post<WorkspaceDto>(`${this.baseUrl}/workspaces/${workspaceId}/objects`, {objectId});
  }

  updateWorkspaceObject(
    workspaceId: string,
    objectId: string,
    request: WorkspaceObjectUpdateRequest
  ): Observable<InfrastructureObjectDto> {
    return this.http.put<InfrastructureObjectDto>(`${this.baseUrl}/workspaces/${workspaceId}/objects/${objectId}`, request);
  }

  addRoadSectionToWorkspace(workspaceId: string, roadSectionId: string): Observable<WorkspaceDto> {
    return this.http.post<WorkspaceDto>(`${this.baseUrl}/workspaces/${workspaceId}/road-sections`, {roadSectionId});
  }

  updateWorkspaceRoadSection(
    workspaceId: string,
    roadSectionId: string,
    request: RoadSectionUpdateRequest
  ): Observable<RoadSectionDto> {
    return this.http.put<RoadSectionDto>(
      `${this.baseUrl}/workspaces/${workspaceId}/road-sections/${roadSectionId}`,
      request
    );
  }

  bindWorkspaceRoadSectionReferenceSegment(
    workspaceId: string,
    roadSectionId: string,
    referenceSegmentId: string
  ): Observable<RoadSectionDto> {
    return this.http.post<RoadSectionDto>(
      `${this.baseUrl}/workspaces/${workspaceId}/road-sections/${roadSectionId}/bind-reference-segment`,
      {referenceSegmentId}
    );
  }

  bindWorkspaceReferenceSegment(
    workspaceId: string,
    objectId: string,
    referenceSegmentId: string
  ): Observable<InfrastructureObjectDto> {
    return this.http.post<InfrastructureObjectDto>(
      `${this.baseUrl}/workspaces/${workspaceId}/objects/${objectId}/bind-reference-segment`,
      {referenceSegmentId}
    );
  }

  validateWorkspace(workspaceId: string): Observable<ValidationIssueDto[]> {
    return this.http.post<ValidationIssueDto[]>(`${this.baseUrl}/workspaces/${workspaceId}/validate`, {});
  }

  finalizeWorkspace(workspaceId: string): Observable<WorkspaceDto> {
    return this.http.post<WorkspaceDto>(`${this.baseUrl}/workspaces/${workspaceId}/finalize`, {});
  }

  rejectWorkspace(workspaceId: string): Observable<WorkspaceDto> {
    return this.http.post<WorkspaceDto>(`${this.baseUrl}/workspaces/${workspaceId}/reject`, {});
  }

  validationIssues(): Observable<ValidationIssueDto[]> {
    return of(cloneItems(PREVIEW_VALIDATION_ISSUES));
  }

  importGeoJson(payload: GeoJsonFeatureCollection): Observable<ImportJobDto> {
    return this.http.post<ImportJobDto>(`${this.baseUrl}/import/geojson`, payload);
  }
}

function cloneItems<T>(items: T[]): T[] {
  return items.map(cloneItem);
}

function cloneItem<T>(item: T): T {
  return structuredClone(item);
}

function featuresForLayer(layerCode: string): GeoJsonFeatureCollection {
  const features = [
    ...PREVIEW_REFERENCE_SEGMENTS
      .filter(() => layerCode === 'reference-segments')
      .map((segment) => ({
        type: 'Feature' as const,
        geometry: segment.geometry,
        properties: {id: segment.id, segmentCode: segment.segmentCode, roadNumber: segment.roadNumber}
      })),
    ...PREVIEW_ROAD_SECTIONS
      .filter(() => layerCode === 'road-sections')
      .map((section) => ({
        type: 'Feature' as const,
        geometry: section.geometry,
        properties: {id: section.id, sectionCode: section.sectionCode, roadNumber: section.roadNumber}
      })),
    ...PREVIEW_INFRASTRUCTURE_OBJECTS
      .filter((object) => objectLayerCode(object.objectType) === layerCode)
      .map((object) => ({
        type: 'Feature' as const,
        geometry: object.geometry,
        properties: {id: object.id, objectCode: object.objectCode, objectType: object.objectType}
      })),
    ...PREVIEW_VALIDATION_ISSUES
      .filter((issue) => layerCode === 'validation-issues')
      .map((issue) => ({
        type: 'Feature' as const,
        geometry: issue.geometryMarker,
        properties: {id: issue.id, issueType: issue.issueType, severity: issue.severity}
      }))
  ].filter((feature) => feature.geometry);

  return cloneItem({
    type: 'FeatureCollection',
    features
  });
}

function objectLayerCode(objectType: string): string {
  switch (objectType) {
    case 'ROAD_BARRIER':
      return 'road-barriers';
    case 'TRAFFIC_COUNTING_STATION':
      return 'traffic-stations';
    case 'ROAD_PARCEL':
      return 'parcels';
    default:
      return 'objects';
  }
}
