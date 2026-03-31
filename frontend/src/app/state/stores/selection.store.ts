import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SelectionStore {
  readonly selectedBusinessId = signal<string | null>(null);

  select(businessId: string): void {
    this.selectedBusinessId.set(businessId);
  }

  clear(): void {
    this.selectedBusinessId.set(null);
  }
}
