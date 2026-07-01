import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  styles: [`
    .scrim {
      position: fixed; inset: 0; background: rgba(27,28,28,.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 500; padding: 20px; animation: fade-in .15s ease-out;
    }
    .modal {
      background: #fff; border-radius: 16px; width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      max-height: 90vh; display: flex; flex-direction: column;
      animation: pop-in .18s ease-out;
    }
    .modal--sm { max-width: 420px; }
    .modal--md { max-width: 560px; }
    .modal--lg { max-width: 720px; }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid var(--surface-gray);
    }
    .modal-title { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700; color: var(--on-surface); }
    .modal-close {
      background: none; border: none; cursor: pointer; color: var(--secondary);
      width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
      transition: all .15s;
    }
    .modal-close:hover { background: var(--surface-low); color: var(--on-surface); }
    .modal-body { padding: 24px; overflow-y: auto; }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop-in { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `],
  template: `
    <div class="scrim" (click)="onScrimClick($event)">
      <div class="modal" [class]="'modal--' + size" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span class="modal-title">{{ title }}</span>
          <button class="modal-close" (click)="close.emit()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalShellComponent {
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() closeOnScrim = true;
  @Output() close = new EventEmitter<void>();

  onScrimClick(e: MouseEvent) {
    if (this.closeOnScrim) this.close.emit();
  }
}
