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
      display: flex; min-height: 100vh; align-items: center; justify-content: center;
      background: var(--bg); font-family: 'Inter', sans-serif;
      position: relative; overflow: hidden;
    }

    /* ── Ambient background blobs ── */
    .blob-red {
      position: fixed; top: -10%; left: -5%;
      width: 40vw; height: 40vw; background: rgba(176,54,51,.05);
      border-radius: 50%; filter: blur(120px); pointer-events: none;
    }
    .blob-navy {
      position: fixed; bottom: -10%; right: -5%;
      width: 40vw; height: 40vw; background: rgba(32,57,71,.05);
      border-radius: 50%; filter: blur(120px); pointer-events: none;
    }

    /* ── Layout ── */
    .container {
      position: relative; z-index: 1; width: 100%; max-width: 1100px;
      padding: 24px; display: flex; align-items: center;
      justify-content: space-between; gap: 80px;
    }

    /* ── Left branding ── */
    .branding { flex: 1; max-width: 480px; display: none; }
    @media (min-width: 900px) { .branding { display: flex; flex-direction: column; gap: 32px; } }

    .brand-header { display: flex; align-items: center; gap: 16px; }
    .brand-icon {
      width: 52px; height: 52px; background: var(--iti-red); border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-icon .material-symbols-outlined {
      color: #fff; font-size: 28px;
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .divider-v { width: 1px; height: 48px; background: var(--surface-gray); }
    .brand-text-group { display: flex; flex-direction: column; gap: 2px; }
    .brand-portal {
      font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 700;
      color: var(--primary); letter-spacing: -.01em;
    }
    .brand-sub {
      font-size: 10px; font-weight: 600; letter-spacing: .1em;
      text-transform: uppercase; color: var(--secondary);
    }

    .headline {
      font-family: 'Montserrat', sans-serif; font-size: 36px; font-weight: 800;
      line-height: 1.15; color: var(--deep-navy);
    }
    .headline em { font-style: normal; color: var(--iti-red); }
    .tagline { font-size: 15px; color: var(--secondary); max-width: 400px; line-height: 1.6; }

    .stats { display: flex; align-items: center; gap: 24px; padding-top: 16px; }
    .stat { display: flex; flex-direction: column; }
    .stat-num {
      font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 700;
      color: var(--deep-navy);
    }
    .stat-lbl { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--secondary); }
    .divider-stat { width: 1px; height: 32px; background: var(--surface-gray); }

    /* ── Card ── */
    .card {
      width: 100%; max-width: 420px; flex-shrink: 0;
      background: var(--surface); border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.08); padding: 40px;
    }
    .card-head { margin-bottom: 32px; }
    .card-title {
      font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 700;
      color: var(--on-surface); margin-bottom: 6px;
    }
    .card-sub { font-size: 14px; color: var(--secondary); }

    /* ── Error banner ── */
    .error-banner {
      background: #fce8e6; color: #c62828; padding: 11px 14px;
      border-radius: 8px; font-size: 13px; margin-bottom: 20px;
      display: flex; align-items: center; gap: 8px;
    }

    /* ── Form ── */
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .field-label {
      font-size: 11px; font-weight: 600; letter-spacing: .06em;
      text-transform: uppercase; color: var(--on-surface-var);
    }
    .field-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .forgot { font-size: 12px; color: var(--primary); text-decoration: none; }
    .forgot:hover { color: var(--dark-crimson); }

    .input-wrap { position: relative; }
    .input-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: var(--secondary); pointer-events: none;
      .material-symbols-outlined { font-size: 18px; }
    }
    .input-eye {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--secondary); cursor: pointer; padding: 4px;
      .material-symbols-outlined { font-size: 18px; }
    }
    input {
      width: 100%; padding: 12px 14px 12px 40px; border-radius: 8px;
      border: 1px solid var(--surface-gray); background: var(--bg);
      font-size: 14px; font-family: 'Inter', sans-serif; color: var(--on-surface);
      outline: none; transition: border .15s;
    }
    input:focus { border-color: var(--iti-red); box-shadow: 0 0 0 3px rgba(176,54,51,.1); }
    input.is-invalid { border-color: #ba1a1a; }
    .err { font-size: 12px; color: #ba1a1a; }

    /* ── Submit ── */
    .submit {
      width: 100%; padding: 14px; border: none; border-radius: 8px;
      background: var(--iti-red); color: #fff; cursor: pointer;
      font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 20px rgba(176,54,51,.25); transition: all .2s;
      margin-top: 8px;
    }
    .submit:hover:not(:disabled) { background: var(--dark-crimson); transform: translateY(-1px); }
    .submit:disabled { opacity: .7; cursor: not-allowed; }
    .material-symbols-outlined { font-size: 18px; }

    /* ── Card footer ── */
    .card-footer {
      margin-top: 28px; padding-top: 24px;
      border-top: 1px solid var(--surface-gray);
      text-align: center; display: flex; flex-direction: column; gap: 12px;
    }
    .footer-text { font-size: 13px; color: var(--secondary); }
    .support-link {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; border: 1px solid var(--surface-gray); border-radius: 99px;
      font-size: 12px; color: var(--deep-navy); text-decoration: none; transition: all .15s;
    }
    .support-link:hover { background: var(--surface-low); }

    .card-meta {
      display: flex; justify-content: space-between; padding: 0 2px;
      margin-top: 20px;
    }
    .meta-link { font-size: 11px; color: var(--secondary); opacity: .6; text-decoration: none; }
    .meta-link:hover { opacity: 1; }
  `],
  template: `
    <div class="blob-red"></div>
    <div class="blob-navy"></div>

    <div class="container">
      <!-- Left: Branding -->
      <div class="branding">
        <div class="brand-header">
          <div class="brand-icon">
            <span class="material-symbols-outlined">account_balance</span>
          </div>
          <div class="divider-v"></div>
          <div class="brand-text-group">
            <span class="brand-portal">ITI Portal</span>
            <span class="brand-sub">Branch Management</span>
          </div>
        </div>

        <h1 class="headline">
          Empowering the next generation of<br>
          <em>technical excellence.</em>
        </h1>
        <p class="tagline">
          Secure access to the Integrated Technology Institute's branch administrative dashboard.
          Manage schedules, student data, and academic reports with precision.
        </p>

        <div class="stats">
          <div class="stat">
            <span class="stat-num">50+</span>
            <span class="stat-lbl">Active Branches</span>
          </div>
          <div class="divider-stat"></div>
          <div class="stat">
            <span class="stat-num">12k</span>
            <span class="stat-lbl">Students</span>
          </div>
          <div class="divider-stat"></div>
          <div class="stat">
            <span class="stat-num">95%</span>
            <span class="stat-lbl">Pass Rate</span>
          </div>
        </div>
      </div>

      <!-- Right: Login card -->
      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Welcome Back</h2>
          <p class="card-sub">Please enter your credentials to access the portal.</p>
        </div>

        @if (error()) {
          <div class="error-banner">
            <span class="material-symbols-outlined">error</span>
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label class="field-label">Email Address</label>
            <div class="input-wrap">
              <span class="input-icon"><span class="material-symbols-outlined">mail</span></span>
              <input type="email" formControlName="email"
                     placeholder="name@branch.iti.edu" autocomplete="email"
                     [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched" />
            </div>
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <span class="err">Valid email required</span>
            }
          </div>

          <div class="field">
            <div class="field-row">
              <label class="field-label">Password</label>
              <a href="#" class="forgot">Forgot Password?</a>
            </div>
            <div class="input-wrap">
              <span class="input-icon"><span class="material-symbols-outlined">lock</span></span>
              <input [type]="showPass ? 'text' : 'password'" formControlName="password"
                     placeholder="••••••••" autocomplete="current-password"
                     [class.is-invalid]="form.get('password')?.invalid && form.get('password')?.touched" />
              <button type="button" class="input-eye" (click)="showPass = !showPass">
                <span class="material-symbols-outlined">{{ showPass ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <span class="err">Password required</span>
            }
          </div>

          <button type="submit" class="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in to Portal' }}
            @if (!loading()) {
              <span class="material-symbols-outlined">arrow_forward</span>
            }
          </button>
        </form>

        <div class="card-footer">
          <p class="footer-text">Need technical assistance?</p>
          <a href="#" class="support-link">
            <span class="material-symbols-outlined">support_agent</span>
            Contact Branch Support
          </a>
        </div>

        <div class="card-meta">
          <span class="meta-link">v4.2.0 Enterprise</span>
          <a href="#" class="meta-link">Privacy</a>
          <a href="#" class="meta-link">Terms</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading  = signal(false);
  error    = signal<string | null>(null);
  showPass = false;

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
      next: async () => {
        const ok = await this.router.navigate(['/dashboard']);
        if (!ok) {
          this.loading.set(false);
          this.error.set('Navigation failed. Please refresh.');
        }
      },
      error: err => {
        this.loading.set(false);
        if (err.status === 401) {
          this.error.set('Invalid email or password.');
        } else if (err.status === 0) {
          this.error.set('Cannot reach the server. Make sure the API is running on port 5251.');
        } else {
          this.error.set(`Error ${err.status}: ${err.error?.title ?? 'Something went wrong.'}`);
        }
      }
    });
  }
}
