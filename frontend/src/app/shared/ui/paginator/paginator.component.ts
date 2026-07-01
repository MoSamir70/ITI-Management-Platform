import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: true,
  styles: [`
    .bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; flex-wrap: wrap; gap: 12px;
    }
    .info { font-size: 12px; color: var(--secondary); font-weight: 600; }
    .controls { display: flex; align-items: center; gap: 6px; }
    .page-size {
      border: 1px solid var(--surface-gray); border-radius: 8px; padding: 6px 10px;
      font-size: 12px; font-weight: 600; color: var(--secondary); background: #fff;
      margin-right: 12px;
    }
    button {
      min-width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--surface-gray);
      background: #fff; color: var(--secondary); font-size: 13px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s;
      padding: 0 8px;
    }
    button:hover:not(:disabled) { background: var(--surface-low); }
    button:disabled { opacity: .4; cursor: not-allowed; }
    button.active { background: var(--iti-red); color: #fff; border-color: var(--iti-red); }
    .material-symbols-outlined { font-size: 18px; }
  `],
  template: `
    <div class="bar">
      <span class="info">
        Showing {{ startIndex }}–{{ endIndex }} of {{ total }}
      </span>
      <div class="controls">
        <select class="page-size" [value]="pageSize" (change)="onPageSizeChange($event)">
          <option [value]="10">10 / page</option>
          <option [value]="25">25 / page</option>
          <option [value]="50">50 / page</option>
          <option [value]="100">100 / page</option>
        </select>
        <button (click)="go(page - 1)" [disabled]="page <= 1">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        @for (p of pageNumbers(); track p) {
          <button [class.active]="p === page" (click)="go(p)">{{ p }}</button>
        }
        <button (click)="go(page + 1)" [disabled]="page >= totalPages">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  `
})
export class PaginatorComponent {
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() total = 0;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages() { return Math.max(1, Math.ceil(this.total / this.pageSize)); }
  get startIndex() { return this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1; }
  get endIndex() { return Math.min(this.page * this.pageSize, this.total); }

  pageNumbers(): number[] {
    const tp = this.totalPages;
    const cur = this.page;
    const span = 2;
    const start = Math.max(1, cur - span);
    const end = Math.min(tp, cur + span);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }

  go(p: number) {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.pageChange.emit(p);
  }

  onPageSizeChange(e: Event) {
    const val = Number((e.target as HTMLSelectElement).value);
    this.pageSizeChange.emit(val);
  }
}
