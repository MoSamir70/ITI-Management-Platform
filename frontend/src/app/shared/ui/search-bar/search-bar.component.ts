import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`
    .wrap { position: relative; width: 100%; max-width: 420px; }
    .icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: var(--secondary); pointer-events: none; font-size: 20px;
    }
    input {
      width: 100%; padding: 10px 14px 10px 40px; border-radius: 8px;
      border: 1px solid var(--surface-gray); background: var(--surface-low);
      font-size: 14px; font-family: 'Inter', sans-serif; color: var(--on-surface);
      outline: none; transition: all .15s;
    }
    input:focus { border-color: var(--iti-red); box-shadow: 0 0 0 3px rgba(176,54,51,.1); background: #fff; }
  `],
  template: `
    <div class="wrap">
      <span class="material-symbols-outlined icon">search</span>
      <input type="text" [formControl]="control" [placeholder]="placeholder" />
    </div>
  `
})
export class SearchBarComponent implements OnDestroy {
  @Input() placeholder = 'Search…';
  @Input() debounceMs = 350;
  @Output() valueChange = new EventEmitter<string>();

  control = new FormControl('', { nonNullable: true });
  private destroy$ = new Subject<void>();

  constructor() {
    this.control.valueChanges
      .pipe(debounceTime(this.debounceMs), takeUntil(this.destroy$))
      .subscribe(v => this.valueChange.emit(v.trim()));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
