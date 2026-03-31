
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LayerViewModel } from '../../../shared/models/api.models';

@Component({
  selector: 'rgp-layer-tree-panel',
  standalone: true,
  imports: [],
  template: `
    <section class="panel">
      <header class="panel-header">
        <p class="panel-eyebrow">Warstwy robocze</p>
        <h2>Drzewo warstw</h2>
      </header>

      <div class="layer-list rgp-scrollbar">
        @for (layer of layers; track layer) {
          <label
            class="layer-row"
            [class.layer-row--editable]="layer.editable"
            [class.layer-row--active]="layer.id === activeEditableLayerId"
            >
            <input
              type="checkbox"
              [checked]="layer.visible"
              (change)="toggleLayer.emit(layer.id)"
              />
              <div class="layer-meta">
                <div class="layer-line">
                  <strong>{{ layer.label }}</strong>
                  <span class="type-pill">{{ layer.layerType }}</span>
                </div>
                <span class="layer-desc">
                  {{ layer.editable ? 'Warstwa edycyjna' : 'Warstwa kontekstowa / publikowana' }}
                </span>
              </div>
            </label>
          }
        </div>

        <section class="legend">
          <h3>Legenda overlayu</h3>
          <ul>
            <li><span class="legend-swatch legend-swatch--published"></span> Publikowany</li>
            <li><span class="legend-swatch legend-swatch--updated"></span> Zmieniony w drafcie</li>
            <li><span class="legend-swatch legend-swatch--created"></span> Dodany w drafcie</li>
            <li><span class="legend-swatch legend-swatch--deleted"></span> Oznaczony do usuniecia</li>
          </ul>
        </section>
      </section>
    `,
  styles: [
    `
      .panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
        padding: 1rem;
        border-radius: var(--rgp-panel-radius);
        border: 1px solid rgba(90, 110, 121, 0.18);
        background: var(--rgp-panel);
      }

      .panel-header h2,
      .legend h3 {
        margin: 0;
      }

      .panel-eyebrow {
        margin: 0 0 0.25rem;
        color: var(--rgp-primary);
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .layer-list {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        min-height: 0;
        overflow: auto;
      }

      .layer-row {
        display: flex;
        align-items: flex-start;
        gap: 0.8rem;
        border-radius: 12px;
        border: 1px solid transparent;
        padding: 0.75rem 0.8rem;
        background: rgba(255, 255, 255, 0.65);
        cursor: pointer;
      }

      .layer-row--editable {
        border-color: rgba(15, 76, 129, 0.18);
      }

      .layer-row--active {
        background: rgba(15, 76, 129, 0.1);
        border-color: rgba(15, 76, 129, 0.28);
      }

      .layer-line {
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }

      .type-pill {
        border-radius: 999px;
        padding: 0.14rem 0.5rem;
        background: rgba(90, 110, 121, 0.12);
        color: var(--rgp-ink-muted);
        font-size: 0.68rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .layer-desc {
        display: block;
        margin-top: 0.22rem;
        color: var(--rgp-ink-muted);
        font-size: 0.82rem;
      }

      .legend {
        margin-top: auto;
        border-top: 1px solid rgba(90, 110, 121, 0.16);
        padding-top: 0.85rem;
      }

      .legend ul {
        display: grid;
        gap: 0.5rem;
        padding: 0;
        margin: 0.75rem 0 0;
        list-style: none;
      }

      .legend li {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        font-size: 0.85rem;
      }

      .legend-swatch {
        width: 1.9rem;
        height: 0.45rem;
        border-radius: 999px;
      }

      .legend-swatch--published {
        background: #637c91;
      }

      .legend-swatch--updated {
        background: #0f4c81;
      }

      .legend-swatch--created {
        background: #2f7d32;
      }

      .legend-swatch--deleted {
        background: repeating-linear-gradient(
          90deg,
          #b85c38 0 7px,
          rgba(184, 92, 56, 0.12) 7px 12px
        );
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerTreePanelComponent {
  @Input({ required: true }) layers: LayerViewModel[] = [];
  @Input({ required: true }) activeEditableLayerId: string | null = null;

  @Output() readonly toggleLayer = new EventEmitter<string>();
}
