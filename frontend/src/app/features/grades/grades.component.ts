import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface GradeDto {
  id: string; studentName: string; courseName: string;
  labScore: number; examScore: number; totalScore: number;
  isPassed: boolean; submittedAt: string;
}

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <h1>Grades</h1>
      <button class="btn btn--primary">
        <span class="material-symbols-outlined">upload</span>
        Export Grades
      </button>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (grades().length === 0) {
      <div class="card">
        <div class="empty-state">
          <span class="material-symbols-outlined">grade</span>
          <p>No grade records yet.</p>
        </div>
      </div>
    } @else {
      <!-- Summary row -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">grade</span></div>
          <div class="stat-value">{{ grades().length }}</div>
          <div class="stat-label">Total Records</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">check_circle</span></div>
          <div class="stat-value">{{ passCount() }}</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">trending_up</span></div>
          <div class="stat-value">{{ avgTotal() | number:'1.1-1' }}</div>
          <div class="stat-label">Avg Score</div>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Lab</th>
              <th>Exam</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            @for (g of grades(); track g.id) {
              <tr>
                <td><strong>{{ g.studentName }}</strong></td>
                <td>{{ g.courseName }}</td>
                <td>{{ g.labScore | number:'1.0-0' }}</td>
                <td>{{ g.examScore | number:'1.0-0' }}</td>
                <td><strong>{{ g.totalScore | number:'1.0-0' }}</strong></td>
                <td>
                  <span [class]="g.isPassed ? 'badge badge--approved' : 'badge badge--rejected'">
                    {{ g.isPassed ? 'Passed' : 'Failed' }}
                  </span>
                </td>
                <td style="color:var(--secondary)">{{ g.submittedAt | date:'dd MMM yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class GradesComponent implements OnInit {
  grades  = signal<GradeDto[]>([]);
  loading = signal(true);

  passCount = () => this.grades().filter(g => g.isPassed).length;
  avgTotal  = () => {
    const gs = this.grades();
    return gs.length ? gs.reduce((s, g) => s + g.totalScore, 0) / gs.length : 0;
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<GradeDto[]>(`${environment.apiBase}/grades`).subscribe({
      next: data  => { this.grades.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false)
    });
  }
}

