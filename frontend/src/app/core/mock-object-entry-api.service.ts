import { Injectable } from '@angular/core';

import {
  DraftStatus,
  ObjectGeometry,
  ObjectGeometryType,
  ObjectLifecycleStatus,
  ReferenceBinding,
  ReferenceCandidate,
  RoadObject,
  ValidationIssue,
  WorkspaceSummary,
} from './object-entry.models';

interface DraftContext {
  id: string;
  objectId: string;
  status: DraftStatus;
}

interface UpdateDraftResult {
  object: RoadObject;
  draftId: string;
  draftStatus: DraftStatus;
  validationIssues: ValidationIssue[];
  statusMessage: string;
}

interface DraftOperationOptions {
  commandLabel: string;
}

@Injectable({
  providedIn: 'root',
})
export class MockObjectEntryApiService {
  private readonly objects = new Map<string, RoadObject>();
  private readonly draftContexts = new Map<string, DraftContext>();
  private draftSequence = 1;

  constructor() {
    for (const roadObject of buildSampleObjects()) {
      this.objects.set(roadObject.id, roadObject);
    }
  }

  async loadWorkspaceSummary(): Promise<WorkspaceSummary> {
    return {
      objects: this.listObjects(),
      draftId: null,
      draftStatus: 'idle',
      validationIssues: [],
      statusMessage: 'Workspace gotowy do wprowadzania obiektow.',
    };
  }

  async startCreate(geometryType: ObjectGeometryType): Promise<UpdateDraftResult> {
    const objectId = `draft-object-${this.draftSequence}`;
    const draftId = this.createDraftId();
    const object = this.createDraftObject(objectId, geometryType);

    this.objects.set(object.id, object);
    this.draftContexts.set(draftId, {
      id: draftId,
      objectId,
      status: 'draft',
    });

    return {
      object: cloneRoadObject(object),
      draftId,
      draftStatus: 'draft',
      validationIssues: [],
      statusMessage: `Utworzono szkic obiektu ${object.attributes.label}.`,
    };
  }

  async updateObjectAttributes(
    draftId: string,
    objectId: string,
    patch: Partial<RoadObject['attributes']>,
  ): Promise<UpdateDraftResult> {
    return this.applyDraftUpdate(
      draftId,
      objectId,
      (roadObject) => ({
        ...roadObject,
        lifecycleStatus: 'draft',
        attributes: {
          ...roadObject.attributes,
          ...patch,
        },
        lastModifiedAt: buildTimestamp(this.draftSequence),
      }),
      { commandLabel: 'Zapisano zmiany atrybutow szkicu.' },
    );
  }

  async updateObjectGeometry(
    draftId: string,
    objectId: string,
    geometry: ObjectGeometry,
  ): Promise<UpdateDraftResult> {
    return this.applyDraftUpdate(
      draftId,
      objectId,
      (roadObject) => ({
        ...roadObject,
        lifecycleStatus: 'draft',
        geometryType: geometry.type,
        geometry: cloneGeometry(geometry),
        lastModifiedAt: buildTimestamp(this.draftSequence),
      }),
      { commandLabel: 'Zapisano geometrie szkicu.' },
    );
  }

  async bindReference(
    draftId: string,
    objectId: string,
    candidate: ReferenceCandidate,
  ): Promise<UpdateDraftResult> {
    const binding: ReferenceBinding = {
      ...candidate,
      status: 'bound',
      boundAt: buildTimestamp(this.draftSequence),
    };

    return this.applyDraftUpdate(
      draftId,
      objectId,
      (roadObject) => ({
        ...roadObject,
        lifecycleStatus: 'draft',
        referenceBinding: binding,
        lastModifiedAt: buildTimestamp(this.draftSequence),
      }),
      { commandLabel: `Powiazano z referencja ${candidate.sectionLabel}.` },
    );
  }

