import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-icon-box">
          <span class="material-symbols-outlined stat-icon icon-fill">{{ icon }}</span>
        </div>
        @if (badge) {
          <span class="stat-badge">{{ badge }}</span>
        }
      </div>
      <div class="stat-value">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
  `
})
export class StatCardComponent {
  @Input() icon = 'analytics';
  @Input() value: string | number = 0;
  @Input() label = '';
  @Input() badge?: string;
}
