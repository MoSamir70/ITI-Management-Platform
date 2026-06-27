import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface StudentAttendanceSummaryDto {
  courseId: number;
  courseName: string;
  totalSessions: number;
  absentSessions: number;
  excusedSessions: number;
  absencePercentage: number;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [],
  template: `
    <div class="page-header">
      <h1>My Attendance</h1>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (records().length === 0) {
      <div class="card" style="text-align:center;color:var(--color-text-muted)">No attendance records yet.</div>
    } @else {
      <div class="card" style="padding:0;overflow:hidden">
        <table>
          <thead>
            <tr>
              <th>Course</th><th>Total Sessions</th><th>Absent</th>
              <th>Excused</th><th>Unexcused %</th>
            </tr>
          </thead>
          <tbody>
            @for (r of records(); track r.courseId) {
              <tr>
                <td>{{ r.courseName }}</td>
                <td>{{ r.totalSessions }}</td>
                <td>{{ r.absentSessions }}</td>
                <td>{{ r.excusedSessions }}</td>
                <td [style.color]="r.absencePercentage > 25 ? 'var(--color-danger)' : 'inherit'">
                  {{ r.absencePercentage.toFixed(1) }}%
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
  records = signal<StudentAttendanceSummaryDto[]>([]);
  loading = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<StudentAttendanceSummaryDto[]>(`${environment.apiBase}/students/me/attendance`).subscribe({
      next: data => { this.records.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
