import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .welcome { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .sub     { color: var(--color-text-muted); margin-bottom: 32px; }
    .grid    { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px; }
    .tile {
      background: var(--color-surface);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      padding: 24px;
      text-align: center;
      text-decoration: none;
      color: var(--color-text);
      transition: box-shadow 0.15s;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,.15); text-decoration: none; }
      .icon { font-size: 32px; margin-bottom: 12px; }
      .label { font-weight: 600; }
    }
  `],
  template: `
    <p class="welcome">Welcome, {{ user()?.fullName }}</p>
    <p class="sub">{{ user()?.role }} · ITI Management Portal</p>
    <div class="grid">
      @for (tile of tiles(); track tile.path) {
        <a class="tile" [routerLink]="tile.path">
          <div class="icon">{{ tile.icon }}</div>
          <div class="label">{{ tile.label }}</div>
        </a>
      }
    </div>
  `
})
export class DashboardComponent {
  user = this.auth.currentUser;

  tiles = computed(() => {
    const role = this.auth.role();
    const all = [
      { label: 'Grades',        path: '/grades',        icon: '📝', roles: ['TrainingManager','Supervisor','TA','Student'] },
      { label: 'Attendance',    path: '/attendance',    icon: '✅', roles: ['TrainingManager','Supervisor','TA','Student'] },
      { label: 'Exams',         path: '/exams',         icon: '📅', roles: ['TrainingManager','Supervisor','Student'] },
      { label: 'KPI',           path: '/kpi',           icon: '🏆', roles: ['TrainingManager','Supervisor','Student'] },
      { label: 'Notifications', path: '/notifications', icon: '🔔', roles: [] },
    ];
    return all.filter(t => t.roles.length === 0 || (role !== null && t.roles.includes(role)));
  });

  constructor(private auth: AuthService) {}
}