  async validateDraft(draftId: string, objectId: string): Promise<UpdateDraftResult> {
    const roadObject = this.requireObject(objectId);
    this.requireDraft(draftId, objectId);

    const validationIssues = validateRoadObject(roadObject, draftId);
    const hasErrors = validationIssues.some((issue) => issue.severity === 'error');
    const draftStatus: DraftStatus = hasErrors ? 'rejected' : 'validated';
    const lifecycleStatus: ObjectLifecycleStatus = hasErrors ? 'rejected' : 'validated';

    const updatedObject: RoadObject = {
      ...roadObject,
      lifecycleStatus,
      lastModifiedAt: buildTimestamp(this.draftSequence),
    };

    this.objects.set(objectId, updatedObject);
    this.draftContexts.set(draftId, {
      id: draftId,
      objectId,
      status: draftStatus,
    });

    return {
      object: cloneRoadObject(updatedObject),
      draftId,
      draftStatus,
      validationIssues,
      statusMessage: hasErrors
        ? 'Walidacja wykryla bledy blokujace publikacje.'
        : 'Walidacja zakonczona powodzeniem.',
    };
  }

  async publishDraft(draftId: string, objectId: string): Promise<UpdateDraftResult> {
    const draftContext = this.requireDraft(draftId, objectId);
    if (draftContext.status !== 'validated') {
      const roadObject = this.requireObject(objectId);
      return {
        object: cloneRoadObject(roadObject),
        draftId,
        draftStatus: draftContext.status,
        validationIssues: validateRoadObject(roadObject, draftId),
        statusMessage: 'Publikacja wymaga wczesniejszej poprawnej walidacji.',
      };
    }

    const updatedObject: RoadObject = {
      ...this.requireObject(objectId),
      lifecycleStatus: 'published',
      lastModifiedAt: buildTimestamp(this.draftSequence),
    };

    this.objects.set(objectId, updatedObject);
    this.draftContexts.set(draftId, {
      id: draftId,
      objectId,
      status: 'published',
    });

    return {
      object: cloneRoadObject(updatedObject),
      draftId,
      draftStatus: 'published',
      validationIssues: [],
      statusMessage: 'Szkic zostal opublikowany do stanu referencyjnego.',
    };
  }

  private applyDraftUpdate(
    draftId: string,
    objectId: string,
    updater: (roadObject: RoadObject) => RoadObject,
    options: DraftOperationOptions,
  ): UpdateDraftResult {
    this.requireDraft(draftId, objectId);
    const updatedObject = updater(this.requireObject(objectId));
    this.objects.set(objectId, updatedObject);
    this.draftContexts.set(draftId, {
      id: draftId,
      objectId,
      status: 'draft',
    });

    return {
      object: cloneRoadObject(updatedObject),
      draftId,
      draftStatus: 'draft',
      validationIssues: [],
      statusMessage: options.commandLabel,
    };
  }

  private createDraftObject(objectId: string, geometryType: ObjectGeometryType): RoadObject {
    return {
      id: objectId,
      businessId: `RO-${String(this.draftSequence).padStart(4, '0')}`,
      geometryType,
      lifecycleStatus: 'draft',
      attributes: {
        typeCode: buildTypeCode(geometryType),
        category: 'Nowy obiekt',
        name: buildDefaultName(geometryType),
        label: buildDefaultLabel(geometryType),
        roadNumber: 'DK7',
        condition: 'good',
        owner: 'GDDKiA',
        notes: '',
      },
      geometry: buildEmptyGeometry(geometryType),
      referenceBinding: null,
      availableReferenceCandidates: buildReferenceCandidates(geometryType),
      draftCommands: [
        'create',
        'updateAttributes',
        'updateGeometry',
        'bindReference',
        'validate',
        'publish',
      ],
      lastModifiedAt: buildTimestamp(this.draftSequence),
    };
  }

  private createDraftId(): string {
    const draftId = `draft-${String(this.draftSequence).padStart(3, '0')}`;
    this.draftSequence += 1;
    return draftId;
  }

  private listObjects(): RoadObject[] {
    return Array.from(this.objects.values()).map((roadObject) => cloneRoadObject(roadObject));
  }

  private requireObject(objectId: string): RoadObject {
    const roadObject = this.objects.get(objectId);
    if (!roadObject) {
      throw new Error(`Road object "${objectId}" was not found.`);
    }

    return roadObject;
  }

  private requireDraft(draftId: string, objectId: string): DraftContext {
    const draftContext = this.draftContexts.get(draftId);
    if (!draftContext || draftContext.objectId !== objectId) {
      throw new Error(`Draft "${draftId}" is not active for object "${objectId}".`);
    }

    return draftContext;
  }
}

