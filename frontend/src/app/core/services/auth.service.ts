import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthState, LoginRequest, LoginResponse, RefreshResponse, UserRole } from '../models/auth.models';

const STATE_KEY = 'iti_auth_state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _state = signal<AuthState | null>(this.loadState());

  readonly isAuthenticated = computed(() => {
    const s = this._state();
    if (!s) return false;
    const exp = new Date(s.expiresAt);
    return !isNaN(exp.getTime()) && exp > new Date();
  });

  readonly currentUser = computed(() => this._state());
  readonly role = computed(() => this._state()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiBase}/auth/login`, req).pipe(
      tap(res => this.applyLogin(res))
    );
  }

  logout() {
    this.http.post(`${environment.apiBase}/auth/logout`, {}).pipe(catchError(() => EMPTY)).subscribe();
    this.clearState();
    this.router.navigate(['/login']);
  }

  refreshToken() {
    return this.http.post<RefreshResponse>(`${environment.apiBase}/auth/refresh`, {}).pipe(
      tap(res => {
        const current = this._state();
        if (!current) return;
        const updated: AuthState = {
          ...current,
          accessToken: res.accessToken,
          expiresAt: new Date(Date.now() + res.expiresInSeconds * 1000)
        };
        this.saveState(updated);
      })
    );
  }

  getAccessToken(): string | null {
    return this._state()?.accessToken ?? null;
  }

  hasRole(...roles: UserRole[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }

  private applyLogin(res: LoginResponse) {
    const state: AuthState = {
      accessToken: res.accessToken,
      userId: res.userId,
      fullName: res.fullName,
      role: res.role as UserRole,
      expiresAt: new Date(Date.now() + res.expiresInSeconds * 1000),
      mustChangePassword: res.mustChangePassword
    };
    this.saveState(state);
  }

  private saveState(state: AuthState) {
    this._state.set(state);
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  private clearState() {
    this._state.set(null);
    sessionStorage.removeItem(STATE_KEY);
  }

  private loadState(): AuthState | null {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as AuthState;
      s.expiresAt = new Date(s.expiresAt);
      if (isNaN(s.expiresAt.getTime())) return null;
      return s.expiresAt > new Date() ? s : null;
    } catch {
      return null;
    }
  }
}
