import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { OrgService } from '../../core/services/org.service';
import { TrackService } from '../../core/services/track.service';
import { CourseService } from '../../core/services/course.service';
import { GradeService } from '../../core/services/grade.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { CourseDto, TrackDto } from '../../core/models/academic.models';
import { GradeRowDto } from '../../core/models/grade.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { TableSkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [DecimalPipe, EmptyStateComponent, TableSkeletonComponent, StatusBadgeComponent],
  styles: [`
    .filter-row { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid var(--surface-gray); flex-wrap: wrap; }
    .select {
      border: 1px solid var(--surface-gray); border-radius: 8px; padding: 10px 14px;
      font-size: 13px; font-weight: 600; color: var(--secondary); background: var(--surface-low);
    }
    .grade-input {
      width: 70px; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--surface-gray);
      font-size: 13px; text-align: center;
    }
    .grade-input:focus { border-color: var(--iti-red); outline: none; box-shadow: 0 0 0 2px rgba(176,54,51,.1); }
    .grade-input:disabled { background: var(--surface-low); color: var(--secondary); }
  `],
  template: `
    <div class="page-header">
      <div>
        <h1>Grades</h1>
        <p style="color:var(--secondary);font-size:13px;margin-top:4px">Enter and publish student grades per course.</p>
      </div>
      @if (canManage() && courseId() && rows().length > 0) {
        <button class="btn btn--primary" (click)="publish()" [disabled]="publishing()">
          <span class="material-symbols-outlined">publish</span>
          {{ publishing() ? 'Publishing…' : 'Publish Grades' }}
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
      </div>

      @if (loading()) {
        <app-table-skeleton [rows]="5" [columns]="5" />
      } @else if (error()) {
        <app-empty-state icon="error" message="Failed to load grades." actionLabel="Retry" (action)="loadGrades()" />
      } @else if (rows().length === 0) {
        <app-empty-state icon="grade" message="No students enrolled in this course yet." />
      } @else {
        <table class="data-table">
          <thead>
            <tr><th>Student</th><th>Lab</th><th>Exam</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.studentId) {
              <tr>
                <td><strong>{{ r.studentName }}</strong></td>
                <td>
                  <input class="grade-input" type="number" min="0" max="100" [value]="r.labGrade ?? ''"
                         [disabled]="r.isPublished || !canManage()"
                         (change)="onLabChange(r, $event)" />
                </td>
                <td>
                  <input class="grade-input" type="number" min="0" max="100" [value]="r.examGrade ?? ''"
                         [disabled]="r.isPublished || !canManage()"
                         (change)="onExamChange(r, $event)" />
                </td>
                <td><strong>{{ r.totalGrade != null ? (r.totalGrade | number:'1.0-1') : '—' }}</strong></td>
                <td><app-status-badge [label]="r.isPublished ? 'Published' : 'Draft'" [tone]="r.isPublished ? 'approved' : 'pending'" /></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class GradesComponent implements OnInit {
  tracks  = signal<TrackDto[]>([]);
  trackId = signal<number | null>(null);
  courses = signal<CourseDto[]>([]);
  courseId = signal<number | null>(null);
  rows    = signal<GradeRowDto[]>([]);
  loading = signal(true);
  error   = signal(false);
  publishing = signal(false);

  canManage = () => this.auth.hasRole('TrainingManager', 'Supervisor', 'TA');

  constructor(
    private org: OrgService,
    private trackSvc: TrackService,
    private courseSvc: CourseService,
    private grades: GradeService,
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
      if (t) { this.trackId.set(t.id); this.loadCourses(); }
      else { this.loading.set(false); }
    });
  }

  loadCourses() {
    const id = this.trackId();
    if (!id) return;
    this.courseSvc.list(id).subscribe(list => {
      this.courses.set(list);
      const c = list[0];
      if (c) { this.courseId.set(c.id); this.loadGrades(); }
      else { this.loading.set(false); this.rows.set([]); }
    });
  }

  loadGrades() {
    const id = this.courseId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(false);
    this.grades.listForCourse(id).pipe(
      catchError(() => { this.error.set(true); return of([] as GradeRowDto[]); }),
      finalize(() => this.loading.set(false))
    ).subscribe(list => this.rows.set(list));
  }

  onTrackChange(e: Event) {
    this.trackId.set(Number((e.target as HTMLSelectElement).value));
    this.loadCourses();
  }
  onCourseChange(e: Event) {
    this.courseId.set(Number((e.target as HTMLSelectElement).value));
    this.loadGrades();
  }

  onLabChange(r: GradeRowDto, e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    const courseId = this.courseId();
    if (!courseId || isNaN(value)) return;
    this.grades.setLab(courseId, r.studentId, value).subscribe({
      next: () => { this.toast.success(`Lab grade saved for ${r.studentName}.`); this.loadGrades(); },
      error: err => this.toast.error(err.error?.title ?? 'Failed to save lab grade.')
    });
  }
  onExamChange(r: GradeRowDto, e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    const courseId = this.courseId();
    if (!courseId || isNaN(value)) return;
    this.grades.setExam(courseId, r.studentId, value).subscribe({
      next: () => { this.toast.success(`Exam grade saved for ${r.studentName}.`); this.loadGrades(); },
      error: err => this.toast.error(err.error?.title ?? 'Failed to save exam grade.')
    });
  }

  publish() {
    const id = this.courseId();
    if (!id) return;
    this.publishing.set(true);
    this.grades.publish(id).pipe(finalize(() => this.publishing.set(false))).subscribe({
      next: () => { this.toast.success('Grades published to students.'); this.loadGrades(); },
      error: err => {
        if (err.error?.title === 'incomplete_grades') this.toast.error('Some students are missing grades.');
        else this.toast.error(err.error?.title ?? 'Failed to publish grades.');
      }
    });
  }
}
