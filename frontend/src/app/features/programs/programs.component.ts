import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { OrgService } from '../../core/services/org.service';
import { TrackService } from '../../core/services/track.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/services/toast.service';
import { IntakeDto } from '../../core/models/org.models';
import { TrackDto } from '../../core/models/academic.models';
import { UserSummary } from '../../core/models/user.models';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { TableSkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [
    ReactiveFormsModule, SearchBarComponent, EmptyStateComponent, TableSkeletonComponent,
    StatusBadgeComponent, ModalShellComponent, ConfirmDialogComponent
  ],
  styles: [`
    .filter-row { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid var(--surface-gray); flex-wrap: wrap; }
    .intake-select {
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
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .checkbox-row { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
  `],
  template: `
    <div class="page-header">
      <div>
        <h1>Programs</h1>
        <p style="color:var(--secondary);font-size:13px;margin-top:4px">Manage tracks offered per intake.</p>
      </div>
      <button class="btn btn--primary" (click)="openCreate()" [disabled]="!intakeId()">
        <span class="material-symbols-outlined">add</span>
        New Program
      </button>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="filter-row">
        <app-search-bar placeholder="Search programs…" (valueChange)="onSearch($event)" />
        @if (intakes().length > 1) {
          <select class="intake-select" (change)="onIntakeChange($event)">
            @for (i of intakes(); track i.id) {
              <option [value]="i.id" [selected]="i.id === intakeId()">{{ i.name }}</option>
            }
          </select>
        }
      </div>

      @if (loading()) {
        <app-table-skeleton [rows]="4" [columns]="4" />
      } @else if (error()) {
        <app-empty-state icon="error" message="Failed to load programs." actionLabel="Retry" (action)="load()" />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="school" message="No programs found." />
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Code</th><th>KPI Modes</th><th>Status</th><th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (t of filtered(); track t.id) {
              <tr>
                <td><strong>{{ t.name }}</strong></td>
                <td>{{ t.code }}</td>
                <td style="color:var(--secondary)">
                  {{ t.certificateKpiEnabled ? 'Certificate' : '' }}
                  {{ t.certificateKpiEnabled && t.freelanceKpiEnabled ? ' + ' : '' }}
                  {{ t.freelanceKpiEnabled ? 'Freelance' : '' }}
                  {{ !t.certificateKpiEnabled && !t.freelanceKpiEnabled ? '—' : '' }}
                </td>
                <td><app-status-badge [label]="t.status === 0 ? 'Active' : 'Archived'" [tone]="t.status === 0 ? 'approved' : 'neutral'" /></td>
                <td class="row-actions">
                  <button title="Edit" (click)="openEdit(t)"><span class="material-symbols-outlined">edit</span></button>
                  @if (t.status === 0) {
                    <button class="danger" title="Archive" (click)="toArchive.set(t)"><span class="material-symbols-outlined">archive</span></button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (dialogMode()) {
      <app-modal-shell [title]="dialogMode() === 'create' ? 'New Program' : 'Edit Program'" size="md" (close)="closeDialog()">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Program Name</label>
            <input formControlName="name" placeholder="e.g. Full Stack .NET"
                   [class.is-invalid]="form.get('name')?.invalid && form.get('name')?.touched" />
            @if (form.get('name')?.invalid && form.get('name')?.touched) { <span class="err">Name is required (min 2 chars)</span> }
          </div>
          <div class="field">
            <label>Code</label>
            <input formControlName="code" placeholder="e.g. FS-NET"
                   [class.is-invalid]="form.get('code')?.invalid && form.get('code')?.touched" />
            @if (form.get('code')?.invalid && form.get('code')?.touched) { <span class="err">Code is required (min 2 chars)</span> }
          </div>
          @if (dialogMode() === 'create') {
            <div class="field">
              <label>Supervisor</label>
              <select formControlName="supervisorId" [class.is-invalid]="form.get('supervisorId')?.invalid && form.get('supervisorId')?.touched">
                <option value="">Select a supervisor…</option>
                @for (s of supervisors(); track s.id) {
                  <option [value]="s.id">{{ s.fullName }}</option>
                }
              </select>
              @if (form.get('supervisorId')?.invalid && form.get('supervisorId')?.touched) { <span class="err">Supervisor is required</span> }
            </div>
          }
          <div class="checkbox-row">
            <input type="checkbox" id="certKpi" formControlName="certificateKpiEnabled" />
            <label for="certKpi" style="text-transform:none;font-size:13px">Enable Certificate KPI</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="freeKpi" formControlName="freelanceKpiEnabled" />
            <label for="freeKpi" style="text-transform:none;font-size:13px">Enable Freelance KPI</label>
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
        title="Archive Program"
        [message]="'Archive ' + toArchive()!.name + '? It will be hidden from active listings.'"
        confirmLabel="Archive" icon="archive" [danger]="true"
        (cancel)="toArchive.set(null)" (confirm)="doArchive()" />
    }
  `
})
export class ProgramsComponent implements OnInit {
  intakes  = signal<IntakeDto[]>([]);
  intakeId = signal<number | null>(null);
  items    = signal<TrackDto[]>([]);
  supervisors = signal<UserSummary[]>([]);
  loading  = signal(true);
  error    = signal(false);
  search   = signal('');

