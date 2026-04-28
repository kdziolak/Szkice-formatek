import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

import {LifecycleBadgeKind} from '../../core/road-infra-gis.models';

interface StatusBadgeViewModel {
  icon: string;
  label: string;
  kind: LifecycleBadgeKind;
}

@Component({
  selector: 'rgp-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input() kind: 'status' | 'validationStatus' | 'draftStatus' | string = 'status';
  @Input() value: string | number | null = null;

  get badge(): StatusBadgeViewModel {
    const value = String(this.value ?? '');
    if (this.kind === 'validationStatus') {
      return this.validationBadge(value);
    }
    if (this.kind === 'draftStatus') {
      return this.draftBadge(value);
    }
    return this.lifecycleBadge(value);
  }

  private validationBadge(value: string): StatusBadgeViewModel {
    const normalized = this.normalize(value);
    if (normalized === 'BLOCKER' || normalized === 'BLOCKING' || normalized === 'ERROR' || normalized === 'BLAD') {
      return {icon: 'pi pi-ban', label: 'Blokujacy', kind: 'danger'};
    }
    if (normalized === 'WARNING' || normalized === 'WARN' || normalized === 'OSTRZEZENIE') {
      return {icon: 'pi pi-exclamation-triangle', label: 'Ostrzezenie', kind: 'warning'};
    }
    if (normalized === 'OK' || normalized === 'VALID') {
      return {icon: 'pi pi-check-circle', label: 'Poprawny', kind: 'published'};
    }
    if (normalized === 'NIE_DOTYCZY') {
      return {icon: 'pi pi-minus-circle', label: 'Nie dotyczy', kind: 'neutral'};
    }
    return {icon: 'pi pi-info-circle', label: this.humanize(value, 'Nieznany'), kind: 'neutral'};
  }

  private draftBadge(value: string): StatusBadgeViewModel {
    const normalized = this.normalize(value);
    switch (normalized) {
      case 'DODANY_DO_WERSJI_ROBOCZEJ':
        return {icon: 'pi pi-plus-circle', label: 'Nowy draft', kind: 'draft'};
      case 'W_MODYFIKACJI':
        return {icon: 'pi pi-pencil', label: 'W modyfikacji', kind: 'modified'};
      case 'ZAPISANY_W_WERSJI_ROBOCZEJ':
        return {icon: 'pi pi-save', label: 'Zapisany draft', kind: 'draft'};
      case 'GOTOWY_DO_WALIDACJI':
        return {icon: 'pi pi-verified', label: 'Do walidacji', kind: 'ready'};
      case 'GOTOWY_DO_ZAPISU_FINALNEGO':
        return {icon: 'pi pi-send', label: 'Do publikacji', kind: 'ready'};
      case 'NIE_DOTYCZY':
        return {icon: 'pi pi-minus-circle', label: 'Nie dotyczy', kind: 'neutral'};
      default:
        return {icon: 'pi pi-info-circle', label: this.humanize(value, 'Brak statusu'), kind: 'neutral'};
    }
  }

  private lifecycleBadge(value: string): StatusBadgeViewModel {
    const normalized = this.normalize(value);
    switch (normalized) {
      case 'AKTYWNY':
      case 'ACTIVE':
      case 'OPUBLIKOWANY':
      case 'PUBLISHED':
        return {icon: 'pi pi-check-circle', label: 'Aktywny', kind: 'published'};
      case 'NOWY':
        return {icon: 'pi pi-plus-circle', label: 'Nowy', kind: 'draft'};
      case 'WERYFIKOWANY':
        return {icon: 'pi pi-search', label: 'Weryfikowany', kind: 'warning'};
      case 'ARCHIWALNY':
      case 'ARCHIVED':
        return {icon: 'pi pi-archive', label: 'Archiwalny', kind: 'neutral'};
      case 'USUNIETY_LOGICZNIE':
        return {icon: 'pi pi-trash', label: 'Usuniety logicznie', kind: 'danger'};
      default:
        return {icon: 'pi pi-info-circle', label: this.humanize(value, 'Brak statusu'), kind: 'neutral'};
    }
  }

  private humanize(value: string, fallback: string): string {
    if (!value.trim()) {
      return fallback;
    }
    const text = value.toLowerCase().replace(/_/g, ' ');
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
  }

  private normalize(value: string): string {
    return value.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
