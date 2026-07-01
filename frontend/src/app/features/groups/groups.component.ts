import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { OrgService } from '../../core/services/org.service';
import { TrackService } from '../../core/services/track.service';
import { GroupService } from '../../core/services/group.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/services/toast.service';
import { TrackDto } from '../../core/models/academic.models';
import { GroupDto, GroupTaDto } from '../../core/models/group.models';
import { UserSummary } from '../../core/models/user.models';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { TableSkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormsModule, SearchBarComponent, EmptyStateComponent, TableSkeletonComponent,
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
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .ta-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--surface-gray); }
    .ta-add-row { display: flex; gap: 8px; margin-top: 16px; }
    .ta-add-row select { flex: 1; }
  `],
  template: `
    <div class="page-header">
      <div>
        <h1>Batches</h1>
        <p style="color:var(--secondary);font-size:13px;margin-top:4px">Manage student groups per program.</p>
      </div>
      <button class="btn btn--primary" (click)="openCreate()" [disabled]="!trackId()">
        <span class="material-symbols-outlined">add</span>
        New Batch
      </button>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="filter-row">
        <app-search-bar placeholder="Search batches…" (valueChange)="onSearch($event)" />
        @if (tracks().length > 0) {
          <select class="track-select" (change)="onTrackChange($event)">
            @for (t of tracks(); track t.id) {
              <option [value]="t.id" [selected]="t.id === trackId()">{{ t.name }}</option>
            }
          </select>
        }
      </div>

      @if (loading()) {
        <app-table-skeleton [rows]="4" [columns]="4" />
      } @else if (error()) {
        <app-empty-state icon="error" message="Failed to load batches." actionLabel="Retry" (action)="load()" />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="groups" message="No batches found for this program." />
      } @else {
        <table class="data-table">
          <thead>
            <tr><th>Name</th><th>Code</th><th>Status</th><th style="text-align:right">Actions</th></tr>
          </thead>
          <tbody>
            @for (g of filtered(); track g.id) {
              <tr>
                <td><strong>{{ g.name }}</strong></td>
                <td>{{ g.code ?? '—' }}</td>
                <td><app-status-badge [label]="g.isActive ? 'Active' : 'Archived'" [tone]="g.isActive ? 'approved' : 'neutral'" /></td>
                <td class="row-actions">
                  <button title="Manage TAs" (click)="openTas(g)"><span class="material-symbols-outlined">badge</span></button>
                  <button title="Edit" (click)="openEdit(g)"><span class="material-symbols-outlined">edit</span></button>
                  @if (g.isActive) {
                    <button class="danger" title="Archive" (click)="toArchive.set(g)"><span class="material-symbols-outlined">archive</span></button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (dialogMode()) {
      <app-modal-shell [title]="dialogMode() === 'create' ? 'New Batch' : 'Edit Batch'" size="sm" (close)="closeDialog()">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Batch Name</label>
            <input formControlName="name" placeholder="e.g. Group A"
                   [class.is-invalid]="form.get('name')?.invalid && form.get('name')?.touched" />
            @if (form.get('name')?.invalid && form.get('name')?.touched) { <span class="err">Name is required</span> }
          </div>
          <div class="field">
            <label>Code</label>
            <input formControlName="code" placeholder="e.g. GRP-A" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" (click)="closeDialog()">Cancel</button>
            <button type="submit" class="btn btn--primary" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
          </div>
        </form>
      </app-modal-shell>
    }

    @if (taGroup()) {
      <app-modal-shell title="Manage TAs" size="sm" (close)="closeTas()">
        @for (ta of currentTas(); track ta.userId) {
          <div class="ta-row">
            <span>{{ ta.taName }}</span>
            <button class="btn btn--ghost" style="padding:6px 10px" (click)="removeTa(ta)">Remove</button>
          </div>
        } @empty {
          <p style="color:var(--secondary);font-size:13px">No TAs assigned yet.</p>
        }
        <div class="ta-add-row">
          <select [(ngModel)]="selectedTaId" [ngModelOptions]="{standalone: true}">
            <option value="">Select a TA…</option>
            @for (ta of availableTas(); track ta.id) {
              <option [value]="ta.id">{{ ta.fullName }}</option>
            }
          </select>
          <button class="btn btn--primary" (click)="addTa()" [disabled]="!selectedTaId">Add</button>
        </div>
      </app-modal-shell>
    }

    @if (toArchive()) {
      <app-confirm-dialog
        title="Archive Batch"
        [message]="'Archive ' + toArchive()!.name + '? It will be hidden from active listings.'"
        confirmLabel="Archive" icon="archive" [danger]="true"
        (cancel)="toArchive.set(null)" (confirm)="doArchive()" />
    }
  `
})
export class GroupsComponent implements OnInit {
  tracks   = signal<TrackDto[]>([]);
  trackId  = signal<number | null>(null);
  items    = signal<GroupDto[]>([]);
  loading  = signal(true);
  error    = signal(false);
  search   = signal('');

  dialogMode = signal<'create' | 'edit' | null>(null);
  editingId  = signal<number | null>(null);
  saving     = signal(false);
  toArchive  = signal<GroupDto | null>(null);

  taGroup     = signal<GroupDto | null>(null);
  currentTas  = signal<GroupTaDto[]>([]);
  allTas      = signal<UserSummary[]>([]);
  selectedTaId = '';

  availableTas = () => {
    const assignedIds = new Set(this.currentTas().map(t => t.userId));
    return this.allTas().filter(t => !assignedIds.has(t.id));
  };

  filtered = () => {
    const q = this.search().toLowerCase();
    return q ? this.items().filter(g => g.name.toLowerCase().includes(q) || (g.code ?? '').toLowerCase().includes(q)) : this.items();
  };

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    code: [''],
  });

  constructor(
    private org: OrgService,
    private trackSvc: TrackService,
    private groups: GroupService,
    private users: UserService,
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

    this.users.list({ role: 'TA', page: 1, pageSize: 100 }).subscribe(res => this.allTas.set(res.items));
  }

  load() {
    const id = this.trackId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(false);
    this.groups.list(id).pipe(
      catchError(() => { this.error.set(true); return of([] as GroupDto[]); }),
      finalize(() => this.loading.set(false))
    ).subscribe(list => this.items.set(list));
  }

  onSearch(q: string) { this.search.set(q); }
  onTrackChange(e: Event) {
    this.trackId.set(Number((e.target as HTMLSelectElement).value));
    this.load();
  }

  openCreate() {
    this.form.reset({ name: '', code: '' });
    this.editingId.set(null);
    this.dialogMode.set('create');
  }

  openEdit(g: GroupDto) {
    this.editingId.set(g.id);
    this.form.reset({ name: g.name, code: g.code ?? '' });
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
      this.groups.create(trackId, { name: v.name, code: v.code || null }).pipe(
        finalize(() => this.saving.set(false))
      ).subscribe({
        next: () => { this.toast.success('Batch created successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to create batch.')
      });
    } else {
      const id = this.editingId();
      if (!id) return;
      this.groups.update(id, { name: v.name, code: v.code || null }).pipe(
        finalize(() => this.saving.set(false))
      ).subscribe({
        next: () => { this.toast.success('Batch updated successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to update batch.')
      });
    }
  }

  doArchive() {
    const g = this.toArchive();
    if (!g) return;
    this.groups.archive(g.id).subscribe({
      next: () => { this.toast.success(`${g.name} archived.`); this.toArchive.set(null); this.load(); },
      error: err => { this.toast.error(err.error?.title ?? 'Failed to archive.'); this.toArchive.set(null); }
    });
  }

  openTas(g: GroupDto) {
    this.taGroup.set(g);
    this.selectedTaId = '';
    this.groups.listTas(g.id).subscribe(list => this.currentTas.set(list));
  }
  closeTas() { this.taGroup.set(null); this.currentTas.set([]); }

  addTa() {
    const g = this.taGroup();
    if (!g || !this.selectedTaId) return;
    this.groups.assignTa(g.id, this.selectedTaId).subscribe({
      next: () => { this.toast.success('TA assigned.'); this.openTas(g); },
      error: err => this.toast.error(err.error?.title ?? 'Failed to assign TA.')
    });
  }

  removeTa(ta: GroupTaDto) {
    const g = this.taGroup();
    if (!g) return;
    this.groups.removeTa(g.id, ta.userId).subscribe({
      next: () => { this.toast.success('TA removed.'); this.openTas(g); },
      error: () => this.toast.error('Failed to remove TA.')
    });
  }
}
