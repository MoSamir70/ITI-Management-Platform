import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface StatCard { icon: string; label: string; value: string; badge: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    /* ── Hero ──────────────────────── */
    .hero {
      background: var(--deep-navy); border-radius: 16px; padding: 40px;
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 32px; min-height: 200px; overflow: hidden; position: relative;
    }
    .hero::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(circle at 80% 50%, rgba(176,54,51,.12) 0%, transparent 60%);
    }
    .hero-text { position: relative; z-index: 1; }
    .hero-greeting {
      font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 700;
      color: #fff; margin-bottom: 8px;
    }
    .hero-greeting em { font-style: normal; color: var(--iti-red); }
    .hero-sub { color: rgba(255,255,255,.7); font-size: 15px; max-width: 520px; line-height: 1.6; }
    .hero-pills { display: flex; gap: 12px; margin-top: 20px; }
    .hero-pill {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,.08); backdrop-filter: blur(8px);
      padding: 8px 14px; border-radius: 8px; color: #fff; font-size: 13px;
    }
    .hero-pill .material-symbols-outlined { font-size: 16px; }
    .pill-green { color: #4caf50; }
    .pill-yellow { color: #ffb300; }

    /* KPI card on hero right */
    .hero-kpi {
      position: relative; z-index: 1;
      background: #fff; border-radius: 16px; padding: 24px 28px; text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,.15); min-width: 160px;
    }
    .kpi-label { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--secondary); }
    .kpi-value {
      font-family: 'Montserrat', sans-serif; font-size: 48px; font-weight: 800;
      color: var(--primary); line-height: 1;
    }
    .kpi-bar { height: 6px; background: var(--surface-gray); border-radius: 3px; margin: 12px 0 6px; overflow: hidden; }
    .kpi-fill { height: 100%; background: var(--iti-red); border-radius: 3px; }
    .kpi-trend { font-size: 12px; color: var(--secondary); }

    /* ── Stats grid ─────────────────── */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
    @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .stats-grid { grid-template-columns: 1fr; } }

    /* ── Quick links ─────────────────── */
    .section-title {
      font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 700;
      color: var(--on-surface); margin-bottom: 16px;
    }
    .quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 800px) { .quick-grid { grid-template-columns: 1fr 1fr; } }
    .quick-card {
      background: var(--surface); border-radius: 12px; padding: 20px;
      box-shadow: var(--card-shadow); text-decoration: none; color: inherit;
      display: flex; align-items: center; gap: 14px; transition: all .2s;
    }
    .quick-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }
    .quick-icon {
      width: 44px; height: 44px; border-radius: 10px;
      background: rgba(143,29,30,.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .quick-icon .material-symbols-outlined { color: var(--iti-red); font-size: 22px; }
    .quick-label { font-size: 14px; font-weight: 600; color: var(--on-surface); }
    .quick-sub { font-size: 12px; color: var(--secondary); margin-top: 2px; }
  `],
  template: `
    <!-- Hero banner -->
    <section class="hero">
      <div class="hero-text">
        <h2 class="hero-greeting">Welcome back, <em>{{ firstName() }}</em></h2>
        <p class="hero-sub">
          Alexandria branch is currently operating at <strong style="color:var(--iti-red)">92% capacity</strong>.
          All systems online with 14 active tracks today.
        </p>
        <div class="hero-pills">
          <div class="hero-pill">
            <span class="material-symbols-outlined pill-green">check_circle</span>
            Branch Status: Normal
          </div>
          <div class="hero-pill">
            <span class="material-symbols-outlined pill-yellow">event</span>
            Q4 Intake Prep Active
          </div>
        </div>
      </div>
      <div class="hero-kpi">
        <p class="kpi-label">Branch KPI Score</p>
        <p class="kpi-value">8.4</p>
        <div class="kpi-bar"><div class="kpi-fill" style="width:84%"></div></div>
        <p class="kpi-trend">+0.2 from last month</p>
      </div>
    </section>

    <!-- Stat cards -->
    <div class="stats-grid">
      @for (s of stats; track s.label) {
        <div class="stat-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start">
            <div class="stat-icon-box">
              <span class="material-symbols-outlined stat-icon icon-fill">{{ s.icon }}</span>
            </div>
            <span class="stat-badge">{{ s.badge }}</span>
          </div>
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      }
    </div>

    <!-- Quick links -->
    <p class="section-title">Quick Access</p>
    <div class="quick-grid">
      @for (q of quick; track q.label) {
        <a class="quick-card" [routerLink]="q.route">
          <div class="quick-icon">
            <span class="material-symbols-outlined">{{ q.icon }}</span>
          </div>
          <div>
            <div class="quick-label">{{ q.label }}</div>
            <div class="quick-sub">{{ q.sub }}</div>
          </div>
        </a>
      }
    </div>
  `
})
export class DashboardComponent {
  firstName = computed(() => {
    const n = this.auth.currentUser()?.fullName ?? 'Manager';
    return n.split(' ')[0];
  });

  stats: StatCard[] = [
    { icon: 'person',          label: 'Total Students',    value: '248',  badge: '+12%' },
    { icon: 'school',          label: 'Active Tracks',     value: '14',   badge: '+2'   },
    { icon: 'groups',          label: 'Active Groups',     value: '22',   badge: 'Q4'   },
    { icon: 'event_available', label: 'Avg Attendance',    value: '87%',  badge: '+3%'  },
  ];

  quick = [
    { icon: 'grade',           label: 'Grades',        sub: 'View student scores',    route: '/grades' },
    { icon: 'event_available', label: 'Attendance',    sub: 'Session records',         route: '/attendance' },
    { icon: 'quiz',            label: 'Exams',         sub: 'Schedule & results',      route: '/exams' },
    { icon: 'analytics',       label: 'KPI',           sub: 'Performance indicators',  route: '/kpi' },
    { icon: 'notifications',   label: 'Notifications', sub: 'Alerts & updates',        route: '/notifications' },
    { icon: 'person',          label: 'Students',      sub: 'Directory & profiles',    route: '/students' },
  ];

  constructor(private auth: AuthService) {}
}
