import { Component, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--color-bg);
    }

    .login-card {
      background: var(--color-surface);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 8px;
    }

    .subtitle {
      color: var(--color-text-muted);
      margin-bottom: 32px;
      font-size: 14px;
    }

    .error-banner {
      background: #fce8e6;
      color: var(--color-danger);
      padding: 10px 14px;
      border-radius: var(--border-radius);
      margin-bottom: 16px;
      font-size: 13px;
    }

    .submit-btn {
      width: 100%;
      padding: 12px;
      background: var(--color-primary);
      color: #fff;
      border: none;
      border-radius: var(--border-radius);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      transition: background 0.15s;

      &:hover:not(:disabled) { background: var(--color-primary-dark); }
      &:disabled { opacity: 0.7; cursor: not-allowed; }
    }
  `],
  template: `
    <div class="login-card">
      <h1>ITI Portal</h1>
      <p class="subtitle">Sign in to your account</p>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" placeholder="you@iti.gov.eg" autocomplete="email" />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <span class="error-msg">Valid email required</span>
          }
        </div>
        <div class="form-field">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" />
          @if (form.get('password')?.invalid && form.get('password')?.touched) {
            <span class="error-msg">Password required</span>
          }
        </div>
        <button type="submit" class="submit-btn" [disabled]="loading()">
          {{ loading() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  `
})
export class LoginComponent {
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/']),
      error: err => {
        this.loading.set(false);
        this.error.set(err.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Please try again.');
      }
    });
  }
}
