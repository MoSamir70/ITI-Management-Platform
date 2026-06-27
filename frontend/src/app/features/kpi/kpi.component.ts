import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface KpiDto {
  id: number;
  kpiType: string;
  title: string;
  status: string;
  submittedAt: string;
  reviewNote: string | null;
}

@Component({
  selector: 'app-kpi',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page-header">
      <h1>My KPI Submissions</h1>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (kpis().length === 0) {
      <div class="card" style="text-align:center;color:var(--color-text-muted)">No KPI submissions yet.</div>
    } @else {
      <div class="card" style="padding:0;overflow:hidden">
        <table>
          <thead>
            <tr>
              <th>Title</th><th>Type</th><th>Submitted</th><th>Status</th><th>Review Note</th>
            </tr>
          </thead>
          <tbody>
            @for (k of kpis(); track k.id) {
              <tr>
                <td>{{ k.title }}</td>
                <td>{{ k.kpiType }}</td>
                <td>{{ k.submittedAt | date:'dd MMM yyyy' }}</td>
                <td>
                  <span [class]="'badge badge--' + k.status.toLowerCase()">{{ k.status }}</span>
                </td>
                <td>{{ k.reviewNote ?? '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class KpiComponent implements OnInit {
  kpis = signal<KpiDto[]>([]);
  loading = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<KpiDto[]>(`${environment.apiBase}/kpi/me`).subscribe({
      next: data => { this.kpis.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
