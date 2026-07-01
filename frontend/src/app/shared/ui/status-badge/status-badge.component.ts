import { Component, Input } from '@angular/core';

export type BadgeTone = 'approved' | 'pending' | 'rejected' | 'active' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="'badge--' + tone">{{ label }}</span>`
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() tone: BadgeTone = 'neutral';
}
