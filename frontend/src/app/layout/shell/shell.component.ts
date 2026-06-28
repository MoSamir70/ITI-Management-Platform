import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`
    :host { display: flex; height: 100vh; overflow: hidden; }

    /* ── Sidebar ─────────────────────── */
    .sidebar {
      width: var(--sidebar-w); min-width: var(--sidebar-w);
      background: var(--deep-navy); display: flex; flex-direction: column;
      height: 100vh; overflow-y: auto; overflow-x: hidden;
    }
    .brand { padding: 32px 24px 24px; }
    .brand-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    .logo-icon {
      width: 40px; height: 40px; background: var(--iti-red);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .logo-icon .material-symbols-outlined {
      color: #fff; font-size: 22px;
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .brand-name {
      font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700;
      color: #fff; line-height: 1.2;
    }
    .brand-sub {
      font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
      color: rgba(255,255,255,.4); margin-top: 4px; padding-left: 52px;
    }

    /* ── Nav ─────────────────────────── */
    nav { flex: 1; padding: 8px 16px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 14px;
      padding: 11px 16px; border-radius: 10px;
      color: rgba(255,255,255,.55); font-size: 14px; font-weight: 500;
      text-decoration: none; transition: all .18s; cursor: pointer;
      border-left: 3px solid transparent;
    }
    .nav-item:hover { color: #fff; background: rgba(255,255,255,.06); }
    .nav-item.active {
      color: #fff; font-weight: 700;
      background: rgba(176,54,51,.18);
      border-left-color: var(--iti-red);
    }
    .nav-item .material-symbols-outlined { font-size: 20px; }

    /* ── Bottom ──────────────────────── */
    .sidebar-bottom { padding: 0 16px 24px; }
    .bottom-divider { border: none; border-top: 1px solid rgba(255,255,255,.08); margin: 12px 0; }
    .nav-settings {
      display: flex; align-items: center; gap: 14px;
      padding: 11px 16px; border-radius: 10px;
      color: var(--iti-red); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .18s;
    }
    .nav-settings:hover { background: rgba(176,54,51,.1); }
    .nav-settings .material-symbols-outlined { font-size: 20px; }
    .nav-logout {
      display: flex; align-items: center; gap: 14px;
      padding: 11px 16px; border-radius: 10px;
      color: rgba(255,255,255,.55); font-size: 14px; cursor: pointer; transition: all .18s;
    }
    .nav-logout:hover { color: #fff; background: rgba(255,255,255,.06); }
    .nav-logout .material-symbols-outlined { font-size: 20px; }

    /* ── Main area ───────────────────── */
    .main-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* ── Topbar ──────────────────────── */
    .topbar {
      height: var(--header-h); min-height: var(--header-h);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px; background: rgba(251,249,249,.9);
      backdrop-filter: blur(12px); border-bottom: 1px solid var(--surface-gray);
    }
    .topbar-title {
      font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 800;
      color: var(--primary); letter-spacing: -.01em;
    }
    .topbar-right { display: flex; align-items: center; gap: 8px; }
    .icon-btn {
      width: 36px; height: 36px; border: none; background: transparent;
      border-radius: 8px; cursor: pointer; color: var(--secondary);
      display: flex; align-items: center; justify-content: center; transition: all .15s;
    }
    .icon-btn:hover { background: var(--surface-low); color: var(--on-surface); }
    .user-chip {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 12px; border-radius: 10px; cursor: pointer; transition: all .15s; margin-left: 8px;
    }
    .user-chip:hover { background: var(--surface-low); }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--deep-navy); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; line-height: 1.2; }
    .user-name { font-size: 13px; font-weight: 600; color: var(--on-surface); }
    .user-role { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--secondary); }

    /* ── Content ─────────────────────── */
    .content { flex: 1; overflow-y: auto; padding: 32px; }
  `],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">
          <div class="logo-icon">
            <span class="material-symbols-outlined">account_balance</span>
          </div>
          <span class="brand-name">ITI Portal</span>
        </div>
        <div class="brand-sub">Branch Management</div>
      </div>

      <nav>
        @for (item of navItems; track item.route) {
          <a class="nav-item" [routerLink]="item.route" routerLinkActive="active">
            <span class="material-symbols-outlined">{{ item.icon }}</span>
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="sidebar-bottom">
        <div class="nav-settings">
          <span class="material-symbols-outlined">settings</span>
          System Settings
        </div>
        <hr class="bottom-divider">
        <div class="nav-item" style="color:rgba(255,255,255,.55); border-left:none">
          <span class="material-symbols-outlined">help</span>
          Help Center
        </div>
        <div class="nav-logout" (click)="logout()">
          <span class="material-symbols-outlined">logout</span>
          Logout
        </div>
      </div>
    </aside>

    <div class="main-wrap">
      <header class="topbar">
        <span class="topbar-title">ITI Branch Portal</span>
        <div class="topbar-right">
          <button class="icon-btn">
            <span class="material-symbols-outlined">notifications</span>
          </button>
          <div class="user-chip">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-info">
              <span class="user-name">{{ fullName() }}</span>
              <span class="user-role">{{ role() }}</span>
            </div>
          </div>
        </div>
      </header>

      <div class="content">
        <router-outlet />
      </div>
    </div>
  `
})
export class ShellComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',       route: '/dashboard' },
    { label: 'Students',      icon: 'person',           route: '/students' },
    { label: 'Grades',        icon: 'grade',            route: '/grades' },
    { label: 'Attendance',    icon: 'event_available',  route: '/attendance' },
    { label: 'Exams',         icon: 'quiz',             route: '/exams' },
    { label: 'KPI',           icon: 'analytics',        route: '/kpi' },
    { label: 'Notifications', icon: 'notifications',    route: '/notifications' },
  ];

  fullName = computed(() => this.auth.currentUser()?.fullName ?? 'User');
  role     = computed(() => this.auth.currentUser()?.role ?? '');
  initials = computed(() => {
    const n = this.auth.currentUser()?.fullName ?? '';
    return n.split(' ').slice(0, 2).map((p: string) => p[0] ?? '').join('').toUpperCase() || 'U';
  });

  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout(); // auth.logout() posts to API, clears state, and navigates to /login
  }
}
