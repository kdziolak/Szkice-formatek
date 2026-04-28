import {
  InfrastructureObjectDto,
  LayerDto,
  ReferenceSegmentDto,
  RoadDto,
  RoadSectionDto,
  ValidationIssueDto,
  WorkspaceDto
} from './road-infra-gis.models';

export const PREVIEW_ROADS: RoadDto[] = [
  {
    id: 'road-dk7',
    roadNumber: 'DK7',
    category: 'KRAJOWA',
    name: 'DK7 Warszawa - Łomianki',
    managingAuthority: 'GDDKiA Oddział Warszawa',
    totalLengthKm: 18.6
  },
  {
    id: 'road-s8',
    roadNumber: 'S8',
    category: 'EKSPRESOWA',
    name: 'S8 Warszawa Zachód',
    managingAuthority: 'GDDKiA Oddział Warszawa',
    totalLengthKm: 24.2
  }
];

export const PREVIEW_REFERENCE_SEGMENTS: ReferenceSegmentDto[] = [
  {
    id: 'ref-dk7-001',
    roadId: 'road-dk7',
    roadNumber: 'DK7',
    segmentCode: 'DK7-WAW-001',
    startMileageKm: 450,
    endMileageKm: 452.4,
    carriageway: 'PRAWA',
    direction: 'GDAŃSK',
    status: 'AKTYWNY',
    validFrom: '2026-01-01',
    validTo: null,
    geometry: {
      type: 'LineString',
      coordinates: [[20.9211, 52.1861], [20.9362, 52.1938], [20.9482, 52.1989]]
    }
  },
  {
    id: 'ref-dk7-002',
    roadId: 'road-dk7',
    roadNumber: 'DK7',
    segmentCode: 'DK7-WAW-002',
    startMileageKm: 452.4,
    endMileageKm: 455.1,
    carriageway: 'PRAWA',
    direction: 'GDAŃSK',
    status: 'AKTYWNY',
    validFrom: '2026-01-01',
    validTo: null,
    geometry: {
      type: 'LineString',
      coordinates: [[20.9482, 52.1989], [20.9631, 52.2054], [20.9794, 52.2131]]
    }
  }
];

export const PREVIEW_ROAD_SECTIONS: RoadSectionDto[] = [
  {
    id: 'section-dk7-001',
    businessId: 'DK7-ODC-001',
    roadId: 'road-dk7',
    roadNumber: 'DK7',
    referenceSegmentId: 'ref-dk7-001',
    referenceSegmentCode: 'DK7-WAW-001',
    sectionCode: 'DK7-ODC-001',
    name: 'Warszawa Bielany - Łomianki Południe',
    kilometerFrom: 450,
    kilometerTo: 452.4,
    carriageway: 'PRAWA',
    direction: 'GDAŃSK',
    geometry: PREVIEW_REFERENCE_SEGMENTS[0].geometry,
    status: 'AKTYWNY',
    validationStatus: 'OK',
    draftStatus: 'NIE_DOTYCZY',
    validFrom: '2026-01-01',
    validTo: null,
    updatedAt: '2026-04-25T10:20:00Z',
    referenceBinding: {
      referenceSegmentId: 'ref-dk7-001',
      referenceSegmentCode: 'DK7-WAW-001',
      roadId: 'road-dk7',
      roadNumber: 'DK7',
      mileageFrom: 450,
      mileageTo: 452.4,
      locationMethod: 'SYSTEM_REFERENCYJNY',
      consistencyStatus: 'ZGODNE'
    }
  },
  {
    id: 'section-dk7-002',
    businessId: 'DK7-ODC-002',
    roadId: 'road-dk7',
    roadNumber: 'DK7',
    referenceSegmentId: null,
    referenceSegmentCode: null,
    sectionCode: 'DK7-ODC-002',
    name: 'Łomianki Południe - Łomianki Centrum',
    kilometerFrom: 452.4,
    kilometerTo: 455.1,
    carriageway: 'PRAWA',
    direction: 'GDAŃSK',
    geometry: PREVIEW_REFERENCE_SEGMENTS[1].geometry,
    status: 'WERYFIKOWANY',
    validationStatus: 'BŁĄD',
    draftStatus: 'ZMODYFIKOWANY',
    validFrom: '2026-01-01',
    validTo: null,
    updatedAt: '2026-04-27T08:10:00Z',
    referenceBinding: null
  }
];

