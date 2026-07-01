import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { OrgService } from '../../core/services/org.service';
import { TrackService } from '../../core/services/track.service';
import { CourseService } from '../../core/services/course.service';
import { GroupService } from '../../core/services/group.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { CourseDto, TrackDto } from '../../core/models/academic.models';
import { GroupDto, StudentSummaryDto } from '../../core/models/group.models';
import { AbsenceRequestDto, SessionSummaryDto, SessionType } from '../../core/models/attendance.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { TableSkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, EmptyStateComponent, TableSkeletonComponent, StatusBadgeComponent, ModalShellComponent],
  styles: [`
    .filter-row { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid var(--surface-gray); flex-wrap: wrap; }
    .select {
      border: 1px solid var(--surface-gray); border-radius: 8px; padding: 10px 14px;
      font-size: 13px; font-weight: 600; color: var(--secondary); background: var(--surface-low);
    }
    .section-title { font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 700; margin: 32px 0 16px; }
    .roster-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--surface-gray); }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .field label { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--on-surface-var); }
    .field input, .field select {
      padding: 10px 12px; border-radius: 8px; border: 1px solid var(--surface-gray);
      background: var(--bg); font-size: 14px; outline: none;
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
    .row-actions { display: flex; justify-content: flex-end; gap: 4px; }
    .row-actions button {
      border: none; background: transparent; border-radius: 8px; padding: 6px 10px;
      color: var(--secondary); cursor: pointer; font-size: 12px; font-weight: 600;
    }
    .row-actions button.approve:hover { background: #e8f5e9; color: #2e7d32; }
    .row-actions button.reject:hover { background: #fce8e6; color: #ba1a1a; }
  `],
  template: `
    <div class="page-header">
      <div>
        <h1>Attendance</h1>
        <p style="color:var(--secondary);font-size:13px;margin-top:4px">Record sessions and manage absence requests.</p>
      </div>
      @if (canManage()) {
        <button class="btn btn--primary" (click)="openRecord()" [disabled]="!groupId()">
          <span class="material-symbols-outlined">add</span>
          Record Session
        </button>
      }
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="filter-row">
        @if (tracks().length > 0) {
          <select class="select" (change)="onTrackChange($event)">
            @for (t of tracks(); track t.id) { <option [value]="t.id" [selected]="t.id === trackId()">{{ t.name }}</option> }
          </select>
        }
        @if (courses().length > 0) {
          <select class="select" (change)="onCourseChange($event)">
            @for (c of courses(); track c.id) { <option [value]="c.id" [selected]="c.id === courseId()">{{ c.name }}</option> }
          </select>
        }
        @if (groups().length > 0) {
          <select class="select" (change)="onGroupChange($event)">
            @for (g of groups(); track g.id) { <option [value]="g.id" [selected]="g.id === groupId()">{{ g.name }}</option> }
          </select>
        }
      </div>

      @if (loading()) {
        <app-table-skeleton [rows]="4" [columns]="4" />
      } @else if (error()) {
        <app-empty-state icon="error" message="Failed to load sessions." actionLabel="Retry" (action)="loadSessions()" />
      } @else if (sessions().length === 0) {
        <app-empty-state icon="event_available" message="No sessions recorded yet for this batch." />
      } @else {
        <table class="data-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Session #</th><th>Attendance</th></tr>
          </thead>
          <tbody>
            @for (s of sessions(); track s.sessionDate + '-' + s.sessionOrdinal) {
              <tr>
                <td>{{ s.sessionDate | date:'dd MMM yyyy' }}</td>
                <td>{{ s.sessionType === 0 ? 'Online' : 'Offline' }}</td>
                <td>{{ s.sessionOrdinal }}</td>
                <td>
                  {{ s.totalStudents - s.absentCount }}/{{ s.totalStudents }} present
                  ({{ (100 - (s.absentCount / s.totalStudents * 100)) | number:'1.0-0' }}%)
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (canManage()) {
      <p class="section-title">Absence Requests</p>
      <div class="card" style="padding:0;overflow:hidden">
        @if (requestsLoading()) {
          <app-table-skeleton [rows]="3" [columns]="4" />
        } @else if (requests().length === 0) {
          <app-empty-state icon="assignment_turned_in" message="No pending absence requests." />
        } @else {
          <table class="data-table">
            <thead><tr><th>Student</th><th>Dates</th><th>Reason</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
            <tbody>
              @for (r of requests(); track r.id) {
                <tr>
                  <td><strong>{{ r.studentName }}</strong></td>
                  <td style="color:var(--secondary)">{{ r.requestedDates.length }} day(s)</td>
                  <td style="color:var(--secondary);max-width:240px">{{ r.reason }}</td>
                  <td><app-status-badge [label]="statusLabel(r.status)" [tone]="statusTone(r.status)" /></td>
                  <td class="row-actions">
                    @if (r.status === 0) {
                      <button class="approve" (click)="review(r, true)">Approve</button>
                      <button class="reject" (click)="review(r, false)">Reject</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    @if (recordOpen()) {
      <app-modal-shell title="Record Attendance Session" size="md" (close)="recordOpen.set(false)">
        <div class="form-grid">
          <div class="field">
            <label>Date</label>
            <input type="date" [(ngModel)]="sessionDate" [ngModelOptions]="{standalone:true}" />
          </div>
          <div class="field">
            <label>Type</label>
            <select [(ngModel)]="sessionType" [ngModelOptions]="{standalone:true}">
              <option [value]="1">Offline</option>
              <option [value]="0">Online</option>
            </select>
          </div>
          <div class="field">
            <label>Session #</label>
            <input type="number" min="1" [(ngModel)]="sessionOrdinal" [ngModelOptions]="{standalone:true}" />
          </div>
        </div>
        <p style="font-size:12px;font-weight:600;color:var(--secondary);text-transform:uppercase;margin-bottom:8px">Roster</p>
        @for (s of roster(); track s.id) {
          <div class="roster-row">
            <span>{{ s.fullName }}</span>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px">
              <input type="checkbox" [checked]="!absentSet.has(s.id)" (change)="togglePresent(s.id)" />
              Present
            </label>
          </div>
        }
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" (click)="recordOpen.set(false)">Cancel</button>
          <button type="button" class="btn btn--primary" (click)="saveSession()" [disabled]="saving()">
            {{ saving() ? 'Saving…' : 'Save Session' }}
          </button>
        </div>
      </app-modal-shell>
    }
  `
})
export class AttendanceComponent implements OnInit {
  tracks  = signal<TrackDto[]>([]);
  trackId = signal<number | null>(null);
  courses = signal<CourseDto[]>([]);
  courseId = signal<number | null>(null);
  groups  = signal<GroupDto[]>([]);
  groupId = signal<number | null>(null);

