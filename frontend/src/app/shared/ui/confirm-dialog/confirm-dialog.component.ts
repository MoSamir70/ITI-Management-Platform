import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalShellComponent],
  styles: [`
    .icon-wrap {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .icon-wrap--danger { background: #fce8e6; }
    .icon-wrap--danger .material-symbols-outlined { color: #ba1a1a; font-size: 28px; }
    .icon-wrap--default { background: rgba(176,54,51,.08); }
    .icon-wrap--default .material-symbols-outlined { color: var(--iti-red); font-size: 28px; }
    .message { text-align: center; color: var(--secondary); font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .actions { display: flex; gap: 12px; }
    .actions .btn { flex: 1; justify-content: center; }
    .btn--danger { background: #ba1a1a; color: #fff; }
    .btn--danger:hover { background: #93000a; }
  `],
  template: `
    <app-modal-shell [title]="title" size="sm" (close)="cancel.emit()">
      <div class="icon-wrap" [class]="danger ? 'icon-wrap--danger' : 'icon-wrap--default'">
        <span class="material-symbols-outlined">{{ icon }}</span>
      </div>
      <p class="message">{{ message }}</p>
      <div class="actions">
        <button class="btn btn--ghost" (click)="cancel.emit()">{{ cancelLabel }}</button>
        <button class="btn" [class.btn--danger]="danger" [class.btn--primary]="!danger" (click)="confirm.emit()">
          {{ confirmLabel }}
        </button>
      </div>
    </app-modal-shell>
  `
})
export class ConfirmDialogComponent {
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() danger = false;
  @Input() icon = 'help';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