export const PREVIEW_INFRASTRUCTURE_OBJECTS: InfrastructureObjectDto[] = [
  {
    id: 'object-barrier-001',
    objectType: 'ROAD_BARRIER',
    objectCode: 'BAR-DK7-450-120',
    name: 'Bariera energochłonna prawa',
    roadId: 'road-dk7',
    roadNumber: 'DK7',
    referenceSegmentId: 'ref-dk7-001',
    referenceSegmentCode: 'DK7-WAW-001',
    globalMileageFrom: 450.12,
    globalMileageTo: 450.46,
    localMileageFrom: 0.12,
    localMileageTo: 0.46,
    geometry: {
      type: 'LineString',
      coordinates: [[20.923, 52.187], [20.927, 52.1892]]
    },
    geometryType: 'LINESTRING',
    owner: 'GDDKiA',
    branch: 'Warszawa',
    district: 'Bielany',
    status: 'AKTYWNY',
    validationStatus: 'OK',
    draftStatus: 'NIE_DOTYCZY',
    validFrom: '2026-01-01',
    validTo: null,
    createdBy: 'operator.warszawa',
    createdAt: '2026-04-20T09:00:00Z',
    updatedAt: '2026-04-25T12:00:00Z',
    attributes: {material: 'stal', side: 'P'}
  },
  {
    id: 'object-counter-001',
    objectType: 'TRAFFIC_COUNTING_STATION',
    objectCode: 'SPR-DK7-452-900',
    name: 'Stacja pomiaru ruchu DK7',
    roadId: 'road-dk7',
    roadNumber: 'DK7',
    referenceSegmentId: null,
    referenceSegmentCode: null,
    globalMileageFrom: 452.9,
    globalMileageTo: 452.9,
    localMileageFrom: 0.5,
    localMileageTo: 0.5,
    geometry: {
      type: 'Point',
      coordinates: [20.9524, 52.2008]
    },
    geometryType: 'POINT',
    owner: 'GDDKiA',
    branch: 'Warszawa',
    district: 'Łomianki',
    status: 'NOWY',
    validationStatus: 'BŁĄD',
    draftStatus: 'ROBOCZY',
    validFrom: null,
    validTo: null,
    createdBy: 'operator.warszawa',
    createdAt: '2026-04-27T07:30:00Z',
    updatedAt: '2026-04-27T07:45:00Z',
    attributes: {deviceType: 'radar', lanes: 2}
  },
  {
    id: 'object-parcel-001',
    objectType: 'ROAD_PARCEL',
    objectCode: 'DZ-DK7-001',
    name: 'Działka pasa drogowego',
    roadId: 'road-dk7',
    roadNumber: 'DK7',
    referenceSegmentId: 'ref-dk7-001',
    referenceSegmentCode: 'DK7-WAW-001',
    globalMileageFrom: 451.2,
    globalMileageTo: 451.8,
    localMileageFrom: 1.2,
    localMileageTo: 1.8,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [20.9342, 52.193],
        [20.9414, 52.1957],
        [20.9407, 52.1965],
        [20.9335, 52.1938],
        [20.9342, 52.193]
      ]]
    },
    geometryType: 'POLYGON',
    owner: 'Skarb Państwa',
    branch: 'Warszawa',
    district: 'Bielany',
    status: 'AKTYWNY',
    validationStatus: 'OK',
    draftStatus: 'NIE_DOTYCZY',
    validFrom: '2026-01-01',
    validTo: null,
    createdBy: 'operator.warszawa',
    createdAt: '2026-04-19T08:00:00Z',
    updatedAt: '2026-04-25T12:30:00Z',
    attributes: {parcelNumber: '12/4', precinct: 'Bielany'}
  }
];