function buildSampleObjects(): RoadObject[] {
  const commonCandidates = buildReferenceCandidates('line');

  return [
    {
      id: 'road-section-001',
      businessId: 'RO-0001',
      geometryType: 'line',
      lifecycleStatus: 'published',
      attributes: {
        typeCode: 'ROAD_SECTION',
        category: 'Odcinek drogowy',
        name: 'Odcinek roboczy DK7 km 12+340 - 13+150',
        label: 'Odcinek DK7',
        roadNumber: 'DK7',
        condition: 'good',
        owner: 'GDDKiA',
        notes: 'Odcinek referencyjny dla ksiazki drogi.',
      },
      geometry: {
        type: 'line',
        srid: 3857,
        coordinates: [
          [2312450, 7048120],
          [2312680, 7048285],
          [2312925, 7048410],
        ],
      },
      referenceBinding: {
        roadId: 'road-dk7',
        roadNumber: 'DK7',
        sectionId: 'sec-dk7-12',
        sectionLabel: 'DK7 km 12+340 - 13+150',
        chainageStart: 12.34,
        chainageEnd: 13.15,
        carriageway: 'prawa',
        status: 'bound',
        boundAt: '2026-04-10T08:00:00Z',
      },
      availableReferenceCandidates: commonCandidates,
      draftCommands: [
        'create',
        'updateAttributes',
        'updateGeometry',
        'bindReference',
        'validate',
        'publish',
      ],
      lastModifiedAt: '2026-04-10T08:00:00Z',
    },
    {
      id: 'road-sign-001',
      businessId: 'RO-0002',
      geometryType: 'point',
      lifecycleStatus: 'published',
      attributes: {
        typeCode: 'ROAD_SIGN',
        category: 'Oznakowanie pionowe',
        name: 'Znak D-6 przejscie dla pieszych',
        label: 'Znak D-6',
        roadNumber: 'DW780',
        condition: 'fair',
        owner: 'Zarzad drog wojewodzkich',
        notes: 'Wymaga planowego przegladu.',
      },
      geometry: {
        type: 'point',
        srid: 3857,
        coordinates: [2201540, 6489020],
      },
      referenceBinding: {
        roadId: 'road-dw780',
        roadNumber: 'DW780',
        sectionId: 'sec-dw780-44',
        sectionLabel: 'DW780 km 44+120',
        chainageStart: 44.12,
        chainageEnd: 44.12,
        carriageway: 'lewa',
        offsetMeters: 2.1,
        status: 'bound',
        boundAt: '2026-04-12T11:15:00Z',
      },
      availableReferenceCandidates: buildReferenceCandidates('point'),
      draftCommands: [
        'create',
        'updateAttributes',
        'updateGeometry',
        'bindReference',
        'validate',
        'publish',
      ],
      lastModifiedAt: '2026-04-12T11:15:00Z',
    },
    {
      id: 'barrier-001',
      businessId: 'RO-0003',
      geometryType: 'line',
      lifecycleStatus: 'published',
      attributes: {
        typeCode: 'SAFETY_BARRIER',
        category: 'BRD',
        name: 'Bariera energochlonna',
        label: 'Bariera SP-05',
        roadNumber: 'S8',
        condition: 'good',
        owner: 'GDDKiA',
        notes: 'Bariera po modernizacji w 2025.',
      },
      geometry: {
        type: 'line',
        srid: 3857,
        coordinates: [
          [2345200, 6901140],
          [2345415, 6901205],
          [2345620, 6901330],
        ],
      },
      referenceBinding: {
        roadId: 'road-s8',
        roadNumber: 'S8',
        sectionId: 'sec-s8-51',
        sectionLabel: 'S8 km 51+800 - 52+020',
        chainageStart: 51.8,
        chainageEnd: 52.02,
        carriageway: 'prawa',
        lane: 'awaryjny',
        status: 'bound',
        boundAt: '2026-04-08T09:40:00Z',
      },
      availableReferenceCandidates: buildReferenceCandidates('line'),
      draftCommands: [
        'create',
        'updateAttributes',
        'updateGeometry',
        'bindReference',
        'validate',
        'publish',
      ],
      lastModifiedAt: '2026-04-08T09:40:00Z',
    },
    {
      id: 'bay-001',
      businessId: 'RO-0004',
      geometryType: 'polygon',
      lifecycleStatus: 'published',
      attributes: {
        typeCode: 'BUS_BAY',
        category: 'Obiekt powierzchniowy',
        name: 'Zatoka autobusowa P-12',
        label: 'Zatoka P-12',
        roadNumber: 'DK94',
        condition: 'fair',
        owner: 'Miasto Krakow',
        notes: 'Do weryfikacji odwodnienie przy krawedzi.',
      },
      geometry: {
        type: 'polygon',
        srid: 3857,
        coordinates: [
          [2208440, 6493180],
          [2208505, 6493205],
          [2208485, 6493265],
          [2208420, 6493240],
          [2208440, 6493180],
        ],
      },
      referenceBinding: {
        roadId: 'road-dk94',
        roadNumber: 'DK94',
        sectionId: 'sec-dk94-19',
        sectionLabel: 'DK94 km 19+540 - 19+600',
        chainageStart: 19.54,
        chainageEnd: 19.6,
        carriageway: 'prawa',
        status: 'bound',
        boundAt: '2026-04-11T07:25:00Z',
      },
      availableReferenceCandidates: buildReferenceCandidates('polygon'),
      draftCommands: [
        'create',
        'updateAttributes',
        'updateGeometry',
        'bindReference',
        'validate',
        'publish',
      ],
      lastModifiedAt: '2026-04-11T07:25:00Z',
    },
  ];
}