  sessions = signal<SessionSummaryDto[]>([]);
  loading  = signal(true);
  error    = signal(false);

  requests = signal<AbsenceRequestDto[]>([]);
  requestsLoading = signal(true);

  recordOpen = signal(false);
  saving = signal(false);
  roster = signal<StudentSummaryDto[]>([]);
  absentSet = new Set<string>();
  sessionDate = new Date().toISOString().substring(0, 10);
  sessionType = 1;
  sessionOrdinal = 1;

  canManage = () => this.auth.hasRole('TrainingManager', 'Supervisor', 'TA');

  constructor(
    private org: OrgService,
    private trackSvc: TrackService,
    private courseSvc: CourseService,
    private groupSvc: GroupService,
    private attendance: AttendanceService,
    private toast: ToastService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.loading.set(true);
    this.org.listBranches().pipe(
      switchMap(branches => branches[0] ? this.org.listIntakes(branches[0].id) : of([])),
      switchMap(intakes => intakes[0] ? this.trackSvc.list(intakes[0].id) : of([])),
      catchError(() => { this.error.set(true); return of([]); })
    ).subscribe(tracks => {
      this.tracks.set(tracks);
      const t = tracks[0];
      if (t) { this.trackId.set(t.id); this.loadCoursesAndGroups(); }
      else { this.loading.set(false); }
    });

    if (this.canManage()) {
      this.requestsLoading.set(true);
      this.attendance.listAbsenceRequests().pipe(
        catchError(() => of([] as AbsenceRequestDto[])),
        finalize(() => this.requestsLoading.set(false))
      ).subscribe(list => this.requests.set(list));
    } else {
      this.requestsLoading.set(false);
    }
  }

