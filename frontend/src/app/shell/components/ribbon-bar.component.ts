
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'rgp-ribbon-bar',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <header class="ribbon">
      <div class="title-block">
        <p class="eyebrow">Road GIS Platform / Data Management</p>
        <div class="headline-row">
          <h1>Operacyjny workspace infrastruktury drogowej</h1>
          <span class="draft-chip" [class.draft-chip--active]="hasDraft">
            {{ hasDraft ? 'Draft aktywny' : 'Tryb publikowany' }}
          </span>
        </div>
        <p class="draft-name">
          {{ draftName || 'Brak aktywnego draftu. Formularz i zapis pozostaja w trybie tylko do odczytu.' }}
        </p>
      </div>

      <div class="actions">
        <button
          pButton
          type="button"
          icon="pi pi-refresh"
          label="Odśwież"
          severity="secondary"
          [outlined]="true"
          [disabled]="loading"
          (click)="refreshClicked.emit()"
        ></button>
        <button
          pButton
          type="button"
          icon="pi pi-file-edit"
          label="Utwórz draft"
          [disabled]="loading || hasDraft"
          (click)="createDraftClicked.emit()"
        ></button>
        <button
          pButton
          type="button"
          icon="pi pi-save"
          label="Zapisz roboczo"
          severity="success"
          [disabled]="!canSave || loading"
          (click)="saveClicked.emit()"
        ></button>
      </div>
    </header>
  `,
  styles: [
    `
      .ribbon {
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 1.1rem 1.35rem 1rem;
        border-radius: var(--rgp-shell-radius);
        border: 1px solid rgba(90, 110, 121, 0.2);
        background:
          linear-gradient(90deg, rgba(255, 255, 255, 0.66), rgba(232, 238, 240, 0.92)),
          linear-gradient(120deg, rgba(15, 76, 129, 0.08), rgba(201, 123, 43, 0.12));
        box-shadow: var(--rgp-shadow);
      }

      .title-block {
        min-width: 0;
      }

      .eyebrow {
        margin: 0;
        color: var(--rgp-primary);
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .headline-row {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin-top: 0.3rem;
      }

      .headline-row h1 {
        margin: 0;
        font-size: 1.55rem;
        line-height: 1.1;
      }

      .draft-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.28rem 0.7rem;
        background: rgba(90, 110, 121, 0.12);
        color: var(--rgp-ink-muted);
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .draft-chip--active {
        background: rgba(15, 76, 129, 0.14);
        color: var(--rgp-primary-strong);
      }

      .draft-name {
        margin: 0.4rem 0 0;
        color: var(--rgp-ink-muted);
        font-size: 0.92rem;
      }

      .actions {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      @media (max-width: 1200px) {
        .ribbon {
          flex-direction: column;
        }

        .actions {
          justify-content: flex-start;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RibbonBarComponent {
  @Input({ required: true }) draftName: string | null = null;
  @Input({ required: true }) hasDraft = false;
  @Input({ required: true }) canSave = false;
  @Input({ required: true }) loading = false;

  @Output() readonly refreshClicked = new EventEmitter<void>();
  @Output() readonly createDraftClicked = new EventEmitter<void>();
  @Output() readonly saveClicked = new EventEmitter<void>();
}
