import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface UserDto {
  id: string; fullName: string; email: string; role: string;
  isActive: boolean; groupName?: string;
}

@Component({
  selector: 'app-students',
  standalone: true,
  template: `
    <div class="page-header">
      <h1>Students</h1>
      <button class="btn btn--primary">
        <span class="material-symbols-outlined">person_add</span>
        Add Student
      </button>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (students().length === 0) {
      <div class="card">
        <div class="empty-state">
          <span class="material-symbols-outlined">person</span>
          <p>No students enrolled yet.</p>
        </div>
      </div>
    } @else {
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">groups</span></div>
          <div class="stat-value">{{ students().length }}</div>
          <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">check_circle</span></div>
          <div class="stat-value">{{ activeCount() }}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box"><span class="material-symbols-outlined stat-icon icon-fill">group</span></div>
          <div class="stat-value">{{ groupCount() }}</div>
          <div class="stat-label">With Groups</div>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Group</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (s of students(); track s.id) {
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:34px;height:34px;border-radius:50%;background:rgba(143,29,30,.1);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--primary)">
                      {{ initials(s.fullName) }}
                    </div>
                    <strong>{{ s.fullName }}</strong>
                  </div>
                </td>
                <td style="color:var(--secondary)">{{ s.email }}</td>
                <td>{{ s.groupName ?? 'â€”' }}</td>
                <td>
                  <span [class]="s.isActive ? 'badge badge--approved' : 'badge badge--rejected'">
                    {{ s.isActive ? 'Active' : 'Inactive' }}
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
export class StudentsComponent implements OnInit {
  students = signal<UserDto[]>([]);
  loading  = signal(true);

  activeCount = () => this.students().filter(s => s.isActive).length;
  groupCount  = () => this.students().filter(s => !!s.groupName).length;
  initials    = (name: string) => name.split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase();

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<UserDto[]>(`${environment.apiBase}/users?role=Student`).subscribe({
      next: data => { this.students.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }
}

