import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of, finalize } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { UserDetail, UserSummary } from '../../core/models/user.models';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar.component';
import { PaginatorComponent } from '../../shared/ui/paginator/paginator.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { TableSkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';

type SortKey = 'fullName' | 'email' | 'role';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    ReactiveFormsModule, SearchBarComponent, PaginatorComponent, StatCardComponent,
    EmptyStateComponent, TableSkeletonComponent, StatusBadgeComponent, ModalShellComponent,
    ConfirmDialogComponent
  ],
  styles: [`
    .filter-row { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid var(--surface-gray); flex-wrap: wrap; }
    .filter-select {
      border: 1px solid var(--surface-gray); border-radius: 8px; padding: 10px 14px;
      font-size: 13px; font-weight: 600; color: var(--secondary); background: var(--surface-low);
    }
    .th-sort { cursor: pointer; user-select: none; display: inline-flex; align-items: center; gap: 4px; }
    .th-sort .material-symbols-outlined { font-size: 16px; opacity: .5; }
    .th-sort.active .material-symbols-outlined { opacity: 1; color: var(--iti-red); }
    .avatar-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%; background: rgba(143,29,30,.1);
      display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: var(--primary);
      flex-shrink: 0;
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
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  `],
  template: `
    <div class="page-header">
      <div>
        <h1>Student Directory</h1>
        <p style="color:var(--secondary);font-size:13px;margin-top:4px">Manage enrollment and academic records.</p>
      </div>
      @if (canManage()) {
        <button class="btn btn--primary" (click)="openCreate()">
          <span class="material-symbols-outlined">person_add</span>
          Register New Student
        </button>
      }
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
      <app-stat-card icon="group" [value]="total()" label="Total Students" badge="Live" />
      <app-stat-card icon="check_circle" [value]="activeCount()" label="Active" />
      <app-stat-card icon="person_off" [value]="inactiveCount()" label="Inactive" />
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="filter-row">
        <app-search-bar placeholder="Search by name or email…" (valueChange)="onSearch($event)" />
        <select class="filter-select" (change)="onStatusFilter($event)">
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      @if (loading()) {
        <app-table-skeleton [rows]="6" [columns]="4" />
      } @else if (error()) {
        <app-empty-state icon="error" message="Failed to load students. Please retry." actionLabel="Retry" (action)="load()" />
      } @else if (items().length === 0) {
        <app-empty-state icon="person" message="No students match your filters." />
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th><span class="th-sort" [class.active]="sortKey()==='fullName'" (click)="toggleSort('fullName')">Name <span class="material-symbols-outlined">{{ sortIcon('fullName') }}</span></span></th>
              <th><span class="th-sort" [class.active]="sortKey()==='email'" (click)="toggleSort('email')">Email <span class="material-symbols-outlined">{{ sortIcon('email') }}</span></span></th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (s of sortedItems(); track s.id) {
              <tr>
                <td>
                  <div class="avatar-cell">
                    <div class="avatar">{{ initials(s.fullName) }}</div>
                    <strong>{{ s.fullName }}</strong>
                  </div>
                </td>
                <td style="color:var(--secondary)">{{ s.email }}</td>
                <td><app-status-badge [label]="s.isActive ? 'Active' : 'Inactive'" [tone]="s.isActive ? 'approved' : 'rejected'" /></td>
                <td class="row-actions">
                  <button title="Edit" (click)="openEdit(s)"><span class="material-symbols-outlined">edit</span></button>
                  @if (canManage() && s.isActive) {
                    <button class="danger" title="Deactivate" (click)="confirmDeactivate(s)"><span class="material-symbols-outlined">person_off</span></button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        <app-paginator [page]="page()" [pageSize]="pageSize()" [total]="total()"
                        (pageChange)="onPageChange($event)" (pageSizeChange)="onPageSizeChange($event)" />
      }
    </div>

    @if (dialogMode()) {
      <app-modal-shell [title]="dialogMode() === 'create' ? 'Register New Student' : 'Edit Student'" size="md" (close)="closeDialog()">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <div class="field">
              <label>Full Name</label>
              <input formControlName="fullName" placeholder="e.g. Sara Ahmed"
                     [class.is-invalid]="form.get('fullName')?.invalid && form.get('fullName')?.touched" />
              @if (form.get('fullName')?.hasError('required') && form.get('fullName')?.touched) {
                <span class="err">Full name is required</span>
              }
            </div>
            <div class="field">
              <label>Email</label>
              <input formControlName="email" type="email" placeholder="student@iti.local"
                     [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched" />
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <span class="err">Enter a valid email</span>
              }
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <span class="err">Email is required</span>
              }
            </div>
            <div class="field">
              <label>Phone</label>
              <input formControlName="phone" placeholder="01012345678" />
            </div>
            <div class="field">
              <label>Gender</label>
              <select formControlName="gender">
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div class="field">
              <label>Date of Birth</label>
              <input formControlName="dateOfBirth" type="date" />
            </div>
            <div class="field">
              <label>National ID</label>
              <input formControlName="nationalId" placeholder="14-digit ID"
                     [class.is-invalid]="form.get('nationalId')?.invalid && form.get('nationalId')?.touched" />
              @if (form.get('nationalId')?.hasError('pattern') && form.get('nationalId')?.touched) {
                <span class="err">Must be 14 digits</span>
              }
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn--ghost" (click)="closeDialog()">Cancel</button>
            <button type="submit" class="btn btn--primary" [disabled]="saving()">
              {{ saving() ? 'Saving…' : (dialogMode() === 'create' ? 'Register Student' : 'Save Changes') }}
            </button>
          </div>
        </form>
      </app-modal-shell>
    }

    @if (toDeactivate()) {
      <app-confirm-dialog
        title="Deactivate Student"
        [message]="'Deactivate ' + toDeactivate()!.fullName + '? They will no longer be able to log in.'"
        confirmLabel="Deactivate" icon="person_off" [danger]="true"
        (cancel)="toDeactivate.set(null)"
        (confirm)="doDeactivate()" />
    }
  `
})
export class StudentsComponent implements OnInit {
  items    = signal<UserSummary[]>([]);
  total    = signal(0);
  page     = signal(1);
  pageSize = signal(10);
  loading  = signal(true);
  error    = signal(false);
  search   = signal('');
  statusFilter = signal<boolean | null>(null);