  dialogMode = signal<'create' | 'edit' | null>(null);
  editingId  = signal<number | null>(null);
  saving     = signal(false);
  toArchive  = signal<TrackDto | null>(null);

  filtered = () => {
    const q = this.search().toLowerCase();
    return q ? this.items().filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)) : this.items();
  };

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', [Validators.required, Validators.minLength(2)]],
    supervisorId: ['', [Validators.required]],
    certificateKpiEnabled: [false],
    freelanceKpiEnabled: [false],
  });

  constructor(
    private org: OrgService,
    private tracks: TrackService,
    private users: UserService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loading.set(true);
    this.org.listBranches().pipe(
      switchMap(branches => {
        const b = branches[0];
        if (!b) return of([] as IntakeDto[]);
        return this.org.listIntakes(b.id);
      }),
      catchError(() => { this.error.set(true); return of([] as IntakeDto[]); })
    ).subscribe(intakes => {
      this.intakes.set(intakes);
      const first = intakes[0];
      if (first) { this.intakeId.set(first.id); this.load(); }
      else { this.loading.set(false); }
    });

    this.users.list({ role: 'Supervisor', page: 1, pageSize: 100 }).subscribe(res => this.supervisors.set(res.items));
  }

  load() {
    const id = this.intakeId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(false);
    this.tracks.list(id).pipe(
      catchError(() => { this.error.set(true); return of([] as TrackDto[]); }),
      finalize(() => this.loading.set(false))
    ).subscribe(list => this.items.set(list));
  }

  onSearch(q: string) { this.search.set(q); }
  onIntakeChange(e: Event) {
    this.intakeId.set(Number((e.target as HTMLSelectElement).value));
    this.load();
  }

  openCreate() {
    this.form.reset({ name: '', code: '', supervisorId: '', certificateKpiEnabled: false, freelanceKpiEnabled: false });
    this.editingId.set(null);
    this.dialogMode.set('create');
  }

  openEdit(t: TrackDto) {
    this.editingId.set(t.id);
    this.form.reset({
      name: t.name, code: t.code, supervisorId: t.supervisorId,
      certificateKpiEnabled: t.certificateKpiEnabled, freelanceKpiEnabled: t.freelanceKpiEnabled
    });
    this.form.get('supervisorId')?.disable();
    this.dialogMode.set('edit');
  }

  closeDialog() {
    this.dialogMode.set(null);
    this.form.get('supervisorId')?.enable();
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const intakeId = this.intakeId();
    this.saving.set(true);

    if (this.dialogMode() === 'create') {
      if (!intakeId) { this.saving.set(false); return; }
      this.tracks.create(intakeId, {
        name: v.name, code: v.code, supervisorId: v.supervisorId,
        certificateKpiEnabled: v.certificateKpiEnabled, freelanceKpiEnabled: v.freelanceKpiEnabled
      }).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => { this.toast.success('Program created successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to create program.')
      });
    } else {
      const id = this.editingId();
      if (!id) return;
      this.tracks.update(id, {
        name: v.name, code: v.code,
        certificateKpiEnabled: v.certificateKpiEnabled, freelanceKpiEnabled: v.freelanceKpiEnabled
      }).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => { this.toast.success('Program updated successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to update program.')
      });
    }
  }

  doArchive() {
    const t = this.toArchive();
    if (!t) return;
    this.tracks.archive(t.id).subscribe({
      next: () => { this.toast.success(`${t.name} archived.`); this.toArchive.set(null); this.load(); },
      error: err => { this.toast.error(err.error?.title ?? 'Failed to archive.'); this.toArchive.set(null); }
    });
  }
}
