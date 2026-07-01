import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  styles: [`
    .row { display: flex; gap: 16px; padding: 16px 20px; border-bottom: 1px solid var(--surface-gray); }
    .cell {
      height: 16px; border-radius: 4px;
      background: linear-gradient(90deg, var(--surface-gray) 25%, var(--surface-low) 50%, var(--surface-gray) 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `],
  template: `
    @for (r of rowsArray(); track r) {
      <div class="row">
        @for (c of colsArray(); track c) {
          <div class="cell" [style.width.%]="100 / columns" [style.max-width.px]="180"></div>
        }
      </div>
    }
  `
})
export class TableSkeletonComponent {
  @Input() rows = 5;
  @Input() columns = 4;
  rowsArray() { return Array.from({ length: this.rows }); }
  colsArray() { return Array.from({ length: this.columns }); }
}
