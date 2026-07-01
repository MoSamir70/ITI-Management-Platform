import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; max-width: 360px; }
    .field label { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--on-surface-var); }
    .field input {
      padding: 10px 12px; border-radius: 8px; border: 1px solid var(--surface-gray);
      background: var(--bg); font-size: 14px; outline: none;
    }
    .field input:focus { border-color: var(--iti-red); box-shadow: 0 0 0 3px rgba(176,54,51,.1); }
    .field input.is-invalid { border-color: #ba1a1a; }
    .field .err { font-size: 12px; color: #ba1a1a; }
  `],
  template: `
    <div class="page-header"><h1>System Settings</h1></div>

    <div class="card" style="max-width:480px">
      <h3 style="font-family:'Montserrat',sans-serif;font-size:16px;margin-bottom:20px">Change Password</h3>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label>Current Password</label>
          <input type="password" formControlName="currentPassword"
                 [class.is-invalid]="form.get('currentPassword')?.invalid && form.get('currentPassword')?.touched" />
          @if (form.get('currentPassword')?.invalid && form.get('currentPassword')?.touched) { <span class="err">Required</span> }
        </div>
        <div class="field">
          <label>New Password</label>
          <input type="password" formControlName="newPassword"
                 [class.is-invalid]="form.get('newPassword')?.invalid && form.get('newPassword')?.touched" />
          @if (form.get('newPassword')?.invalid && form.get('newPassword')?.touched) { <span class="err">Minimum 8 characters</span> }
        </div>
        <button type="submit" class="btn btn--primary" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Update Password' }}</button>
      </form>
    </div>
  `
})
export class SettingsComponent {
  saving = signal(false);

  form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(private http: HttpClient, private toast: ToastService, private fb: FormBuilder) {}

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.http.post(`${environment.apiBase}/auth/change-password`, v).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => { this.toast.success('Password updated successfully.'); this.form.reset(); },
      error: err => this.toast.error(err.error?.detail ?? err.error?.title ?? 'Failed to update password.')
    });
  }
}
