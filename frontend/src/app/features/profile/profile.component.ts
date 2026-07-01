import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/services/toast.service';
import { UserDetail } from '../../core/models/user.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  styles: [`
    .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
    .avatar-lg {
      width: 72px; height: 72px; border-radius: 50%; background: var(--deep-navy);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; flex-shrink: 0;
    }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; max-width: 360px; }
    .field label { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--on-surface-var); }
    .field input {
      padding: 10px 12px; border-radius: 8px; border: 1px solid var(--surface-gray);
      background: var(--bg); font-size: 14px; outline: none;
    }
    .field input:focus { border-color: var(--iti-red); box-shadow: 0 0 0 3px rgba(176,54,51,.1); }
    .field input:disabled { background: var(--surface-low); color: var(--secondary); }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; max-width: 480px; }
    .info-item { font-size: 13px; }
    .info-item .lbl { color: var(--secondary); font-size: 11px; text-transform: uppercase; font-weight: 600; }
  `],
  template: `
    <div class="page-header"><h1>My Profile</h1></div>

    @if (user(); as u) {
      <div class="card" style="max-width:560px">
        <div class="profile-header">
          <div class="avatar-lg">{{ initials(u.fullName) }}</div>
          <div>
            <div style="font-family:'Montserrat',sans-serif;font-size:18px;font-weight:700">{{ u.fullName }}</div>
            <div style="color:var(--secondary);font-size:13px">{{ u.role }}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item"><div class="lbl">Email</div>{{ u.email }}</div>
          <div class="info-item"><div class="lbl">Member Since</div>{{ u.createdAt | date:'dd MMM yyyy' }}</div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Phone</label>
            <input formControlName="phone" placeholder="01012345678" />
          </div>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save Changes' }}</button>
        </form>
      </div>
    } @else if (loading()) {
      <div class="spinner"></div>
    }
  `
})
export class ProfileComponent implements OnInit {
  user = signal<UserDetail | null>(null);
  loading = signal(true);
  saving = signal(false);

  form = this.fb.nonNullable.group({ phone: [''] });

  initials = (name: string) => name.split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase();

  constructor(private users: UserService, private toast: ToastService, private fb: FormBuilder) {}

  ngOnInit() {
    this.users.getMe().subscribe({
      next: u => { this.user.set(u); this.form.patchValue({ phone: u.phone ?? '' }); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  submit() {
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.users.updateMe({ phone: v.phone || null }).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => this.toast.success('Profile updated successfully.'),
      error: () => this.toast.error('Failed to update profile.')
    });
  }
}