  loadCoursesAndGroups() {
    const id = this.trackId();
    if (!id) return;
    this.courseSvc.list(id).subscribe(list => {
      this.courses.set(list);
      const c = list[0];
      if (c) this.courseId.set(c.id);
    });
    this.groupSvc.list(id).subscribe(list => {
      this.groups.set(list);
      const g = list[0];
      if (g) { this.groupId.set(g.id); this.loadSessions(); }
      else { this.loading.set(false); }
    });
  }

  loadSessions() {
    const c = this.courseId(); const g = this.groupId();
    if (!c || !g) return;
    this.loading.set(true);
    this.error.set(false);
    this.attendance.listSessions(c, g).pipe(
      catchError(() => { this.error.set(true); return of([] as SessionSummaryDto[]); }),
      finalize(() => this.loading.set(false))
    ).subscribe(list => this.sessions.set(list));
  }

  onTrackChange(e: Event) { this.trackId.set(Number((e.target as HTMLSelectElement).value)); this.loadCoursesAndGroups(); }
  onCourseChange(e: Event) { this.courseId.set(Number((e.target as HTMLSelectElement).value)); this.loadSessions(); }
  onGroupChange(e: Event) { this.groupId.set(Number((e.target as HTMLSelectElement).value)); this.loadSessions(); }

  openRecord() {
    const g = this.groupId();
    if (!g) return;
    this.absentSet.clear();
    this.sessionDate = new Date().toISOString().substring(0, 10);
    this.sessionType = 1;
    this.sessionOrdinal = (this.sessions().length + 1);
    this.groupSvc.listStudents(g).subscribe(students => {
      this.roster.set(students);
      this.recordOpen.set(true);
    });
  }

  togglePresent(studentId: string) {
    if (this.absentSet.has(studentId)) this.absentSet.delete(studentId);
    else this.absentSet.add(studentId);
  }

  saveSession() {
    const c = this.courseId(); const g = this.groupId();
    if (!c || !g) return;
    this.saving.set(true);
    this.attendance.recordSession(c, g, {
      sessionDate: this.sessionDate,
      sessionType: Number(this.sessionType) as SessionType,
      sessionOrdinal: Number(this.sessionOrdinal),
      entries: this.roster().map(s => ({ studentId: s.id, isAbsent: this.absentSet.has(s.id), notes: null }))
    }).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.toast.success('Session recorded successfully.'); this.recordOpen.set(false); this.loadSessions(); },
      error: err => this.toast.error(err.error?.title ?? 'Failed to record session.')
    });
  }

  statusLabel(status: number) { return status === 0 ? 'Pending' : status === 1 ? 'Approved' : 'Rejected'; }
  statusTone(status: number): 'pending' | 'approved' | 'rejected' {
    return status === 0 ? 'pending' : status === 1 ? 'approved' : 'rejected';
  }

  review(r: AbsenceRequestDto, approve: boolean) {
    this.attendance.reviewAbsenceRequest(r.id, approve).subscribe({
      next: () => {
        this.toast.success(approve ? 'Request approved.' : 'Request rejected.');
        this.requests.update(list => list.map(x => x.id === r.id ? { ...x, status: approve ? 1 : 2 } : x));
      },
      error: () => this.toast.error('Failed to review request.')
    });
  }
}
