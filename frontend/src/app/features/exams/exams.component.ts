import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { OrgService } from '../../core/services/org.service';
import { TrackService } from '../../core/services/track.service';
import { CourseService } from '../../core/services/course.service';
import { ExamService } from '../../core/services/exam.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { CourseDto, TrackDto } from '../../core/models/academic.models';
import { ExamDto } from '../../core/models/exam.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { TableSkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [
    DatePipe, ReactiveFormsModule, EmptyStateComponent, TableSkeletonComponent,
    StatusBadgeComponent, ModalShellComponent
  ],
  styles: [`
    .filter-row { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid var(--surface-gray); flex-wrap: wrap; }
    .select {
      border: 1px solid var(--surface-gray); border-radius: 8px; padding: 10px 14px;
      font-size: 13px; font-weight: 600; color: var(--secondary); background: var(--surface-low);
    }
    .row-actions { display: flex; justify-content: flex-end; gap: 4px; }
    .row-actions button {
      width: 32px; height: 32px; border: none; background: transparent; border-radius: 8px;
      color: var(--secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s;
    }
    .row-actions button:hover { background: var(--surface-low); color: var(--on-surface); }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .field label { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--on-surface-var); }
    .field input, .field select, .field textarea {
      padding: 10px 12px; border-radius: 8px; border: 1px solid var(--surface-gray);
      background: var(--bg); font-size: 14px; font-family: 'Inter', sans-serif; outline: none;
    }
    .field input:focus, .field textarea:focus { border-color: var(--iti-red); box-shadow: 0 0 0 3px rgba(176,54,51,.1); }
    .field input.is-invalid { border-color: #ba1a1a; }
    .field .err { font-size: 12px; color: #ba1a1a; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  `],
  template: `
    <div class="page-header">
      <div>
        <h1>Exams</h1>
        <p style="color:var(--secondary);font-size:13px;margin-top:4px">Schedule and publish exams per course.</p>
      </div>
      @if (canManage()) {
        <button class="btn btn--primary" (click)="openCreate()" [disabled]="!courseId()">
          <span class="material-symbols-outlined">add</span>
          Schedule Exam
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
        <app-table-skeleton [rows]="3" [columns]="5" />
      } @else if (error()) {
        <app-empty-state icon="error" message="Failed to load exams." actionLabel="Retry" (action)="load()" />
      } @else if (items().length === 0) {
        <app-empty-state icon="quiz" message="No exams scheduled for this course." />
      } @else {
        <table class="data-table">
          <thead>
            <tr><th>Date</th><th>Location / Link</th><th>Duration</th><th>Status</th><th style="text-align:right">Actions</th></tr>
          </thead>
          <tbody>
            @for (e of items(); track e.id) {
              <tr>
                <td>{{ e.examDate | date:'dd MMM yyyy, HH:mm' }}</td>
                <td style="color:var(--secondary)">{{ e.location ?? e.examLink ?? '—' }}</td>
                <td>{{ e.durationMinutes }} min</td>
                <td><app-status-badge [label]="e.isPublished ? 'Published' : 'Draft'" [tone]="e.isPublished ? 'approved' : 'pending'" /></td>
                <td class="row-actions">
                  @if (canManage()) {
                    <button title="Edit" (click)="openEdit(e)"><span class="material-symbols-outlined">edit</span></button>
                    @if (!e.isPublished) {
                      <button title="Publish" (click)="publish(e)"><span class="material-symbols-outlined">publish</span></button>
                    }
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (dialogMode()) {
      <app-modal-shell [title]="dialogMode() === 'create' ? 'Schedule Exam' : 'Edit Exam'" size="md" (close)="closeDialog()">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <div class="field">
              <label>Exam Date & Time</label>
              <input formControlName="examDate" type="datetime-local"
                     [class.is-invalid]="form.get('examDate')?.invalid && form.get('examDate')?.touched" />
              @if (form.get('examDate')?.invalid && form.get('examDate')?.touched) { <span class="err">Date is required</span> }
            </div>
            <div class="field">
              <label>Duration (minutes)</label>
              <input formControlName="durationMinutes" type="number" min="1" max="600"
                     [class.is-invalid]="form.get('durationMinutes')?.invalid && form.get('durationMinutes')?.touched" />
            </div>
            <div class="field">
              <label>Location</label>
              <input formControlName="location" placeholder="e.g. Hall B-12" />
            </div>
            <div class="field">
              <label>Online Link</label>
              <input formControlName="examLink" placeholder="https://…" />
            </div>
          </div>
          <div class="field">
            <label>Notes</label>
            <textarea formControlName="notes" rows="3" placeholder="Optional notes for students"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" (click)="closeDialog()">Cancel</button>
            <button type="submit" class="btn btn--primary" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
          </div>
        </form>
      </app-modal-shell>
    }
  `
})
export class ExamsComponent implements OnInit {
  tracks   = signal<TrackDto[]>([]);
  trackId  = signal<number | null>(null);
  courses  = signal<CourseDto[]>([]);
  courseId = signal<number | null>(null);
  items    = signal<ExamDto[]>([]);
  loading  = signal(true);
  error    = signal(false);

