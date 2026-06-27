import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     path: '/dashboard',     icon: '📊' },
  { label: 'Grades',        path: '/grades',         icon: '📝', roles: ['TrainingManager','Supervisor','TA','Student'] },
  { label: 'Attendance',    path: '/attendance',     icon: '✅', roles: ['TrainingManager','Supervisor','TA','Student'] },
  { label: 'Exams',         path: '/exams',          icon: '📅', roles: ['TrainingManager','Supervisor','Student'] },
  { label: 'KPI',           path: '/kpi',            icon: '🏆', roles: ['TrainingManager','Supervisor','Student'] },
  { label: 'Notifications', path: '/notifications',  icon: '🔔' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`
    :host { display: flex; height: 100vh; overflow: hidden; }

    .sidebar {
      width: var(--sidebar-width);
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .logo {
      padding: 20px 20px 16px;
      font-size: 18px;
      font-weight: 700;
      color: var(--color-primary);
      border-bottom: 1px solid var(--color-border);
    }

    nav { flex: 1; padding: 12px 0; overflow-y: auto; }

    a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      color: var(--color-text);
      font-size: 14px;
      font-weight: 500;
      border-radius: 0;
      transition: background 0.1s;
      text-decoration: none;

      &:hover { background: var(--color-bg); }
      &.active-link { background: var(--color-accent); color: var(--color-primary); font-weight: 600; }
    }

    .user-info {
      padding: 16px 20px;
      border-top: 1px solid var(--color-border);
      font-size: 13px;

      .name { font-weight: 600; margin-bottom: 2px; }
      .role { color: var(--color-text-muted); margin-bottom: 10px; }
    }

    .logout-btn {
      width: 100%;
      padding: 8px;
      background: none;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      color: var(--color-danger);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      &:hover { background: #fce8e6; }
    }

    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
  `],
  template: `
    <aside class="sidebar">
      <div class="logo">ITI Portal</div>
      <nav>
        @for (item of visibleNav(); track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active-link">
            <span>{{ item.icon }}</span>{{ item.label }}
          </a>
        }
      </nav>
      @if (user(); as u) {
        <div class="user-info">
          <div class="name">{{ u.fullName }}</div>
          <div class="role">{{ u.role }}</div>
          <button class="logout-btn" (click)="logout()">Sign out</button>
        </div>
      }
    </aside>
    <div class="main">
      <div class="content"><router-outlet /></div>
    </div>
  `
})
export class ShellComponent {
  user = this.auth.currentUser;

  visibleNav = computed(() => {
    const role = this.auth.role();
    return NAV_ITEMS.filter(n => !n.roles || (role !== null && n.roles.includes(role)));
  });

  constructor(private auth: AuthService) {}

  logout() { this.auth.logout(); }
}