  sortKey = signal<SortKey>('fullName');
  sortDir = signal<SortDir>('asc');

  dialogMode = signal<'create' | 'edit' | null>(null);
  editingId  = signal<string | null>(null);
  saving     = signal(false);
  toDeactivate = signal<UserSummary | null>(null);

  activeCount   = computed(() => this.items().filter(s => s.isActive).length);
  inactiveCount = computed(() => this.items().filter(s => !s.isActive).length);

  sortedItems = computed(() => {
    const list = [...this.items()];
    const key = this.sortKey(); const dir = this.sortDir() === 'asc' ? 1 : -1;
    return list.sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * dir);
  });

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    gender: [''],
    dateOfBirth: [''],
    nationalId: ['', [Validators.pattern(/^\d{14}$/)]],
  });

  constructor(
    private users: UserService,
    private auth: AuthService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  canManage = () => this.auth.hasRole('TrainingManager', 'StudentAffairs');

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.users.list({
      role: 'Student',
      q: this.search() || undefined,
      isActive: this.statusFilter() ?? undefined,
      page: this.page(),
      pageSize: this.pageSize()
    }).pipe(
      catchError(() => { this.error.set(true); return of(null); }),
      finalize(() => this.loading.set(false))
    ).subscribe(res => {
      if (res) { this.items.set(res.items); this.total.set(res.total); }
    });
  }

  onSearch(q: string) { this.search.set(q); this.page.set(1); this.load(); }
  onStatusFilter(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    this.statusFilter.set(v === '' ? null : v === 'true');
    this.page.set(1); this.load();
  }
  onPageChange(p: number) { this.page.set(p); this.load(); }
  onPageSizeChange(size: number) { this.pageSize.set(size); this.page.set(1); this.load(); }

  toggleSort(key: SortKey) {
    if (this.sortKey() === key) this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else { this.sortKey.set(key); this.sortDir.set('asc'); }
  }
  sortIcon(key: SortKey) {
    if (this.sortKey() !== key) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  initials(name: string) { return name.split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase(); }

  openCreate() {
    this.form.reset({ fullName: '', email: '', phone: '', gender: '', dateOfBirth: '', nationalId: '' });
    this.editingId.set(null);
    this.dialogMode.set('create');
  }

  openEdit(s: UserSummary) {
    this.editingId.set(s.id);
    this.users.get(s.id).subscribe({
      next: (d: UserDetail) => {
        this.form.reset({
          fullName: d.fullName, email: d.email, phone: d.phone ?? '',
          gender: d.gender ?? '', dateOfBirth: d.dateOfBirth?.substring(0, 10) ?? '',
          nationalId: d.nationalId ?? ''
        });
        this.form.get('email')?.disable();
        this.dialogMode.set('edit');
      },
      error: () => this.toast.error('Failed to load student details.')
    });
  }

  closeDialog() {
    this.dialogMode.set(null);
    this.form.get('email')?.enable();
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();

    if (this.dialogMode() === 'create') {
      this.users.create({
        email: v.email, fullName: v.fullName, role: 'Student',
        phone: v.phone || null, gender: v.gender || null,
        dateOfBirth: v.dateOfBirth || null, nationalId: v.nationalId || null
      }).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => { this.toast.success('Student registered successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to register student.')
      });
    } else {
      const id = this.editingId();
      if (!id) return;
      this.users.update(id, {
        fullName: v.fullName, phone: v.phone || null, gender: v.gender || null,
        dateOfBirth: v.dateOfBirth || null, nationalId: v.nationalId || null
      }).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => { this.toast.success('Student updated successfully.'); this.closeDialog(); this.load(); },
        error: err => this.toast.error(err.error?.title ?? 'Failed to update student.')
      });
    }
  }

  confirmDeactivate(s: UserSummary) { this.toDeactivate.set(s); }

  doDeactivate() {
    const s = this.toDeactivate();
    if (!s) return;
    this.users.deactivate(s.id).subscribe({
      next: () => { this.toast.success(`${s.fullName} has been deactivated.`); this.toDeactivate.set(null); this.load(); },
      error: err => { this.toast.error(err.error?.title ?? 'Failed to deactivate.'); this.toDeactivate.set(null); }
    });
  }
}
