import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { OrgService } from '../../core/services/org.service';
import { TrackService } from '../../core/services/track.service';
import { CourseService } from '../../core/services/course.service';
import { ToastService } from '../../shared/services/toast.service';
import { CourseDto, GradingMode, GradingModeLabels, TrackDto } from '../../core/models/academic.models';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { TableSkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    ReactiveFormsModule, SearchBarComponent, EmptyStateComponent, TableSkeletonComponent,
    StatusBadgeComponent, ModalShellComponent, ConfirmDialogComponent
  ],
  styles: [`
    .filter-row { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid var(--surface-gray); flex-wrap: wrap; }
    .track-select {
      border: 1px solid var(--surface-gray); border-radius: 8px; padding: 10px 14px;
      font-size: 13px; font-weight: 600; color: var(--secondary); background: var(--surface-low);
    }
    .row-actions { display: flex; justify-content: flex-end; gap: 4px; }
    .row-actions button {
      width: 32px; height: 32px; border: none; background: transparent; border-radius: 8px;
      color: var(--secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s;
    }
    .row-actions button:hover { background: var(--surface-low); color: var(--on-surface); }
    .row-actions button.danger:hover { background: #fce8e6; color: #ba1a1a; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .field label { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--on-surface-var); }
    .field input, .field select {
      padding: 10px 12px; border-radius: 8px; border: 1px solid var(--surface-gray);
      background: var(--bg); font-size: 14px; font-family: 'Inter', sans-serif; outline: none;
    }
    .field input:focus, .field select:focus { border-color: var(--iti-red); box-shadow: 0 0 0 3px rgba(176,54,51,.1); }
    .field input.is-invalid { border-color: #ba1a1a; }
    .field .err { font-size: 12px; color: #ba1a1a; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 16px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .checkbox-row { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
  `],
  template: `
    <div class="page-header">
      <div>
        <h1>Courses</h1>
        <p style="color:var(--secondary);font-size:13px;margin-top:4px">Manage courses within a program.</p>
      </div>
      <button class="btn btn--primary" (click)="openCreate()" [disabled]="!trackId()">
        <span class="material-symbols-outlined">add</span>
        New Course
      </button>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="filter-row">
        <app-search-bar placeholder="Search courses…" (valueChange)="onSearch($event)" />
        @if (tracks().length > 0) {
          <select class="track-select" (change)="onTrackChange($event)">
            @for (t of tracks(); track t.id) {
              <option [value]="t.id" [selected]="t.id === trackId()">{{ t.name }}</option>
            }
          </select>
        }
      </div>

      @if (loading()) {
        <app-table-skeleton [rows]="4" [columns]="5" />
      } @else if (error()) {
        <app-empty-state icon="error" message="Failed to load courses." actionLabel="Retry" (action)="load()" />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="menu_book" message="No courses found for this program." />
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Code</th><th>Grading Mode</th><th>Hours (Lec/Lab/Self)</th><th>Status</th><th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr>
                <td><strong>{{ c.name }}</strong><div style="font-size:11px;color:var(--secondary)">{{ c.instructorName }}</div></td>
                <td>{{ c.code }}</td>
                <td>{{ gradingLabel(c.gradingMode) }}</td>
                <td style="color:var(--secondary)">{{ c.lectureHours }}/{{ c.labHours }}/{{ c.selfStudyHours }}</td>
                <td><app-status-badge [label]="c.status === 0 ? 'Active' : 'Archived'" [tone]="c.status === 0 ? 'approved' : 'neutral'" /></td>
                <td class="row-actions">
                  <button title="Edit" (click)="openEdit(c)"><span class="material-symbols-outlined">edit</span></button>
                  @if (c.status === 0) {
                    <button class="danger" title="Archive" (click)="toArchive.set(c)"><span class="material-symbols-outlined">archive</span></button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (dialogMode()) {
      <app-modal-shell [title]="dialogMode() === 'create' ? 'New Course' : 'Edit Course'" size="lg" (close)="closeDialog()">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <div class="field">
              <label>Course Name</label>
              <input formControlName="name" placeholder="e.g. Angular Fundamentals"
                     [class.is-invalid]="form.get('name')?.invalid && form.get('name')?.touched" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) { <span class="err">Name is required (min 2 chars)</span> }
            </div>
            @if (dialogMode() === 'create') {
              <div class="field">
                <label>Code</label>
                <input formControlName="code" placeholder="e.g. NG-201"
                       [class.is-invalid]="form.get('code')?.invalid && form.get('code')?.touched" />
                @if (form.get('code')?.invalid && form.get('code')?.touched) { <span class="err">Code is required</span> }
              </div>
            }
            <div class="field">
              <label>Instructor</label>
              <input formControlName="instructorName" placeholder="e.g. Dr. Khaled Nasser" />
            </div>
            @if (dialogMode() === 'create') {
              <div class="field">
                <label>Grading Mode</label>
                <select formControlName="gradingMode">
                  <option [value]="0">Grades Only</option>
                  <option [value]="1">Grades + Absence</option>
                  <option [value]="2">Lab + Absence</option>
                  <option [value]="3">Exam Mode</option>
                </select>
              </div>
            }
          </div>
          <div class="form-grid-3">
            <div class="field">
              <label>Lecture Hours</label>
              <input formControlName="lectureHours" type="number" min="0" />
            </div>
            <div class="field">
              <label>Lab Hours</label>
              <input formControlName="labHours" type="number" min="0" />
            </div>
            <div class="field">
              <label>Self-Study Hours</label>
              <input formControlName="selfStudyHours" type="number" min="0" />
            </div>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="hasExam" formControlName="hasExam" />
            <label for="hasExam" style="text-transform:none;font-size:13px">Has Exam</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="certKpiC" formControlName="certificateKpiEnabled" />
            <label for="certKpiC" style="text-transform:none;font-size:13px">Enable Certificate KPI</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="freeKpiC" formControlName="freelanceKpiEnabled" />
            <label for="freeKpiC" style="text-transform:none;font-size:13px">Enable Freelance KPI</label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" (click)="closeDialog()">Cancel</button>
            <button type="submit" class="btn btn--primary" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
          </div>
        </form>
      </app-modal-shell>
    }

    @if (toArchive()) {
      <app-confirm-dialog
        title="Archive Course"
        [message]="'Archive ' + toArchive()!.name + '? It will be hidden from active listings.'"
        confirmLabel="Archive" icon="archive" [danger]="true"
        (cancel)="toArchive.set(null)" (confirm)="doArchive()" />
    }
  `
})
export class CoursesComponent implements OnInit {
  tracks   = signal<TrackDto[]>([]);
  trackId  = signal<number | null>(null);
  items    = signal<CourseDto[]>([]);
  loading  = signal(true);
  error    = signal(false);
  search   = signal('');

