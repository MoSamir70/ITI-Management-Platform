import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface KpiDto {
  id: string; studentName: string; supervisorName: string;
  score: number; notes: string; status: string; submittedAt: string;
}

@Component({
  selector: 'app-kpi',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="page-header">
      <h1>KPI Reviews</h1>
      <button class="btn btn--primary">
        <span class="material-symbols-outlined">add_chart</span>
        New Review
      </button>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (kpis().length === 0) {
      <div class="card">
        <div class="empty-state">
          <span class="material-symbols-outlined">analytics</span>
          <p>No KPI records yet.</p>
        </div>
      </div>
    } @else {
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">analytics</span></div>
          <div class="stat-value">{{ kpis().length }}</div>
          <div class="stat-label">Total Reviews</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">star</span></div>
          <div class="stat-value">{{ avgScore() | number:'1.1-1' }}</div>
          <div class="stat-label">Avg Score (/ 10)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">pending_actions</span></div>
          <div class="stat-value">{{ pendingCount() }}</div>
          <div class="stat-label">Pending Review</div>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Supervisor</th>
              <th>Score</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            @for (k of kpis(); track k.id) {
              <tr>
                <td><strong>{{ k.studentName }}</strong></td>
                <td>{{ k.supervisorName }}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-weight:700;color:var(--primary)">{{ k.score | number:'1.1-1' }}</span>
                    <span style="font-size:11px;color:var(--secondary)">/10</span>
                  </div>
                </td>
                <td style="color:var(--secondary);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  {{ k.notes }}
                </td>
                <td>
                  <span [class]="k.status === 'Approved' ? 'badge badge--approved' : k.status === 'Pending' ? 'badge badge--pending' : 'badge badge--rejected'">
                    {{ k.status }}
                  </span>
                </td>
                <td style="color:var(--secondary)">{{ k.submittedAt | date:'dd MMM yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class KpiComponent implements OnInit {
  kpis    = signal<KpiDto[]>([]);
  loading = signal(true);

  avgScore     = () => { const k = this.kpis(); return k.length ? k.reduce((s, x) => s + x.score, 0) / k.length : 0; };
  pendingCount = () => this.kpis().filter(k => k.status === 'Pending').length;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<KpiDto[]>(`${environment.apiBase}/kpi`).subscribe({
      next: data => { this.kpis.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }
}

