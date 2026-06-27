import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface StudentGradeDto {
  courseId: number;
  courseName: string;
  labGrade: number | null;
  examGrade: number | null;
  totalGrade: number | null;
  absencePercentage: number | null;
  publishedAt: string | null;
}

@Component({
  selector: 'app-grades',
  standalone: true,
  template: `
    <div class="page-header">
      <h1>My Grades</h1>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (grades().length === 0) {
      <div class="card" style="text-align:center;color:var(--color-text-muted)">No grades available yet.</div>
    } @else {
      <div class="card" style="padding:0;overflow:hidden">
        <table>
          <thead>
            <tr>
              <th>Course</th><th>Lab</th><th>Exam</th><th>Total</th>
              <th>Absence %</th><th>Published</th>
            </tr>
          </thead>
          <tbody>
            @for (g of grades(); track g.courseId) {
              <tr>
                <td>{{ g.courseName }}</td>
                <td>{{ g.labGrade ?? '—' }}</td>
                <td>{{ g.examGrade ?? '—' }}</td>
                <td><strong>{{ g.totalGrade ?? '—' }}</strong></td>
                <td>{{ g.absencePercentage !== null ? (g.absencePercentage | number:'1.0-1') + '%' : '—' }}</td>
                <td>{{ g.publishedAt ? (g.publishedAt | date:'dd MMM yyyy') : 'Pending' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  imports: [DecimalPipe, DatePipe]
})
export class GradesComponent implements OnInit {
  grades = signal<StudentGradeDto[]>([]);
  loading = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<StudentGradeDto[]>(`${environment.apiBase}/students/me/grades`).subscribe({
      next: data => { this.grades.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