export const PREVIEW_VALIDATION_ISSUES: ValidationIssueDto[] = [
  {
    id: 'issue-section-ref-001',
    targetType: 'ROAD_SECTION',
    targetId: 'section-dk7-002',
    targetCode: 'DK7-ODC-002',
    objectId: null,
    objectCode: null,
    severity: 'BLOCKING',
    issueType: 'MISSING_REFERENCE_SEGMENT',
    fieldName: 'referenceSegmentId',
    message: 'Odcinek drogi wymaga dowiązania do systemu referencyjnego.',
    geometryMarker: {type: 'Point', coordinates: [20.9631, 52.2054]},
    createdAt: '2026-04-27T08:12:00Z',
    resolved: false
  },
  {
    id: 'issue-counter-ref-001',
    targetType: 'INFRASTRUCTURE_OBJECT',
    targetId: 'object-counter-001',
    targetCode: 'SPR-DK7-452-900',
    objectId: 'object-counter-001',
    objectCode: 'SPR-DK7-452-900',
    severity: 'BLOCKING',
    issueType: 'MISSING_REFERENCE_SEGMENT',
    fieldName: 'referenceSegmentId',
    message: 'Stacja pomiaru ruchu nie ma przypisanego odcinka referencyjnego.',
    geometryMarker: {type: 'Point', coordinates: [20.9524, 52.2008]},
    createdAt: '2026-04-27T07:50:00Z',
    resolved: false
  }
];

export const PREVIEW_LAYERS: LayerDto[] = [
  {layerCode: 'reference-segments', layerName: 'Odcinki referencyjne', groupName: 'System referencyjny', geometryType: 'LINESTRING', visibleByDefault: true, minScaleLabel: '1:500 000', styleHint: 'reference-blue'},
  {layerCode: 'road-sections', layerName: 'Odcinki drogi', groupName: 'Drogi', geometryType: 'LINESTRING', visibleByDefault: true, minScaleLabel: '1:500 000', styleHint: 'road-section-line'},
  {layerCode: 'road-barriers', layerName: 'Bariery drogowe', groupName: 'Obiekty BRD', geometryType: 'LINESTRING', visibleByDefault: true, minScaleLabel: '1:50 000', styleHint: 'safety-green'},
  {layerCode: 'traffic-stations', layerName: 'Stacje pomiaru ruchu', groupName: 'Pomiary ruchu', geometryType: 'POINT', visibleByDefault: true, minScaleLabel: '1:50 000', styleHint: 'counter-point'},
  {layerCode: 'parcels', layerName: 'Działki pasa drogowego', groupName: 'Ewidencja gruntów', geometryType: 'POLYGON', visibleByDefault: true, minScaleLabel: '1:25 000', styleHint: 'parcel-purple'},
  {layerCode: 'validation-issues', layerName: 'Błędy walidacji', groupName: 'Kontrola jakości', geometryType: 'GEOMETRY', visibleByDefault: true, minScaleLabel: '1:100 000', styleHint: 'validation-red'}
];

export const PREVIEW_WORKSPACES: WorkspaceDto[] = [
  {
    id: 'workspace-preview-001',
    name: 'Wersja robocza - podgląd danych DK7',
    createdBy: 'operator.warszawa',
    status: 'AKTYWNY',
    createdAt: '2026-04-27T07:25:00Z',
    closedAt: null,
    scopeGeometry: {
      type: 'Polygon',
      coordinates: [[
        [20.915, 52.182],
        [20.985, 52.182],
        [20.985, 52.218],
        [20.915, 52.218],
        [20.915, 52.182]
      ]]
    },
    objectCount: 2,
    blockingIssueCount: 2
  }
];
