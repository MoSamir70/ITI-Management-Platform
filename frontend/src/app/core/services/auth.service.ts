import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthState, LoginRequest, LoginResponse, RefreshResponse, UserRole } from '../models/auth.models';

const TOKEN_KEY = 'iti_access_token';
const STATE_KEY = 'iti_auth_state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _state = signal<AuthState | null>(this.loadState());

  readonly isAuthenticated = computed(() => {
    const s = this._state();
    return s !== null && new Date(s.expiresAt) > new Date();
  });

  readonly currentUser = computed(() => this._state());
  readonly role = computed(() => this._state()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiBase}/auth/login`, req).pipe(
      tap(res => {
        const state: AuthState = {
          accessToken: res.accessToken,
          userId: res.userId,
          fullName: res.fullName,
          role: res.role as UserRole,
          expiresAt: new Date(res.expiresAt)
        };
        this._state.set(state);
        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
      })
    );
  }

  logout() {
    this.http.post(`${environment.apiBase}/auth/logout`, {}).pipe(catchError(() => EMPTY)).subscribe();
    this._state.set(null);
    sessionStorage.removeItem(STATE_KEY);
    this.router.navigate(['/login']);
  }

  refreshToken() {
    return this.http.post<RefreshResponse>(`${environment.apiBase}/auth/refresh`, {}).pipe(
      tap(res => {
        const current = this._state();
        if (!current) return;
        const updated: AuthState = { ...current, accessToken: res.accessToken, expiresAt: new Date(res.expiresAt) };
        this._state.set(updated);
        sessionStorage.setItem(STATE_KEY, JSON.stringify(updated));
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

  private loadState(): AuthState | null {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as AuthState;
      s.expiresAt = new Date(s.expiresAt);
      return s.expiresAt > new Date() ? s : null;
    } catch {
      return null;
    }
  }
}
