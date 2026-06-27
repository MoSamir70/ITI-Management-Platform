import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface ExamDto {
  id: number;
  courseName: string;
  examType: string;
  examDate: string;
  location: string | null;
  examLink: string | null;
  durationMinutes: number;
  notes: string | null;
}

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page-header">
      <h1>My Exams</h1>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (exams().length === 0) {
      <div class="card" style="text-align:center;color:var(--color-text-muted)">No upcoming exams.</div>
    } @else {
      <div class="card" style="padding:0;overflow:hidden">
        <table>
          <thead>
            <tr>
              <th>Course</th><th>Type</th><th>Date</th>
              <th>Location / Link</th><th>Duration</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            @for (e of exams(); track e.id) {
              <tr>
                <td>{{ e.courseName }}</td>
                <td>
                  <span [class]="'badge badge--' + (e.examType === 'Regular' ? 'approved' : 'pending')">
                    {{ e.examType }}
                  </span>
                </td>
                <td>{{ e.examDate | date:'EEE, dd MMM yyyy HH:mm' }}</td>
                <td>{{ e.location ?? e.examLink ?? '—' }}</td>
                <td>{{ e.durationMinutes }} min</td>
                <td>{{ e.notes ?? '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class ExamsComponent implements OnInit {
  exams = signal<ExamDto[]>([]);
  loading = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<ExamDto[]>(`${environment.apiBase}/students/me/exams`).subscribe({
      next: data => { this.exams.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
