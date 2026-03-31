
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import {
  RoadSectionComparisonViewModel,
  RoadSectionFormValue
} from '../../../shared/models/api.models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'rgp-road-section-form-panel',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TagModule],
  template: `
    <section class="panel">
      <header class="form-header">
        <div>
          <p class="panel-eyebrow">Formularz obiektu</p>
          <h2>Road-section</h2>
        </div>
        <p-tag [value]="overlayLabel()" [severity]="overlaySeverity()"></p-tag>
      </header>

      @if (comparison) {
        <div class="comparison-strip">
          <article>
            <span>Published</span>
            <strong>{{ comparison.published?.sectionCode || 'Brak' }}</strong>
            <small>{{ comparison.published?.lifecycleStatus || 'n/d' }}</small>
          </article>
          <article>
            <span>Working</span>
            <strong>{{ comparison.working?.sectionCode || 'Brak' }}</strong>
            <small>{{ comparison.working?.lifecycleStatus || 'n/d' }}</small>
          </article>
        </div>
        <form class="form-body rgp-scrollbar" [formGroup]="form">
          <label>
            <span>Numer drogi</span>
            <input pInputText formControlName="roadNumber" />
          </label>
          <label>
            <span>Klasa drogi</span>
            <input pInputText formControlName="roadClassCode" />
          </label>
          <label>
            <span>Nazwa drogi</span>
            <input pInputText formControlName="roadName" />
          </label>
          <label>
            <span>Kod odcinka</span>
            <input pInputText formControlName="sectionCode" />
          </label>
          <label>
            <span>Odcinek referencyjny</span>
            <input pInputText formControlName="referenceSegmentBusinessId" />
          </label>
          <div class="chainage-row">
            <label>
              <span>Km od</span>
              <input type="number" step="0.001" formControlName="chainageFrom" />
            </label>
            <label>
              <span>Km do</span>
              <input type="number" step="0.001" formControlName="chainageTo" />
            </label>
          </div>
          <label>
            <span>Status cyklu życia</span>
            <select formControlName="lifecycleStatus">
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
        </form>
        <footer class="form-actions">
          <p class="mode-note">
            {{ editable
            ? 'Zmiany zostaną zapisane jako snapshot roboczy w aktywnym drafcie.'
            : 'Brak aktywnego draftu. Formularz pozostaje w trybie tylko do odczytu.' }}
          </p>
          <button
            pButton
            type="button"
            label="Przywróć"
            severity="secondary"
            [outlined]="true"
            [disabled]="!editable || loading || saving"
            (click)="resetRequested.emit()"
          ></button>
          <button
            pButton
            type="button"
            label="Zapisz roboczo"
            severity="success"
            [disabled]="!editable || form.invalid || loading || saving"
            (click)="onSave()"
          ></button>
        </footer>
      } @else {
        <div class="empty-state">
          <span class="pi pi-map"></span>
          <p>Wybierz odcinek z tabeli albo z mapy, aby otworzyć formularz obiektu.</p>
        </div>
      }

    </section>
    `,
  styles: [
    `
      .panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 1rem;
        border-radius: var(--rgp-panel-radius);
        border: 1px solid rgba(90, 110, 121, 0.18);
        background: var(--rgp-panel);
      }

      .form-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
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

      .comparison-strip {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 1rem 0 0.8rem;
      }

      .comparison-strip article {
        border-radius: 12px;
        padding: 0.7rem 0.85rem;
        background: rgba(255, 255, 255, 0.64);
      }

      .comparison-strip span,
      .comparison-strip small,
      .mode-note {
        color: var(--rgp-ink-muted);
      }

      .comparison-strip strong {
        display: block;
        margin-top: 0.12rem;
      }

      .form-body {
        display: grid;
        gap: 0.8rem;
        min-height: 0;
        overflow: auto;
        padding-right: 0.2rem;
      }

      .form-body label {
        display: grid;
        gap: 0.34rem;
      }

      .form-body span {
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .form-body input,
      .form-body select {
        width: 100%;
        border: 1px solid rgba(90, 110, 121, 0.25);
        border-radius: 10px;
        padding: 0.7rem 0.75rem;
        background: rgba(255, 255, 255, 0.85);
        color: var(--rgp-ink);
      }

      .chainage-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .form-actions {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin-top: 1rem;
      }

      .mode-note {
        margin: 0 auto 0 0;
        max-width: 28ch;
        font-size: 0.82rem;
      }

      .empty-state {
        display: grid;
        place-items: center;
        gap: 0.8rem;
        flex: 1;
        min-height: 240px;
        text-align: center;
        color: var(--rgp-ink-muted);
      }

      .empty-state .pi {
        font-size: 2rem;
        color: var(--rgp-primary);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoadSectionFormPanelComponent implements OnChanges {
  @Input({ required: true }) comparison: RoadSectionComparisonViewModel | null = null;
  @Input({ required: true }) editable = false;
  @Input({ required: true }) loading = false;
  @Input({ required: true }) saving = false;

  @Output() readonly saveRequested = new EventEmitter<RoadSectionFormValue>();
  @Output() readonly resetRequested = new EventEmitter<void>();

  protected readonly form = new FormGroup({
    roadNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    roadClassCode: new FormControl('', { nonNullable: true }),
    roadName: new FormControl('', { nonNullable: true }),
    sectionCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    referenceSegmentBusinessId: new FormControl('', { nonNullable: true }),
    chainageFrom: new FormControl<number | null>(null),
    chainageTo: new FormControl<number | null>(null),
    lifecycleStatus: new FormControl('PUBLISHED', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comparison']) {
      const working = this.comparison?.working;
      if (!working) {
        this.form.reset({
          roadNumber: '',
          roadClassCode: '',
          roadName: '',
          sectionCode: '',
          referenceSegmentBusinessId: '',
          chainageFrom: null,
          chainageTo: null,
          lifecycleStatus: 'PUBLISHED'
        });
      } else {
        this.form.patchValue({
          roadNumber: working.roadNumber ?? '',
          roadClassCode: working.roadClassCode ?? '',
          roadName: working.roadName ?? '',
          sectionCode: working.sectionCode ?? '',
          referenceSegmentBusinessId: working.referenceSegmentBusinessId ?? '',
          chainageFrom: working.chainageFrom,
          chainageTo: working.chainageTo,
          lifecycleStatus: working.lifecycleStatus ?? 'PUBLISHED'
        });
      }
    }

    if (this.editable) {
      this.form.enable({ emitEvent: false });
    } else {
      this.form.disable({ emitEvent: false });
    }
  }

  overlayLabel(): string {
    switch (this.comparison?.overlayStatus) {
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

  overlaySeverity(): TagSeverity {
    switch (this.comparison?.overlayStatus) {
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

  onSave(): void {
    if (this.form.invalid || !this.editable) {
      return;
    }

    const value = this.form.getRawValue();
    this.saveRequested.emit({
      roadNumber: value.roadNumber,
      roadClassCode: value.roadClassCode,
      roadName: value.roadName,
      sectionCode: value.sectionCode,
      referenceSegmentBusinessId: value.referenceSegmentBusinessId,
      chainageFrom: value.chainageFrom,
      chainageTo: value.chainageTo,
      lifecycleStatus: value.lifecycleStatus
    });
  }
}