  dialogMode = signal<'create' | 'edit' | null>(null);
  editingId  = signal<number | null>(null);
  saving     = signal(false);
  toArchive  = signal<CourseDto | null>(null);

  filtered = () => {
    const q = this.search().toLowerCase();
    return q ? this.items().filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) : this.items();
  };

  gradingLabel = (m: GradingMode) => GradingModeLabels[m];

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', [Validators.required, Validators.minLength(2)]],
    instructorName: [''],
    gradingMode: [1],
    lectureHours: [20, [Validators.min(0)]],
    labHours: [20, [Validators.min(0)]],
    selfStudyHours: [10, [Validators.min(0)]],
    hasExam: [true],
    certificateKpiEnabled: [false],
    freelanceKpiEnabled: [false],
  });

  constructor(
    private org: OrgService,
    private trackSvc: TrackService,
    private courses: CourseService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loading.set(true);
    this.org.listBranches().pipe(
      switchMap(branches => {
        const b = branches[0];
        return b ? this.org.listIntakes(b.id) : of([]);
      }),
      switchMap(intakes => {
        const i = intakes[0];
        return i ? this.trackSvc.list(i.id) : of([]);
      }),
      catchError(() => { this.error.set(true); return of([]); })
    ).subscribe(tracks => {
      this.tracks.set(tracks);
      const first = tracks[0];
      if (first) { this.trackId.set(first.id); this.load(); }
      else { this.loading.set(false); }
    });
  }

  load() {
    const id = this.trackId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(false);
    this.courses.list(id).pipe(
      catchError(() => { this.error.set(true); return of([] as CourseDto[]); }),
      finalize(() => this.loading.set(false))
    ).subscribe(list => this.items.set(list));
  }

  onSearch(q: string) { this.search.set(q); }
  onTrackChange(e: Event) {
    this.trackId.set(Number((e.target as HTMLSelectElement).value));
    this.load();
  }

  openCreate() {
    this.form.reset({
      name: '', code: '', instructorName: '', gradingMode: 1,
      lectureHours: 20, labHours: 20, selfStudyHours: 10,
      hasExam: true, certificateKpiEnabled: false, freelanceKpiEnabled: false
    });
    this.editingId.set(null);
    this.dialogMode.set('create');
  }

  openEdit(c: CourseDto) {
    this.editingId.set(c.id);
    this.form.reset({
      name: c.name, code: c.code, instructorName: c.instructorName ?? '', gradingMode: c.gradingMode,
      lectureHours: c.lectureHours, labHours: c.labHours, selfStudyHours: c.selfStudyHours,
      hasExam: c.hasExam, certificateKpiEnabled: c.certificateKpiEnabled, freelanceKpiEnabled: c.freelanceKpiEnabled
    });
    this.dialogMode.set('edit');
  }

  closeDialog() { this.dialogMode.set(null); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const trackId = this.trackId();
    this.saving.set(true);

    if (this.dialogMode() === 'create') {
      if (!trackId) { this.saving.set(false); return; }
      this.courses.create(trackId, {
        name: v.name, code: v.code, instructorName: v.instructorName || null,
        lectureHours: v.lectureHours, labHours: v.labHours, selfStudyHours: v.selfStudyHours,
        gradingMode: v.gradingMode, hasExam: v.hasExam,
        certificateKpiEnabled: v.certificateKpiEnabled, freelanceKpiEnabled: v.freelanceKpiEnabled
      }).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => { this.toast.success('Course created successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to create course.')
      });
    } else {
      const id = this.editingId();
      if (!id) return;
      this.courses.update(id, {
        name: v.name, instructorName: v.instructorName || null,
        lectureHours: v.lectureHours, labHours: v.labHours, selfStudyHours: v.selfStudyHours,
        certificateKpiEnabled: v.certificateKpiEnabled, freelanceKpiEnabled: v.freelanceKpiEnabled, hasExam: v.hasExam
      }).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => { this.toast.success('Course updated successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to update course.')
      });
    }
  }

  doArchive() {
    const c = this.toArchive();
    if (!c) return;
    this.courses.archive(c.id).subscribe({
      next: () => { this.toast.success(`${c.name} archived.`); this.toArchive.set(null); this.load(); },
      error: err => { this.toast.error(err.error?.title ?? 'Failed to archive.'); this.toArchive.set(null); }
    });
  }
}
