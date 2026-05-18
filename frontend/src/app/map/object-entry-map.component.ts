import {CommonModule} from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  input,
  output
} from '@angular/core';

import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import {click} from 'ol/events/condition';
import {createEmpty, extend, isEmpty} from 'ol/extent';
import type {Extent} from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import Geometry from 'ol/geom/Geometry';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import Snap from 'ol/interaction/Snap';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import {fromLonLat} from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import {getArea, getLength} from 'ol/sphere';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';

import {
  GeoJsonGeometry,
  InfrastructureObjectDto,
  ReferenceSegmentDto,
  RoadSectionDto,
  ValidationIssueDto
} from '../core/road-infra-gis.models';
import {RoadInfraGisStore} from '../state/road-infra-gis.store';
import {MapToolKind} from '../features/data-management/data-management-workbench.view-model';

@Component({
  selector: 'rgp-object-entry-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="map-shell">
      <div #mapTarget class="map-target" aria-label="Mapa GIS RoadGIS Platform"></div>

      <div class="map-tools">
        <button type="button" class="rgp-icon-button" title="Pełny zasięg" (click)="fitToAll()">
          <i class="pi pi-expand" aria-hidden="true"></i>
        </button>
        <button type="button" class="rgp-icon-button" title="Zoom do zaznaczenia" (click)="zoomToActive()">
          <i class="pi pi-crosshairs" aria-hidden="true"></i>
        </button>
        <button type="button" class="rgp-icon-button" title="Wyczyść zaznaczenie" (click)="clearSelection()">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="scale-box">200 m</div>

      @if (store.activeObject(); as object) {
        <article class="map-popup">
          <strong>{{ object.objectCode }}</strong>
          <span>{{ object.name }}</span>
          <small>{{ object.roadNumber ?? 'brak drogi' }} · {{ object.validationStatus }}</small>
        </article>
      } @else if (store.activeRoadSection(); as section) {
        <article class="map-popup">
          <strong>{{ section.sectionCode }}</strong>
          <span>{{ section.name }}</span>
          <small>{{ section.roadNumber }} · {{ section.validationStatus }}</small>
        </article>
      }
    </section>
  `,
  styles: [`
    :host,
    .map-shell {
      display: block;
      height: 100%;
      min-height: 0;
    }

    .map-shell {
      background: #dfe7ec;
      overflow: hidden;
      position: relative;
    }

    .map-target {
      height: 100%;
      min-height: 320px;
      width: 100%;
    }

    .map-tools {
      display: grid;
      gap: 5px;
      left: 10px;
      position: absolute;
      top: 10px;
      z-index: 3;
    }

    .scale-box {
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid #98a4b3;
      bottom: 12px;
      color: #344052;
      font-size: 0.72rem;
      left: 50%;
      min-width: 92px;
      padding: 2px 8px;
      position: absolute;
      text-align: center;
      transform: translateX(-50%);
      z-index: 3;
    }

    .scale-box::before,
    .scale-box::after {
      background: #344052;
      bottom: 0;
      content: "";
      height: 9px;
      position: absolute;
      width: 1px;
    }

    .scale-box::before {
      left: 7px;
    }

    .scale-box::after {
      right: 7px;
    }

    .map-popup {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--rgp-border-strong);
      box-shadow: 0 10px 24px rgba(22, 34, 50, 0.18);
      display: grid;
      gap: 3px;
      max-width: 260px;
      padding: 8px 10px;
      position: absolute;
      right: 12px;
      top: 12px;
      z-index: 3;
    }

    .map-popup span,
    .map-popup small {
      color: var(--rgp-muted);
      font-size: 0.76rem;
    }
  `]
})
export class ObjectEntryMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapTarget', {static: true}) private readonly mapTarget?: ElementRef<HTMLElement>;

  readonly store = inject(RoadInfraGisStore);
  readonly activeTool = input<MapToolKind>('select');
  readonly snapEnabled = input(true);
  readonly toolMessage = output<string>();

  private readonly geoJson = new GeoJSON();
  private readonly referenceSource = new VectorSource<Feature<Geometry>>();
  private readonly roadSectionSource = new VectorSource<Feature<Geometry>>();
  private readonly objectSource = new VectorSource<Feature<Geometry>>();
  private readonly issueSource = new VectorSource<Feature<Geometry>>();
  private readonly selectedSource = new VectorSource<Feature<Geometry>>();
  private readonly drawingSource = new VectorSource<Feature<Geometry>>();

  private readonly referenceLayer = new VectorLayer({
    source: this.referenceSource,
    style: () => this.referenceStyle()
  });
  private readonly roadSectionLayer = new VectorLayer({
    source: this.roadSectionSource,
    style: (feature) => this.roadSectionStyle(feature as Feature<Geometry>)
  });
  private readonly objectLayer = new VectorLayer({
    source: this.objectSource,
    style: (feature) => this.objectStyle(feature as Feature<Geometry>)
  });
  private readonly issueLayer = new VectorLayer({
    source: this.issueSource,
    style: () => this.issueStyle()
  });
  private readonly selectedLayer = new VectorLayer({
    source: this.selectedSource,
    style: () => this.selectedStyle()
  });
  private readonly drawingLayer = new VectorLayer({
    source: this.drawingSource,
    style: () => this.drawingStyle()
  });

  private map?: Map;
  private select?: Select;
  private draw?: Draw;
  private modify?: Modify;
  private readonly snapInteractions: Snap[] = [];
  private lastGridScopeKey = '';

  constructor() {
    effect(() => {
      this.renderReferenceSegments(this.store.referenceSegments(), this.store.layerVisibility());
    });

    effect(() => {
      this.renderRoadSections(this.store.roadSections(), this.store.layerVisibility());
    });

    effect(() => {
      this.renderObjects(this.store.infrastructureObjects(), this.store.layerVisibility());
    });

    effect(() => {
      this.renderIssues(this.store.validationIssues(), this.store.layerVisibility());
    });

    effect(() => {
      this.syncSelection(this.store.activeObject(), this.store.activeRoadSection(), this.store.selectedReferenceSegmentId());
    });

    effect(() => {
      this.zoomToValidationFocus(this.store.validationMapFocus(), this.store.selectedValidationIssueId());
    });

    effect(() => {
      this.syncGridScope(
        this.store.filteredGridGeometries(),
        this.store.gridGlobalFilter(),
        this.store.gridColumnFilters(),
        this.store.gridFilterRevision(),
        this.store.activeTableTab()
      );
    });

    effect(() => {
      this.configureEditingInteractions(this.activeTool(), this.snapEnabled());
    });
  }

  ngAfterViewInit(): void {
    if (!this.mapTarget) {
      return;
    }

    this.map = new Map({
      target: this.mapTarget.nativeElement,
      layers: [
        new TileLayer({source: new OSM()}),
        this.referenceLayer,
        this.roadSectionLayer,
        this.objectLayer,
        this.issueLayer,
        this.selectedLayer,
        this.drawingLayer
      ],
      view: new View({
        center: fromLonLat([21.0122, 52.2297]),
        zoom: 11,
        minZoom: 6,
        maxZoom: 20
      })
    });

    this.select = new Select({
      condition: click,
      layers: (layer) =>
        layer === this.objectLayer || layer === this.roadSectionLayer || layer === this.referenceLayer || layer === this.issueLayer
    });
    this.select.on('select', (event) => {
      const selected = event.selected[0] as Feature<Geometry> | undefined;
      const roadSectionId = selected?.get('roadSectionId') as string | undefined;
      const objectId = selected?.get('objectId') as string | undefined;
      const targetType = selected?.get('targetType') as string | undefined;
      const targetId = selected?.get('targetId') as string | undefined;
      const referenceSegmentId = selected?.get('referenceSegmentId') as string | undefined;

      const selectedRoadSectionId = roadSectionId ?? (targetType === 'ROAD_SECTION' ? targetId : undefined);
      const selectedObjectId = objectId ?? (targetType !== 'ROAD_SECTION' ? targetId : undefined);

      if (selectedRoadSectionId) {
        this.store.selectRoadSection(selectedRoadSectionId);
      } else if (selectedObjectId) {
        this.store.selectObject(selectedObjectId);
      } else if (referenceSegmentId) {
        this.store.selectReferenceSegment(referenceSegmentId);
      }
    });
    this.map.addInteraction(this.select);
    this.configureEditingInteractions(this.activeTool(), this.snapEnabled());

    const targetElement = this.mapTarget.nativeElement;
    this.map.on('pointermove', (event) => {
      if (this.activeTool() !== 'select') {
        targetElement.style.cursor = this.activeTool() === 'pan' ? 'grab' : 'crosshair';
        return;
      }
      const hit = this.map?.hasFeatureAtPixel(event.pixel) ?? false;
      targetElement.style.cursor = hit ? 'pointer' : '';
    });

    this.fitToAll();
  }

  ngOnDestroy(): void {
    if (this.select && this.map) {
      this.map.removeInteraction(this.select);
    }
    this.removeEditingInteractions();
    this.map?.setTarget(undefined);
  }

  clearSelection(): void {
    this.store.selectedObjectId.set(null);
    this.store.selectedRoadSectionId.set(null);
    this.selectedSource.clear();
  }

  fitToAll(): void {
    const extent = createEmpty();
    this.referenceSource.getFeatures().forEach((feature) => this.extendExtent(extent, feature));
    this.roadSectionSource.getFeatures().forEach((feature) => this.extendExtent(extent, feature));
    this.objectSource.getFeatures().forEach((feature) => this.extendExtent(extent, feature));
    this.fitExtent(extent, 15);
  }

  zoomToActive(): void {
    const activeObject = this.store.activeObject();
    const activeSection = this.store.activeRoadSection();
    const geometry = activeObject?.geometry ?? activeSection?.geometry ?? null;
    if (!geometry) {
      return;
    }
    const feature = this.featureFromGeometry(geometry, {});
    if (feature?.getGeometry()) {
      this.fitExtent(feature.getGeometry()!.getExtent(), 18);
    }
  }

  private configureEditingInteractions(tool: MapToolKind, snapEnabled: boolean): void {
    if (!this.map) {
      return;
    }

    this.removeEditingInteractions();
    this.select?.setActive(tool === 'select');

    if (tool === 'pan' || tool === 'select') {
      return;
    }

    if (tool === 'modify') {
      this.modify = new Modify({source: this.drawingSource});
      this.map.addInteraction(this.modify);
      this.addSnapInteractions(snapEnabled);
      this.toolMessage.emit('Edycja geometrii roboczej jest aktywna.');
      return;
    }

    const drawType = this.drawTypeForTool(tool);
    if (!drawType) {
      return;
    }

    this.draw = new Draw({
      source: this.drawingSource,
      type: drawType
    });
    this.draw.on('drawstart', () => this.toolMessage.emit('Rysowanie geometrii roboczej: wskazuj punkty na mapie.'));
    this.draw.on('drawend', (event) => {
      event.feature.set('draftGeometry', true);
      this.toolMessage.emit(this.drawEndMessage(tool, event.feature.getGeometry()));
    });
    this.map.addInteraction(this.draw);
    this.addSnapInteractions(snapEnabled);
  }

  private removeEditingInteractions(): void {
    if (!this.map) {
      return;
    }

    if (this.draw) {
      this.map.removeInteraction(this.draw);
      this.draw = undefined;
    }

    if (this.modify) {
      this.map.removeInteraction(this.modify);
      this.modify = undefined;
    }

    for (const snap of this.snapInteractions.splice(0)) {
      this.map.removeInteraction(snap);
    }
  }

  private addSnapInteractions(enabled: boolean): void {
    if (!enabled || !this.map) {
      return;
    }

    for (const source of [this.referenceSource, this.roadSectionSource, this.objectSource, this.drawingSource]) {
      const snap = new Snap({source});
      this.snapInteractions.push(snap);
      this.map.addInteraction(snap);
    }
  }

  private drawTypeForTool(tool: MapToolKind): 'Point' | 'LineString' | 'Polygon' | null {
    switch (tool) {
      case 'draw-point':
        return 'Point';
      case 'draw-line':
      case 'measure-line':
        return 'LineString';
      case 'draw-polygon':
      case 'measure-area':
        return 'Polygon';
      default:
        return null;
    }
  }

  private drawEndMessage(tool: MapToolKind, geometry: Geometry | undefined): string {
    if (tool === 'measure-line' && geometry instanceof LineString) {
      return `Pomiar odleglosci: ${this.formatLength(getLength(geometry))}.`;
    }

    if (tool === 'measure-area' && geometry instanceof Polygon) {
      return `Pomiar powierzchni: ${this.formatArea(getArea(geometry))}.`;
    }

    return 'Geometria robocza zostala dodana do warstwy edycyjnej mapy.';
  }

  private formatLength(lengthMeters: number): string {
    return lengthMeters >= 1000
      ? `${(lengthMeters / 1000).toFixed(3)} km`
      : `${lengthMeters.toFixed(1)} m`;
  }

  private formatArea(areaSquareMeters: number): string {
    return areaSquareMeters >= 10000
      ? `${(areaSquareMeters / 10000).toFixed(3)} ha`
      : `${areaSquareMeters.toFixed(1)} m2`;
  }

  private renderReferenceSegments(segments: ReferenceSegmentDto[], visibility: Record<string, boolean>): void {
    this.referenceSource.clear();
    if (!visibility['reference-segments']) {
      return;
    }
    for (const segment of segments) {
      const feature = this.featureFromGeometry(segment.geometry, {
        referenceSegmentId: segment.id,
        segmentCode: segment.segmentCode,
        roadNumber: segment.roadNumber,
        layerKind: 'REFERENCE_SEGMENT'
      });
      if (feature) {
        this.referenceSource.addFeature(feature);
      }
    }
  }

  private renderRoadSections(sections: RoadSectionDto[], visibility: Record<string, boolean>): void {
    this.roadSectionSource.clear();
    if (!visibility['road-sections']) {
      return;
    }
    for (const section of sections) {
      if (!section.geometry) {
        continue;
      }
      const feature = this.featureFromGeometry(section.geometry, {
        roadSectionId: section.id,
        sectionCode: section.sectionCode,
        roadNumber: section.roadNumber,
        validationStatus: section.validationStatus,
        draftStatus: section.draftStatus,
        layerKind: 'ROAD_SECTION'
      });
      if (feature) {
        this.roadSectionSource.addFeature(feature);
      }
    }
  }

  private renderObjects(objects: InfrastructureObjectDto[], visibility: Record<string, boolean>): void {
    this.objectSource.clear();
    for (const object of objects) {
      const layerCode = this.store.objectLayerCode(object);
      if (!visibility[layerCode] || !object.geometry) {
        continue;
      }
      const feature = this.featureFromGeometry(object.geometry, {
        objectId: object.id,
        objectType: object.objectType,
        objectStatus: object.status,
        validationStatus: object.validationStatus,
        draftStatus: object.draftStatus,
        geometryType: object.geometryType
      });
      if (feature) {
        this.objectSource.addFeature(feature);
      }
    }
  }

  private renderIssues(issues: ValidationIssueDto[], visibility: Record<string, boolean>): void {
    this.issueSource.clear();
    if (!visibility['validation-issues']) {
      return;
    }
    for (const issue of issues) {
      if (issue.resolved || !issue.geometryMarker) {
        continue;
      }
      const feature = this.featureFromGeometry(issue.geometryMarker, {
        issueId: issue.id,
        targetType: issue.targetType,
        targetId: issue.targetId ?? issue.objectId,
        objectId: issue.objectId,
        severity: issue.severity,
        issueType: issue.issueType
      });
      if (feature) {
        this.issueSource.addFeature(feature);
      }
    }
  }

  private syncSelection(
    object: InfrastructureObjectDto | null,
    roadSection: RoadSectionDto | null,
    referenceSegmentId: string | null
  ): void {
    this.selectedSource.clear();
    if (object?.geometry) {
      const feature = this.featureFromGeometry(object.geometry, {selectedKind: 'OBJECT'});
      if (feature) {
        this.selectedSource.addFeature(feature);
        this.fitExtent(feature.getGeometry()?.getExtent() ?? createEmpty(), 18);
      }
      return;
    }
    if (roadSection?.geometry) {
      const feature = this.featureFromGeometry(roadSection.geometry, {selectedKind: 'ROAD_SECTION'});
      if (feature) {
        this.selectedSource.addFeature(feature);
        this.fitExtent(feature.getGeometry()?.getExtent() ?? createEmpty(), 18);
      }
      return;
    }
    if (referenceSegmentId) {
      const segment = this.store.referenceSegments().find((item) => item.id === referenceSegmentId);
      const feature = segment ? this.featureFromGeometry(segment.geometry, {selectedKind: 'REFERENCE_SEGMENT'}) : null;
      if (feature) {
        this.selectedSource.addFeature(feature);
        this.fitExtent(feature.getGeometry()?.getExtent() ?? createEmpty(), 17);
      }
    }
  }

  private syncGridScope(
    geometries: GeoJsonGeometry[],
    filter: string,
    columnFilters: Record<string, string>,
    revision: number,
    tableTab: string
  ): void {
    const normalizedFilter = filter.trim();
    const activeColumnFilters = Object.entries(columnFilters).filter(([, value]) => value.trim().length > 0);
    if (!this.map || (!normalizedFilter && activeColumnFilters.length === 0)) {
      this.lastGridScopeKey = '';
      return;
    }

    const scopeKey = `${tableTab}|${normalizedFilter}|${activeColumnFilters.map(([field, value]) => `${field}:${value}`).join('|')}|${revision}|${geometries.length}`;
    if (scopeKey === this.lastGridScopeKey) {
      return;
    }

    const extent = createEmpty();
    for (const geometry of geometries) {
      const feature = this.featureFromGeometry(geometry, {});
      if (feature) {
        this.extendExtent(extent, feature);
      }
    }

    this.lastGridScopeKey = scopeKey;
    this.fitExtent(extent, 16);
  }

  private zoomToValidationFocus(geometry: GeoJsonGeometry | null, issueId: string | null): void {
    if (!issueId || !geometry) {
      return;
    }
    const feature = this.featureFromGeometry(geometry, {});
    const extent = feature?.getGeometry()?.getExtent();
    if (extent) {
      this.fitExtent(extent, 19);
    }
  }

  private featureFromGeometry(
    geometry: GeoJsonGeometry | null,
    properties: Record<string, unknown>
  ): Feature<Geometry> | null {
    if (!geometry || !geometry.type) {
      return null;
    }
    const feature = this.geoJson.readFeature({
      type: 'Feature',
      geometry,
      properties
    }, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    }) as Feature<Geometry>;
    for (const [key, value] of Object.entries(properties)) {
      feature.set(key, value);
    }
    return feature;
  }

  private extendExtent(extent: Extent, feature: Feature<Geometry>): void {
    const geometry = feature.getGeometry();
    if (geometry) {
      extend(extent, geometry.getExtent());
    }
  }

  private fitExtent(extent: Extent, maxZoom: number): void {
    if (!this.map || isEmpty(extent) || extent.some((value) => !Number.isFinite(value))) {
      return;
    }
    this.map.getView().fit(extent, {
      duration: 220,
      maxZoom,
      padding: [42, 42, 42, 42]
    });
  }

  private referenceStyle(): Style {
    return new Style({
      stroke: new Stroke({
        color: 'rgba(31, 114, 201, 0.95)',
        width: 4
      })
    });
  }

  private roadSectionStyle(feature: Feature<Geometry>): Style {
    const draftStatus = String(feature.get('draftStatus') ?? '');
    const validationStatus = String(feature.get('validationStatus') ?? '');
    const isDraft = draftStatus !== 'NIE_DOTYCZY';
    const hasProblem = validationStatus !== 'OK';
    const color = hasProblem
      ? 'rgba(199, 42, 51, 0.95)'
      : isDraft
        ? 'rgba(208, 121, 32, 0.95)'
        : 'rgba(13, 126, 112, 0.95)';

    return new Style({
      stroke: new Stroke({
        color,
        lineDash: isDraft ? [12, 7] : undefined,
        width: hasProblem ? 6 : 5
      })
    });
  }

  private objectStyle(feature: Feature<Geometry>): Style {
    const geometryType = feature.getGeometry()?.getType();
    const objectStatus = String(feature.get('objectStatus') ?? '');
    const draftStatus = String(feature.get('draftStatus') ?? '');
    const validationStatus = String(feature.get('validationStatus') ?? '');
    const objectType = String(feature.get('objectType') ?? '');
    const isDraft = draftStatus !== 'NIE_DOTYCZY';
    const hasProblem = validationStatus !== 'OK';
    const color = hasProblem
      ? 'rgba(199, 42, 51, 0.95)'
      : isDraft
        ? 'rgba(208, 121, 32, 0.95)'
        : objectStatus === 'NOWY'
          ? 'rgba(200, 25, 75, 0.92)'
          : objectType === 'ROAD_PARCEL'
            ? 'rgba(157, 78, 221, 0.9)'
            : 'rgba(35, 122, 87, 0.95)';
    const fill = objectType === 'ROAD_PARCEL' ? 'rgba(157, 78, 221, 0.22)' : 'rgba(35, 122, 87, 0.14)';

    return new Style({
      image: geometryType === 'Point'
        ? new CircleStyle({
            radius: objectType === 'TRAFFIC_COUNTING_STATION' ? 7 : 5,
            fill: new Fill({color}),
            stroke: new Stroke({color: hasProblem ? '#ffffff' : '#26313f', width: hasProblem ? 3 : 1})
          })
        : undefined,
      stroke: new Stroke({
        color,
        lineDash: isDraft ? [9, 6] : undefined,
        width: hasProblem ? 5 : 3
      }),
      fill: new Fill({color: fill})
    });
  }

  private issueStyle(): Style {
    return new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({color: 'rgba(199, 42, 51, 0.92)'}),
        stroke: new Stroke({color: '#ffffff', width: 2})
      }),
      stroke: new Stroke({
        color: 'rgba(199, 42, 51, 0.95)',
        lineDash: [4, 4],
        width: 3
      }),
      fill: new Fill({color: 'rgba(199, 42, 51, 0.16)'})
    });
  }

  private selectedStyle(): Style {
    return new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({color: 'rgba(255, 211, 90, 0.96)'}),
        stroke: new Stroke({color: '#26313f', width: 2})
      }),
      stroke: new Stroke({
        color: '#ffd35a',
        width: 6
      }),
      fill: new Fill({
        color: 'rgba(255, 211, 90, 0.2)'
      })
    });
  }

  private drawingStyle(): Style {
    return new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({color: 'rgba(37, 99, 235, 0.88)'}),
        stroke: new Stroke({color: '#ffffff', width: 2})
      }),
      stroke: new Stroke({
        color: 'rgba(37, 99, 235, 0.95)',
        lineDash: [8, 5],
        width: 3
      }),
      fill: new Fill({
        color: 'rgba(37, 99, 235, 0.14)'
      })
    });
  }
}
