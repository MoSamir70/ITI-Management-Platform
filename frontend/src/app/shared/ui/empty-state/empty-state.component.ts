import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  styles: [`
    .empty { text-align: center; padding: 60px 24px; color: var(--secondary); }
    .empty .material-symbols-outlined { font-size: 48px; color: var(--surface-gray); margin-bottom: 12px; }
    .empty p { font-size: 15px; margin-bottom: 16px; }
  `],
  template: `
    <div class="empty">
      <span class="material-symbols-outlined">{{ icon }}</span>
      <p>{{ message }}</p>
      @if (actionLabel) {
        <button class="btn btn--primary" (click)="action.emit()">{{ actionLabel }}</button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() message = 'No data yet.';
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