function validateRoadObject(roadObject: RoadObject, draftId: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!roadObject.attributes.name.trim()) {
    issues.push({
      id: `${draftId}-name-required`,
      severity: 'error',
      code: 'OBJECT_NAME_REQUIRED',
      message: 'Nazwa obiektu jest wymagana.',
      field: 'attributes.name',
      objectId: roadObject.id,
      draftId,
    });
  }

  if (!roadObject.referenceBinding) {
    issues.push({
      id: `${draftId}-reference-required`,
      severity: 'error',
      code: 'REFERENCE_BINDING_REQUIRED',
      message: 'Obiekt musi byc powiazany z systemem referencyjnym.',
      field: 'referenceBinding',
      objectId: roadObject.id,
      draftId,
    });
  }

  if (!hasGeometryContent(roadObject.geometry)) {
    issues.push({
      id: `${draftId}-geometry-required`,
      severity: 'error',
      code: 'GEOMETRY_REQUIRED',
      message: 'Geometria obiektu nie jest kompletna.',
      field: 'geometry',
      objectId: roadObject.id,
      draftId,
    });
  }

  if (roadObject.attributes.condition === 'poor') {
    issues.push({
      id: `${draftId}-condition-warning`,
      severity: 'warning',
      code: 'CONDITION_REVIEW_RECOMMENDED',
      message: 'Stan obiektu wskazuje potrzebe dodatkowego przegladu.',
      field: 'attributes.condition',
      objectId: roadObject.id,
      draftId,
    });
  }

  if (roadObject.geometryType === 'polygon' && roadObject.referenceBinding) {
    const span = roadObject.referenceBinding.chainageEnd - roadObject.referenceBinding.chainageStart;
    if (span < 0.03) {
      issues.push({
        id: `${draftId}-polygon-span-warning`,
        severity: 'warning',
        code: 'REFERENCE_SPAN_SHORT',
        message: 'Powierzchnia ma bardzo krotki zakres kilometraza do weryfikacji.',
        field: 'referenceBinding.chainageEnd',
        objectId: roadObject.id,
        draftId,
      });
    }
  }

  return issues;
}

function hasGeometryContent(geometry: ObjectGeometry): boolean {
  if (geometry.type === 'point') {
    return (
      Number.isFinite(geometry.coordinates[0]) &&
      Number.isFinite(geometry.coordinates[1]) &&
      !(geometry.coordinates[0] === 0 && geometry.coordinates[1] === 0)
    );
  }

  const distinctVertices = new Set(geometry.coordinates.map(([x, y]) => `${x}:${y}`)).size;
  if (geometry.type === 'line') {
    return geometry.coordinates.length >= 2 && distinctVertices >= 2;
  }

  return geometry.coordinates.length >= 4 && distinctVertices >= 3;
}

