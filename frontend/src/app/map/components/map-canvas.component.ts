
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { boundingExtent } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control';
import { addProjection } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import {
  MapFeatureViewModel,
  OverlayStatus,
  ViewportState
} from '../../shared/models/api.models';

@Component({
  selector: 'rgp-map-canvas',
  standalone: true,
  imports: [],
  template: `
    <section class="map-panel">
      <header class="map-header">
        <div>
          <p class="panel-eyebrow">Mapa operacyjna</p>
          <h2>Overlay publikowany + roboczy</h2>
        </div>
        <span class="map-hint">REST vector source / EPSG:2180</span>
      </header>

      <div #mapHost class="map-host"></div>
    </section>
  `,
  styles: [
    `
      .map-panel {
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 1rem;
        border-radius: var(--rgp-panel-radius);
        border: 1px solid rgba(90, 110, 121, 0.18);
        background: var(--rgp-panel);
      }

      .map-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.85rem;
      }

      .panel-eyebrow {
        margin: 0 0 0.25rem;
        color: var(--rgp-primary);
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      h2 {
        margin: 0;
      }

      .map-hint {
        color: var(--rgp-ink-muted);
        font-family: var(--rgp-font-data);
        font-size: 0.76rem;
      }

      .map-host {
        position: relative;
        min-height: 100%;
        flex: 1;
        overflow: hidden;
        border-radius: 14px;
        background:
          linear-gradient(0deg, rgba(28, 59, 72, 0.08), rgba(28, 59, 72, 0.08)),
          linear-gradient(transparent 49%, rgba(20, 48, 60, 0.08) 50%, transparent 51%),
          linear-gradient(90deg, transparent 49%, rgba(20, 48, 60, 0.08) 50%, transparent 51%),
          linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(228, 236, 238, 0.92));
        background-size: auto, 64px 64px, 64px 64px, auto;
      }

      :host ::ng-deep .ol-viewport {
        border-radius: 14px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) publishedFeatures: MapFeatureViewModel[] = [];
  @Input({ required: true }) draftFeatures: MapFeatureViewModel[] = [];
  @Input({ required: true }) referenceFeatures: MapFeatureViewModel[] = [];
  @Input({ required: true }) selectedBusinessId: string | null = null;
  @Input({ required: true }) publishedVisible = true;
  @Input({ required: true }) draftVisible = true;
  @Input({ required: true }) referenceVisible = false;

  @Output() readonly featureSelected = new EventEmitter<string>();
  @Output() readonly viewportChanged = new EventEmitter<ViewportState>();

  @ViewChild('mapHost', { static: true }) private readonly mapHost?: ElementRef<HTMLDivElement>;

  private readonly geoJson = new GeoJSON();
  private readonly projection = new Projection({
    code: 'EPSG:2180',
    units: 'm',
    extent: [-1000000, -1000000, 2000000, 2000000]
  });
  private readonly publishedSource = new VectorSource();
  private readonly draftSource = new VectorSource();
  private readonly referenceSource = new VectorSource();
  private readonly publishedLayer = new VectorLayer({
    source: this.publishedSource,
    zIndex: 10,
    style: (feature) => this.createStyle(feature as Feature, 'published')
  });
  private readonly draftLayer = new VectorLayer({
    source: this.draftSource,
    zIndex: 20,
    style: (feature) => this.createStyle(feature as Feature, 'draft')
  });
  private readonly referenceLayer = new VectorLayer({
    source: this.referenceSource,
    zIndex: 5,
    style: (feature) => this.createStyle(feature as Feature, 'reference')
  });
  private map?: Map;
  private view?: View;
  private hasFitted = false;

  constructor() {
    addProjection(this.projection);
  }

  ngAfterViewInit(): void {
    this.view = new View({
      projection: this.projection,
      center: [500000, 500000],
      zoom: 4,
      minZoom: 2,
      maxZoom: 18
    });

    this.map = new Map({
      target: this.mapHost?.nativeElement,
      controls: defaultControls({ rotate: false, attribution: false }),
      layers: [this.referenceLayer, this.publishedLayer, this.draftLayer],
      view: this.view
    });

    this.map.on('singleclick', (event) => {
      const feature = this.map?.forEachFeatureAtPixel(
        event.pixel,
        (candidate) => candidate as Feature,
        { hitTolerance: 6 }
      );

      if (feature) {
        this.featureSelected.emit(String(feature.getId() ?? feature.get('businessId')));
      }
    });

    this.map.on('moveend', () => this.emitViewport());

    this.rebuildLayers();
    queueMicrotask(() => this.emitViewport());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) {
      return;
    }

    if (
      changes['publishedFeatures'] ||
      changes['draftFeatures'] ||
      changes['referenceFeatures'] ||
      changes['publishedVisible'] ||
      changes['draftVisible'] ||
      changes['referenceVisible']
    ) {
      this.rebuildLayers();
    } else if (changes['selectedBusinessId']) {
      this.referenceLayer.changed();
      this.publishedLayer.changed();
      this.draftLayer.changed();
    }
  }

  ngOnDestroy(): void {
    this.map?.setTarget(undefined);
  }

  private rebuildLayers(): void {
    this.referenceLayer.setVisible(this.referenceVisible);
    this.publishedLayer.setVisible(this.publishedVisible);
    this.draftLayer.setVisible(this.draftVisible);

    this.replaceSourceData(this.referenceSource, this.referenceFeatures);
    this.replaceSourceData(this.publishedSource, this.publishedFeatures);
    this.replaceSourceData(this.draftSource, this.draftFeatures);

    if (!this.hasFitted) {
      const coordinates = this.collectCoordinates([
        ...this.referenceFeatures,
        ...this.publishedFeatures,
        ...this.draftFeatures
      ]);

      if (coordinates.length > 0) {
        this.view?.fit(boundingExtent(coordinates), {
          duration: 0,
          padding: [32, 32, 32, 32],
          maxZoom: 15
        });
        this.hasFitted = true;
      }
    }

    this.referenceLayer.changed();
    this.publishedLayer.changed();
    this.draftLayer.changed();
  }

  private replaceSourceData(source: VectorSource, features: MapFeatureViewModel[]): void {
    const collection = {
      type: 'FeatureCollection',
      features: features
        .filter((feature) => feature.geometry !== null)
        .map((feature) => ({
          type: 'Feature',
          id: feature.businessId,
          properties: {
            businessId: feature.businessId,
            label: feature.label,
            overlayStatus: feature.overlayStatus,
            draftOnly: feature.draftOnly
          },
          geometry: feature.geometry
        }))
    };

    source.clear(true);
    source.addFeatures(
      this.geoJson.readFeatures(collection, {
        dataProjection: this.projection,
        featureProjection: this.projection
      })
    );
  }

  private collectCoordinates(features: MapFeatureViewModel[]): number[][] {
    const coordinates: number[][] = [];

    features.forEach((feature) => {
      const geometry = feature.geometry;
      if (!geometry) {
        return;
      }

      const stack: unknown[] = [geometry.coordinates];
      while (stack.length > 0) {
        const current = stack.pop();
        if (!Array.isArray(current)) {
          continue;
        }

        if (
          current.length >= 2 &&
          typeof current[0] === 'number' &&
          typeof current[1] === 'number'
        ) {
          coordinates.push([current[0], current[1]]);
          continue;
        }

        current.forEach((value) => stack.push(value));
      }
    });

    return coordinates;
  }

  private emitViewport(): void {
    if (!this.map || !this.view) {
      return;
    }

    const size = this.map.getSize();
    if (!size) {
      return;
    }

    const extent = this.view.calculateExtent(size);
    const scaleDenominator = (this.view.getResolution() ?? 1) / 0.00028;

    this.viewportChanged.emit({
      bbox: `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`,
      scaleDenominator
    });
  }

  private createStyle(
    feature: Feature,
    sourceKind: 'published' | 'draft' | 'reference'
  ): Style | Style[] {
    const geometryType = feature.getGeometry()?.getType();
    const overlayStatus = feature.get('overlayStatus') as OverlayStatus;
    const isSelected = `${feature.getId() ?? ''}` === this.selectedBusinessId;
    const palette = this.resolvePalette(sourceKind, overlayStatus);

    if (geometryType === 'Point' || geometryType === 'MultiPoint') {
      return new Style({
        image: new CircleStyle({
          radius: isSelected ? 8 : 6,
          fill: new Fill({ color: palette.fill }),
          stroke: new Stroke({
            color: isSelected ? 'rgba(255, 209, 102, 1)' : palette.stroke,
            width: isSelected ? 3 : 2
          })
        })
      });
    }

    const lineStyle = new Style({
      stroke: new Stroke({
        color: palette.stroke,
        width: palette.width,
        lineDash: palette.lineDash
      }),
      fill: new Fill({ color: palette.fill })
    });

    if (!isSelected) {
      return lineStyle;
    }

    return [
      new Style({
        stroke: new Stroke({
          color: 'rgba(255, 209, 102, 0.9)',
          width: 9
        })
      }),
      lineStyle
    ];
  }

  private resolvePalette(
    sourceKind: 'published' | 'draft' | 'reference',
    overlayStatus: OverlayStatus
  ) {
    if (sourceKind === 'reference') {
      return {
        stroke: '#6c8797',
        fill: 'rgba(108, 135, 151, 0.04)',
        width: 2,
        lineDash: [8, 10] as number[]
      };
    }

    if (sourceKind === 'published') {
      return {
        stroke: '#637c91',
        fill: 'rgba(99, 124, 145, 0.18)',
        width: 4,
        lineDash: undefined as number[] | undefined
      };
    }

    switch (overlayStatus) {
      case 'CREATED':
        return {
          stroke: '#2f7d32',
          fill: 'rgba(47, 125, 50, 0.16)',
          width: 5,
          lineDash: undefined
        };
      case 'DELETED':
        return {
          stroke: '#b85c38',
          fill: 'rgba(184, 92, 56, 0.12)',
          width: 5,
          lineDash: [14, 8]
        };
      default:
        return {
          stroke: '#0f4c81',
          fill: 'rgba(15, 76, 129, 0.12)',
          width: 5,
          lineDash: undefined
        };
    }
  }
}
