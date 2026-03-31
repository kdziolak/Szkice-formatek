
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RoadSectionRowViewModel } from '../../../shared/models/api.models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'rgp-road-section-grid',
  standalone: true,
  imports: [TableModule, TagModule],
  template: `
    <section class="panel">
      <header class="grid-header">
        <div>
          <p class="panel-eyebrow">Tabela danych</p>
          <h2>Odcinki drogowe</h2>
        </div>
        <div class="counter">{{ rows.length }} rekordów w bieżącej stronie</div>
      </header>

      <p-table
        [value]="rows"
        [loading]="loading"
        [scrollable]="true"
        scrollHeight="flex"
        styleClass="road-section-table"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Droga</th>
            <th>Odcinek</th>
            <th>Kilometraż</th>
            <th>Status</th>
            <th>Overlay</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr
            class="grid-row"
            [class.grid-row--selected]="row.businessId === selectedBusinessId"
            (click)="rowSelected.emit(row.businessId)"
          >
            <td>
              <div class="road-cell">
                <strong>{{ row.roadNumber || 'Brak' }}</strong>
                <span>{{ row.roadClassCode || 'n/d' }}</span>
              </div>
            </td>
            <td>
              <div class="road-cell">
                <strong>{{ row.sectionCode || row.businessId }}</strong>
                <span>{{ row.roadName || 'Bez nazwy' }}</span>
              </div>
            </td>
            <td class="mono">{{ row.chainageLabel }}</td>
            <td><p-tag [value]="row.statusLabel" severity="secondary"></p-tag></td>
            <td>
              <p-tag
                [value]="overlayLabel(row)"
                [severity]="overlaySeverity(row.overlayStatus)"
              ></p-tag>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5">Brak rekordów road-section dla bieżącego kontekstu.</td>
          </tr>
        </ng-template>
      </p-table>
    </section>
  `,
  styles: [
    `
      .panel {
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 1rem;
        border-radius: var(--rgp-panel-radius);
        border: 1px solid rgba(90, 110, 121, 0.18);
        background: var(--rgp-panel);
      }

      .grid-header {
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

      .counter {
        color: var(--rgp-ink-muted);
        font-family: var(--rgp-font-data);
        font-size: 0.82rem;
      }

      .grid-row {
        cursor: pointer;
        transition: background-color 140ms ease;
      }

      .grid-row:hover {
        background: rgba(15, 76, 129, 0.06);
      }

      .grid-row--selected {
        background: rgba(255, 209, 102, 0.18);
      }

      .road-cell {
        display: flex;
        flex-direction: column;
        gap: 0.16rem;
      }

      .road-cell span {
        color: var(--rgp-ink-muted);
        font-size: 0.82rem;
      }

      .mono {
        font-family: var(--rgp-font-data);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoadSectionGridComponent {
  @Input({ required: true }) rows: RoadSectionRowViewModel[] = [];
  @Input({ required: true }) loading = false;
  @Input({ required: true }) selectedBusinessId: string | null = null;

  @Output() readonly rowSelected = new EventEmitter<string>();

  overlaySeverity(status: RoadSectionRowViewModel['overlayStatus']): TagSeverity {
    switch (status) {
      case 'CREATED':
        return 'success';
      case 'UPDATED':
        return 'info';
      case 'DELETED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  overlayLabel(row: RoadSectionRowViewModel): string {
    if (row.isDraftOnly) {
      return 'Tylko draft';
    }

    switch (row.overlayStatus) {
      case 'CREATED':
        return 'Dodany';
      case 'UPDATED':
        return 'Zmieniony';
      case 'DELETED':
        return 'Do usunięcia';
      default:
        return 'Publikowany';
    }
  }
}