function buildReferenceCandidates(geometryType: ObjectGeometryType): ReferenceCandidate[] {
  const seed =
    geometryType === 'point'
      ? 31
      : geometryType === 'line'
        ? 52
        : 73;

  return [
    {
      roadId: 'road-dk7',
      roadNumber: 'DK7',
      sectionId: `sec-${geometryType}-001`,
      sectionLabel: `DK7 km ${seed}+120 - ${seed}+340`,
      chainageStart: seed + 0.12,
      chainageEnd: seed + (geometryType === 'point' ? 0.12 : 0.34),
      carriageway: 'prawa',
      lane: geometryType === 'line' ? 'zewnetrzny' : undefined,
      offsetMeters: geometryType === 'point' ? 1.5 : undefined,
      status: 'candidate',
      score: 0.97,
      source: 'reference-system',
      label: `Najblizszy odcinek referencyjny ${geometryType}`,
    },
    {
      roadId: 'road-a4',
      roadNumber: 'A4',
      sectionId: `sec-${geometryType}-002`,
      sectionLabel: `A4 km ${seed + 1}+010 - ${seed + 1}+220`,
      chainageStart: seed + 1.01,
      chainageEnd: seed + (geometryType === 'point' ? 1.01 : 1.22),
      carriageway: 'lewa',
      lane: geometryType === 'line' ? 'awaryjny' : undefined,
      offsetMeters: geometryType === 'point' ? 3.2 : undefined,
      status: 'candidate',
      score: 0.84,
      source: 'operator',
      label: `Alternatywne przypisanie ${geometryType}`,
    },
  ];
}

function buildEmptyGeometry(geometryType: ObjectGeometryType): ObjectGeometry {
  if (geometryType === 'point') {
    return {
      type: 'point',
      srid: 3857,
      coordinates: [0, 0],
    };
  }

  if (geometryType === 'line') {
    return {
      type: 'line',
      srid: 3857,
      coordinates: [
        [0, 0],
        [0, 0],
      ],
    };
  }

  return {
    type: 'polygon',
    srid: 3857,
    coordinates: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  };
}

function buildTypeCode(geometryType: ObjectGeometryType): string {
  switch (geometryType) {
    case 'point':
      return 'POINT_OBJECT';
    case 'line':
      return 'LINE_OBJECT';
    case 'polygon':
      return 'AREA_OBJECT';
  }
}

function buildDefaultName(geometryType: ObjectGeometryType): string {
  switch (geometryType) {
    case 'point':
      return 'Nowy obiekt punktowy';
    case 'line':
      return 'Nowy obiekt liniowy';
    case 'polygon':
      return 'Nowy obiekt powierzchniowy';
  }
}

function buildDefaultLabel(geometryType: ObjectGeometryType): string {
  switch (geometryType) {
    case 'point':
      return 'Nowy punkt';
    case 'line':
      return 'Nowa linia';
    case 'polygon':
      return 'Nowy poligon';
  }
}

function buildTimestamp(seed: number): string {
  const day = String(Math.min(seed, 28)).padStart(2, '0');
  return `2026-04-${day}T10:00:00Z`;
}

function cloneRoadObject(roadObject: RoadObject): RoadObject {
  return {
    ...roadObject,
    attributes: {
      ...roadObject.attributes,
    },
    geometry: cloneGeometry(roadObject.geometry),
    referenceBinding: roadObject.referenceBinding
      ? {
          ...roadObject.referenceBinding,
        }
      : null,
    availableReferenceCandidates: roadObject.availableReferenceCandidates.map((candidate) => ({
      ...candidate,
    })),
    draftCommands: [...roadObject.draftCommands],
  };
}

function cloneGeometry(geometry: ObjectGeometry): ObjectGeometry {
  if (geometry.type === 'point') {
    return {
      ...geometry,
      coordinates: [...geometry.coordinates] as [number, number],
    };
  }

  return {
    ...geometry,
    coordinates: geometry.coordinates.map((coordinate) => [...coordinate] as [number, number]),
  };
}
