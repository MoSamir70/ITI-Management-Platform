import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface AttendanceDto {
  studentId: string; studentName: string;
  totalSessions: number; attendedSessions: number; attendanceRate: number;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="page-header">
      <h1>Attendance</h1>
      <button class="btn btn--primary">
        <span class="material-symbols-outlined">download</span>
        Export Report
      </button>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (records().length === 0) {
      <div class="card">
        <div class="empty-state">
          <span class="material-symbols-outlined">event_available</span>
          <p>No attendance records yet.</p>
        </div>
      </div>
    } @else {
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">groups</span></div>
          <div class="stat-value">{{ records().length }}</div>
          <div class="stat-label">Students Tracked</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">event_available</span></div>
          <div class="stat-value">{{ avgRate() | number:'1.0-0' }}%</div>
          <div class="stat-label">Avg Attendance Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">warning</span></div>
          <div class="stat-value">{{ lowCount() }}</div>
          <div class="stat-label">Below 75%</div>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Sessions Attended</th>
              <th>Total Sessions</th>
              <th>Attendance Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (r of records(); track r.studentId) {
              <tr>
                <td><strong>{{ r.studentName }}</strong></td>
                <td>{{ r.attendedSessions }}</td>
                <td>{{ r.totalSessions }}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:80px;height:6px;background:var(--surface-gray);border-radius:3px;overflow:hidden">
                      <div [style.width.%]="r.attendanceRate"
                           [style.background]="r.attendanceRate >= 75 ? 'var(--iti-red)' : '#ba1a1a'"
                           style="height:100%;border-radius:3px"></div>
                    </div>
                    <span>{{ r.attendanceRate | number:'1.0-0' }}%</span>
                  </div>
                </td>
                <td>
                  <span [class]="r.attendanceRate >= 75 ? 'badge badge--approved' : 'badge badge--rejected'">
                    {{ r.attendanceRate >= 75 ? 'Good' : 'At Risk' }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class AttendanceComponent implements OnInit {
  records = signal<AttendanceDto[]>([]);
  loading = signal(true);

  avgRate  = () => { const r = this.records(); return r.length ? r.reduce((s, x) => s + x.attendanceRate, 0) / r.length : 0; };
  lowCount = () => this.records().filter(r => r.attendanceRate < 75).length;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<AttendanceDto[]>(`${environment.apiBase}/attendance/summary`).subscribe({
      next: data => { this.records.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }
}

