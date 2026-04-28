import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { LineString, Point, Polygon } from 'ol/geom';
import type Geometry from 'ol/geom/Geometry';
import { Draw, Select } from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import type { Coordinate } from 'ol/coordinate';

import { ObjectGeometry, ObjectGeometryType, RoadObject } from '../core/object-entry.models';
import { ObjectEntryWorkspaceStore } from '../state/object-entry-workspace.store';

@Component({
  selector: 'rgp-object-entry-map',
  standalone: true,
  template: `
    <section class="map-frame" aria-label="Mapa GIS wprowadzania obiektow">
      <div class="map-toolbar">
        <span class="tool-label">OpenLayers / EPSG:3857</span>
        <span class="tool-chip">published</span>
        <span class="tool-chip draft">draft overlay</span>
        <span class="tool-chip selected">selekcja</span>
      </div>
      <div #mapHost class="map-host"></div>
      <div class="map-hint">
        <strong>Narzedzie:</strong>
        <span>{{ toolLabel() }}</span>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 0;
        height: 100%;
      }

      .map-frame {
        position: relative;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        border: 1px solid rgb(24 34 47 / 22%);
        background:
          radial-gradient(circle at 16% 12%, rgb(255 255 255 / 65%), transparent 24%),
          linear-gradient(135deg, #c9d2c7, #a7b9b1 48%, #d2c9b4);
        box-shadow: inset 0 0 0 1px rgb(255 255 255 / 32%);
      }

      .map-host {
        height: 100%;
      }

      .map-toolbar,
      .map-hint {
        position: absolute;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border: 1px solid rgb(21 33 47 / 20%);
        background: rgb(247 245 239 / 92%);
        color: #233140;
        box-shadow: 0 10px 30px rgb(0 0 0 / 12%);
        backdrop-filter: blur(8px);
      }

      .map-toolbar {
        top: 0.75rem;
        left: 0.75rem;
        padding: 0.45rem 0.6rem;
      }

      .map-hint {
        right: 0.75rem;
        bottom: 0.75rem;
        padding: 0.5rem 0.75rem;
      }

      .tool-label {
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .tool-chip {
        border-radius: 999px;
        border: 1px solid #53606d;
        padding: 0.1rem 0.45rem;
        font-size: 0.72rem;
        text-transform: uppercase;
      }

      .tool-chip.draft {
        border-color: var(--rgp-draft);
        color: #8f4f12;
      }

      .tool-chip.selected {
        border-color: var(--rgp-reference);
        color: var(--rgp-reference);
      }
    `,
  ],
})
export class ObjectEntryMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapHost', { static: true })
  private readonly mapHost!: ElementRef<HTMLDivElement>;

  private readonly store = inject(ObjectEntryWorkspaceStore);
  private readonly publishedSource = new VectorSource<Feature<Geometry>>();
  private readonly draftSource = new VectorSource<Feature<Geometry>>();
  private readonly selectionSource = new VectorSource<Feature<Geometry>>();
  private readonly publishedLayer = new VectorLayer({
    source: this.publishedSource,
    style: (feature) => this.styleForFeature(feature.get('geometryType') as ObjectGeometryType, false),
  });
  private readonly draftLayer = new VectorLayer({
    source: this.draftSource,
    style: (feature) => this.styleForFeature(feature.get('geometryType') as ObjectGeometryType, true),
  });
  private readonly selectionLayer = new VectorLayer({
    source: this.selectionSource,
    style: (feature) => this.selectedStyleForFeature(feature.get('geometryType') as ObjectGeometryType),
  });
  private map: Map | null = null;
  private drawInteraction: Draw | null = null;
  private selectInteraction: Select | null = null;
  private readonly syncMapEffect = effect(() => {
    const objects = this.store.objects();
    const activeObject = this.store.activeObject();
    const activeTool = this.store.activeGeometryTool();

    if (!this.map) {
      return;
    }

    this.renderObjects(objects, activeObject?.id ?? null);
    this.configureDrawInteraction(activeTool);
  });

  ngAfterViewInit(): void {
    this.map = new Map({
      target: this.mapHost.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        this.publishedLayer,
        this.draftLayer,
        this.selectionLayer,
      ],
      view: new View({
        center: fromLonLat([19.15, 52.1]),
        zoom: 6,
      }),
      controls: [],
    });

    this.selectInteraction = new Select({
      layers: [this.publishedLayer, this.draftLayer],
      style: null,
    });
    this.selectInteraction.on('select', (event) => {
      const selectedFeature = event.selected[0];
      const objectId = selectedFeature?.get('objectId') as string | undefined;

      if (objectId) {
        this.store.selectObject(objectId);
      }
    });
    this.map.addInteraction(this.selectInteraction);

    this.renderObjects(this.store.objects(), this.store.activeObject()?.id ?? null);
    this.fitToCurrentObjects();
  }

  ngOnDestroy(): void {
    this.syncMapEffect.destroy();
    if (this.map && this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
    }
    if (this.map && this.selectInteraction) {
      this.map.removeInteraction(this.selectInteraction);
    }
    this.map?.setTarget(undefined);
  }

  toolLabel(): string {
    const activeTool = this.store.activeGeometryTool();

    switch (activeTool) {
      case 'point':
        return 'rysowanie punktu';
      case 'line':
        return 'rysowanie linii';
      case 'polygon':
        return 'rysowanie powierzchni';
      case 'select':
        return 'selekcja obiektow';
      default:
        return 'brak aktywnego narzedzia';
    }
  }

  private renderObjects(objects: RoadObject[], activeObjectId: string | null): void {
    this.publishedSource.clear();
    this.draftSource.clear();
    this.selectionSource.clear();

    for (const roadObject of objects) {
      const feature = this.featureFromRoadObject(roadObject);
      if (!feature) {
        continue;
      }

      if (roadObject.lifecycleStatus === 'published') {
        this.publishedSource.addFeature(feature);
      } else {
        this.draftSource.addFeature(feature);
      }

      if (roadObject.id === activeObjectId) {
        const selectedFeature = this.featureFromRoadObject(roadObject);
        if (selectedFeature) {
          this.selectionSource.addFeature(selectedFeature);
        }
      }
    }
  }

  private configureDrawInteraction(activeTool: ObjectGeometryType | 'select' | null): void {
    if (!this.map) {
      return;
    }

    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
      this.drawInteraction = null;
    }

    if (!activeTool || activeTool === 'select') {
      return;
    }

    this.drawInteraction = new Draw({
      source: this.draftSource,
      type: toOpenLayersGeometryType(activeTool),
    });

    this.drawInteraction.on('drawend', (event) => {
      const geometry = event.feature.getGeometry();
      if (!geometry) {
        return;
      }

      void this.store.saveGeometry(toObjectGeometry(geometry));
    });

    this.map.addInteraction(this.drawInteraction);
  }

  private featureFromRoadObject(roadObject: RoadObject): Feature<Geometry> | null {
    if (!hasVisibleGeometry(roadObject.geometry)) {
      return null;
    }

    const geometry = toOpenLayersGeometry(roadObject.geometry);
    const feature = new Feature<Geometry>({
      geometry,
    });
    feature.set('objectId', roadObject.id);
    feature.set('geometryType', roadObject.geometryType);
    feature.set('lifecycleStatus', roadObject.lifecycleStatus);

    return feature;
  }

  private fitToCurrentObjects(): void {
    const extent = this.publishedSource.getExtent();
    if (!this.map || !extent || extent.some((value) => !Number.isFinite(value))) {
      return;
    }

    this.map.getView().fit(extent, {
      duration: 450,
      maxZoom: 11,
      padding: [72, 72, 72, 72],
    });
  }

  private styleForFeature(geometryType: ObjectGeometryType, isDraft: boolean): Style {
    const strokeColor = isDraft ? '#c87922' : geometryType === 'point' ? '#244f8f' : '#303845';
    const fillColor = isDraft ? 'rgba(200, 121, 34, 0.22)' : 'rgba(38, 99, 107, 0.16)';

    if (geometryType === 'point') {
      return new Style({
        image: new CircleStyle({
          radius: isDraft ? 8 : 6,
          fill: new Fill({ color: isDraft ? '#f2a444' : '#2c6ba4' }),
          stroke: new Stroke({ color: '#f7f5ef', width: 2 }),
        }),
      });
    }

    return new Style({
      stroke: new Stroke({
        color: strokeColor,
        width: geometryType === 'line' ? 4 : 2,
        lineDash: isDraft ? [10, 6] : undefined,
      }),
      fill: new Fill({
        color: fillColor,
      }),
    });
  }

  private selectedStyleForFeature(geometryType: ObjectGeometryType): Style {
    if (geometryType === 'point') {
      return new Style({
        image: new CircleStyle({
          radius: 11,
          fill: new Fill({ color: 'rgba(38, 99, 107, 0.25)' }),
          stroke: new Stroke({ color: '#112f35', width: 3 }),
        }),
      });
    }

    return new Style({
      stroke: new Stroke({
        color: '#112f35',
        width: geometryType === 'line' ? 7 : 4,
      }),
      fill: new Fill({
        color: 'rgba(38, 99, 107, 0.24)',
      }),
    });
  }
}

