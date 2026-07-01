import { Component } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  styles: [`
    .toast-stack {
      position: fixed; top: 20px; right: 20px; z-index: 1000;
      display: flex; flex-direction: column; gap: 10px; width: 340px;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; border-radius: 10px; background: #fff;
      box-shadow: 0 8px 30px rgba(0,0,0,.15); font-size: 13px; font-weight: 600;
      animation: slide-in .2s ease-out;
    }
    .toast--success { border-left: 4px solid #2e7d32; color: #1b1c1c; }
    .toast--error   { border-left: 4px solid #ba1a1a; color: #1b1c1c; }
    .toast--info    { border-left: 4px solid var(--iti-red); color: #1b1c1c; }
    .toast .material-symbols-outlined { font-size: 20px; }
    .toast--success .material-symbols-outlined { color: #2e7d32; }
    .toast--error   .material-symbols-outlined { color: #ba1a1a; }
    .toast--info    .material-symbols-outlined { color: var(--iti-red); }
    .toast-msg { flex: 1; }
    .toast-close {
      background: none; border: none; cursor: pointer; color: var(--secondary);
      display: flex; align-items: center;
    }
    @keyframes slide-in { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `],
  template: `
    <div class="toast-stack">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class]="'toast--' + t.kind">
          <span class="material-symbols-outlined">
            {{ t.kind === 'success' ? 'check_circle' : t.kind === 'error' ? 'error' : 'info' }}
          </span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" (click)="toasts.dismiss(t.id)">
            <span class="material-symbols-outlined" style="font-size:16px">close</span>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastHostComponent {
  constructor(public toasts: ToastService) {}
}
