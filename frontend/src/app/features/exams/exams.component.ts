import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface ExamDto {
  id: string; title: string; courseName: string;
  scheduledAt: string; durationMinutes: number;
  status: string; totalMarks: number;
}

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page-header">
      <h1>Exams</h1>
      <button class="btn btn--primary">
        <span class="material-symbols-outlined">add</span>
        Schedule Exam
      </button>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (exams().length === 0) {
      <div class="card">
        <div class="empty-state">
          <span class="material-symbols-outlined">quiz</span>
          <p>No exams scheduled yet.</p>
        </div>
      </div>
    } @else {
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">quiz</span></div>
          <div class="stat-value">{{ exams().length }}</div>
          <div class="stat-label">Total Exams</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">pending</span></div>
          <div class="stat-value">{{ pendingCount() }}</div>
          <div class="stat-label">Upcoming</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">check_circle</span></div>
          <div class="stat-value">{{ publishedCount() }}</div>
          <div class="stat-label">Published</div>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Exam Title</th>
              <th>Course</th>
              <th>Scheduled</th>
              <th>Duration</th>
              <th>Total Marks</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (e of exams(); track e.id) {
              <tr>
                <td><strong>{{ e.title }}</strong></td>
                <td>{{ e.courseName }}</td>
                <td style="color:var(--secondary)">{{ e.scheduledAt | date:'dd MMM yyyy, HH:mm' }}</td>
                <td>{{ e.durationMinutes }} min</td>
                <td>{{ e.totalMarks }}</td>
                <td>
                  <span [class]="statusClass(e.status)">{{ e.status }}</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class ExamsComponent implements OnInit {
  exams   = signal<ExamDto[]>([]);
  loading = signal(true);

  pendingCount   = () => this.exams().filter(e => e.status === 'Scheduled').length;
  publishedCount = () => this.exams().filter(e => e.status === 'Published').length;

  statusClass(status: string) {
    const map: Record<string, string> = {
      'Scheduled': 'badge badge--pending',
      'Published': 'badge badge--approved',
      'Cancelled': 'badge badge--rejected',
    };
    return map[status] ?? 'badge badge--active';
  }

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<ExamDto[]>(`${environment.apiBase}/exams`).subscribe({
      next: data => { this.exams.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }
}

