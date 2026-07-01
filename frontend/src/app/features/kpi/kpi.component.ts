import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { KpiService } from '../../core/services/kpi.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { KpiDto, KpiType } from '../../core/models/kpi.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { TableSkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';

@Component({
  selector: 'app-kpi',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, ReactiveFormsModule, EmptyStateComponent, TableSkeletonComponent,
    StatusBadgeComponent, ModalShellComponent
  ],
  styles: [`
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .field label { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--on-surface-var); }
    .field input, .field select, .field textarea {
      padding: 10px 12px; border-radius: 8px; border: 1px solid var(--surface-gray);
      background: var(--bg); font-size: 14px; outline: none;
    }
    .field input:focus, .field textarea:focus { border-color: var(--iti-red); box-shadow: 0 0 0 3px rgba(176,54,51,.1); }
    .field input.is-invalid { border-color: #ba1a1a; }
    .field .err { font-size: 12px; color: #ba1a1a; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
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
        <h1>KPI</h1>
        <p style="color:var(--secondary);font-size:13px;margin-top:4px">
          {{ isStudent() ? 'Submit certificates and freelance work for review.' : 'Review pending student KPI submissions.' }}
        </p>
      </div>
      @if (isStudent()) {
        <button class="btn btn--primary" (click)="openSubmit()">
          <span class="material-symbols-outlined">add</span>
          Submit KPI
        </button>
      }
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      @if (loading()) {
        <app-table-skeleton [rows]="4" [columns]="5" />
      } @else if (error()) {
        <app-empty-state icon="error" message="Failed to load KPI records." actionLabel="Retry" (action)="load()" />
      } @else if (items().length === 0) {
        <app-empty-state icon="analytics" [message]="isStudent() ? 'You have not submitted any KPIs yet.' : 'No pending KPI submissions.'" />
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              @if (!isStudent()) { <th>Student</th> }
              <th>Title</th><th>Type</th><th>Submitted</th><th>Status</th>
              @if (!isStudent()) { <th style="text-align:right">Actions</th> }
            </tr>
          </thead>
          <tbody>
            @for (k of items(); track k.id) {
              <tr>
                @if (!isStudent()) { <td><strong>{{ k.studentName }}</strong></td> }
                <td>{{ k.title }}</td>
                <td>{{ k.kpiType === 0 ? 'Certificate' : 'Freelance' }}</td>
                <td style="color:var(--secondary)">{{ k.submittedAt | date:'dd MMM yyyy' }}</td>
                <td><app-status-badge [label]="statusLabel(k.status)" [tone]="statusTone(k.status)" /></td>
                @if (!isStudent()) {
                  <td class="row-actions">
                    @if (k.status === 0) {
                      <button class="approve" (click)="review(k, true)">Approve</button>
                      <button class="reject" (click)="review(k, false)">Reject</button>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (submitOpen()) {
      <app-modal-shell title="Submit KPI" size="md" (close)="submitOpen.set(false)">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Type</label>
            <select formControlName="kpiType">
              <option [value]="0">Certificate</option>
              <option [value]="1">Freelance</option>
            </select>
          </div>
          <div class="field">
            <label>Title</label>
            <input formControlName="title" placeholder="e.g. AWS Cloud Practitioner"
                   [class.is-invalid]="form.get('title')?.invalid && form.get('title')?.touched" />
            @if (form.get('title')?.invalid && form.get('title')?.touched) { <span class="err">Title is required</span> }
          </div>
          <div class="field">
            <label>Evidence URL</label>
            <input formControlName="fileUrl" placeholder="https://…"
                   [class.is-invalid]="form.get('fileUrl')?.invalid && form.get('fileUrl')?.touched" />
            @if (form.get('fileUrl')?.invalid && form.get('fileUrl')?.touched) { <span class="err">Evidence URL is required</span> }
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" (click)="submitOpen.set(false)">Cancel</button>
            <button type="submit" class="btn btn--primary" [disabled]="saving()">{{ saving() ? 'Submitting…' : 'Submit' }}</button>
          </div>
        </form>
      </app-modal-shell>
    }
  `
})
export class KpiComponent implements OnInit {
  items   = signal<KpiDto[]>([]);
  loading = signal(true);
  error   = signal(false);
  submitOpen = signal(false);
  saving = signal(false);

  isStudent = () => this.auth.hasRole('Student');

  form = this.fb.nonNullable.group({
    kpiType: [0 as KpiType],
    title: ['', [Validators.required, Validators.minLength(2)]],
    fileUrl: ['', [Validators.required]],
  });

  constructor(
    private kpi: KpiService,
    private toast: ToastService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(false);
    const req$ = this.isStudent() ? this.kpi.mine() : this.kpi.pending();
    req$.pipe(
      catchError(() => { this.error.set(true); return of([] as KpiDto[]); }),
      finalize(() => this.loading.set(false))
    ).subscribe(list => this.items.set(list));
  }

  openSubmit() {
    this.form.reset({ kpiType: 0, title: '', fileUrl: '' });
    this.submitOpen.set(true);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.kpi.submit({ kpiType: v.kpiType, title: v.title, fileUrl: v.fileUrl }).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => { this.toast.success('KPI submitted for review.'); this.submitOpen.set(false); this.load(); },
      error: err => this.toast.error(err.error?.title ?? 'Failed to submit KPI.')
    });
  }

  statusLabel(status: number) { return status === 0 ? 'Pending' : status === 1 ? 'Approved' : 'Rejected'; }
  statusTone(status: number): 'pending' | 'approved' | 'rejected' {
    return status === 0 ? 'pending' : status === 1 ? 'approved' : 'rejected';
  }

  review(k: KpiDto, approve: boolean) {
    this.kpi.review(k.id, approve).subscribe({
      next: () => { this.toast.success(approve ? 'KPI approved.' : 'KPI rejected.'); this.load(); },
      error: () => this.toast.error('Failed to review KPI.')
    });
  }
}