  dialogMode = signal<'create' | 'edit' | null>(null);
  editingId  = signal<number | null>(null);
  saving     = signal(false);

  canManage = () => this.auth.hasRole('TrainingManager', 'Supervisor', 'TA');

  form = this.fb.nonNullable.group({
    examDate: ['', Validators.required],
    durationMinutes: [120, [Validators.required, Validators.min(1), Validators.max(600)]],
    location: [''],
    examLink: [''],
    notes: [''],
  });

  constructor(
    private org: OrgService,
    private trackSvc: TrackService,
    private courseSvc: CourseService,
    private exams: ExamService,
    private toast: ToastService,
    private auth: AuthService,
    private fb: FormBuilder
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
      if (c) { this.courseId.set(c.id); this.load(); }
      else { this.loading.set(false); this.items.set([]); }
    });
  }

  load() {
    const id = this.courseId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(false);
    this.exams.listForCourse(id).pipe(
      catchError(() => { this.error.set(true); return of([] as ExamDto[]); }),
      finalize(() => this.loading.set(false))
    ).subscribe(list => this.items.set(list));
  }

  onTrackChange(e: Event) { this.trackId.set(Number((e.target as HTMLSelectElement).value)); this.loadCourses(); }
  onCourseChange(e: Event) { this.courseId.set(Number((e.target as HTMLSelectElement).value)); this.load(); }

  openCreate() {
    this.form.reset({ examDate: '', durationMinutes: 120, location: '', examLink: '', notes: '' });
    this.editingId.set(null);
    this.dialogMode.set('create');
  }

  openEdit(e: ExamDto) {
    this.editingId.set(e.id);
    this.form.reset({
      examDate: e.examDate?.substring(0, 16) ?? '', durationMinutes: e.durationMinutes,
      location: e.location ?? '', examLink: e.examLink ?? '', notes: e.notes ?? ''
    });
    this.dialogMode.set('edit');
  }

  closeDialog() { this.dialogMode.set(null); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const courseId = this.courseId();
    this.saving.set(true);

    if (this.dialogMode() === 'create') {
      if (!courseId) { this.saving.set(false); return; }
      this.exams.create(courseId, {
        examType: 0, examDate: v.examDate, durationMinutes: v.durationMinutes,
        location: v.location || null, examLink: v.examLink || null, notes: v.notes || null
      }).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => { this.toast.success('Exam scheduled successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to schedule exam.')
      });
    } else {
      const id = this.editingId();
      if (!id) return;
      this.exams.update(id, {
        examDate: v.examDate, durationMinutes: v.durationMinutes,
        location: v.location || null, examLink: v.examLink || null, notes: v.notes || null
      }).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => { this.toast.success('Exam updated successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to update exam.')
      });
    }
  }

  publish(e: ExamDto) {
    this.exams.publish(e.id).subscribe({
      next: () => { this.toast.success('Exam published — students notified.'); this.load(); },
      error: err => this.toast.error(err.error?.title ?? 'Failed to publish exam.')
    });
  }
}
