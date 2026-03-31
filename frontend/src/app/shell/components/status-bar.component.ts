
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'rgp-status-bar',
  standalone: true,
  imports: [],
  template: `
    <footer class="status-bar">
      <div class="status-slot">
        <span class="label">Widok</span>
        <strong>Mapa + tabela + formularz</strong>
      </div>
      <div class="status-slot">
        <span class="label">Draft</span>
        <strong>{{ activeDraftName || 'Brak' }}</strong>
      </div>
      <div class="status-slot">
        <span class="label">Zaznaczenie</span>
        <strong>{{ selectedLabel || 'Brak obiektu' }}</strong>
      </div>
      <div class="status-slot">
        <span class="label">Rekordy</span>
        <strong>{{ totalRows }}</strong>
      </div>
      <div class="status-slot">
        <span class="label">Overlay</span>
        <strong>{{ overlayCount }}</strong>
      </div>
      <div class="status-slot" [class.status-slot--warning]="formDirty">
        <span class="label">Stan formularza</span>
        <strong>{{ formDirty ? 'Niezapisane zmiany' : 'Zsynchronizowany' }}</strong>
      </div>
    </footer>
  `,
  styles: [
    `
      .status-bar {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 1px;
        overflow: hidden;
        border-radius: 12px;
        border: 1px solid rgba(90, 110, 121, 0.2);
        background: rgba(90, 110, 121, 0.16);
      }

      .status-slot {
        display: flex;
        flex-direction: column;
        gap: 0.14rem;
        padding: 0.55rem 0.85rem;
        background: rgba(243, 246, 247, 0.94);
        font-family: var(--rgp-font-data);
      }

      .status-slot--warning {
        background: rgba(201, 123, 43, 0.18);
      }

      .label {
        color: var(--rgp-ink-muted);
        font-size: 0.69rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      strong {
        font-size: 0.82rem;
      }

      @media (max-width: 1200px) {
        .status-bar {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBarComponent {
  @Input({ required: true }) activeDraftName: string | null = null;
  @Input({ required: true }) selectedLabel: string | null = null;
  @Input({ required: true }) totalRows = 0;
  @Input({ required: true }) overlayCount = 0;
  @Input({ required: true }) formDirty = false;
}