function toOpenLayersGeometryType(geometryType: ObjectGeometryType): 'Point' | 'LineString' | 'Polygon' {
  switch (geometryType) {
    case 'point':
      return 'Point';
    case 'line':
      return 'LineString';
    case 'polygon':
      return 'Polygon';
  }
}

function toOpenLayersGeometry(geometry: ObjectGeometry): Geometry {
  switch (geometry.type) {
    case 'point':
      return new Point(geometry.coordinates);
    case 'line':
      return new LineString(geometry.coordinates);
    case 'polygon':
      return new Polygon([geometry.coordinates]);
  }
}

function toObjectGeometry(geometry: Geometry): ObjectGeometry {
  if (geometry instanceof Point) {
    return {
      type: 'point',
      srid: 3857,
      coordinates: geometry.getCoordinates() as [number, number],
    };
  }

  if (geometry instanceof LineString) {
    return {
      type: 'line',
      srid: 3857,
      coordinates: cloneCoordinates(geometry.getCoordinates()),
    };
  }

  if (geometry instanceof Polygon) {
    return {
      type: 'polygon',
      srid: 3857,
      coordinates: cloneCoordinates(geometry.getCoordinates()[0] ?? []),
    };
  }

  throw new Error(`Unsupported geometry type "${geometry.getType()}".`);
}

function cloneCoordinates(coordinates: Coordinate[]): Array<[number, number]> {
  return coordinates.map((coordinate) => [coordinate[0], coordinate[1]]);
}

function hasVisibleGeometry(geometry: ObjectGeometry): boolean {
  if (geometry.type === 'point') {
    return !(geometry.coordinates[0] === 0 && geometry.coordinates[1] === 0);
  }

  const distinctVertices = new Set(geometry.coordinates.map(([x, y]) => `${x}:${y}`));
  return geometry.type === 'line'
    ? geometry.coordinates.length >= 2 && distinctVertices.size >= 2
    : geometry.coordinates.length >= 4 && distinctVertices.size >= 3;
}
