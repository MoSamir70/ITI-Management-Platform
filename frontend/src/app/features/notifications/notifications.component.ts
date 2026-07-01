import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { catchError, finalize, of } from 'rxjs';
import { NotificationDto, NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../shared/services/toast.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { TableSkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, TableSkeletonComponent],
  template: `
    <div class="page-header">
      <h1>Notifications</h1>
      <div style="display:flex;gap:8px">
        <button class="btn btn--ghost" (click)="markAllRead()">Mark all read</button>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      @if (loading()) {
        <app-table-skeleton [rows]="4" [columns]="1" />
      } @else if (error()) {
        <app-empty-state icon="error" message="Failed to load notifications." actionLabel="Retry" (action)="load()" />
      } @else if (items().length === 0) {
        <app-empty-state icon="notifications" message="No notifications yet." />
      } @else {
        @if (unreadCount() > 0) {
          <div style="background:rgba(143,29,30,.06);border-left:3px solid var(--iti-red);padding:12px 16px;margin:20px;border-radius:8px;display:flex;align-items:center;gap:8px">
            <span class="material-symbols-outlined" style="color:var(--iti-red)">info</span>
            <span style="font-size:14px;font-weight:600;color:var(--primary)">{{ unreadCount() }} unread notification{{ unreadCount() > 1 ? 's' : '' }}</span>
          </div>
        }
        @for (n of items(); track n.id) {
          <div style="display:flex;align-items:flex-start;gap:16px;padding:16px 20px;border-bottom:1px solid var(--surface-gray);cursor:pointer"
               [style.background]="n.isRead ? 'transparent' : 'rgba(176,54,51,.03)'"
               (click)="markRead(n)">
            <div style="width:38px;height:38px;border-radius:50%;background:rgba(143,29,30,.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
              <span class="material-symbols-outlined" [style.color]="n.isRead ? 'var(--secondary)' : 'var(--iti-red)'">
                {{ n.isRead ? 'notifications' : 'notifications_active' }}
              </span>
            </div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="font-weight:700;font-size:14px">{{ n.title }}</span>
                @if (!n.isRead) {
                  <span style="width:7px;height:7px;border-radius:50%;background:var(--iti-red);display:inline-block"></span>
                }
              </div>
              <p style="font-size:13px;color:var(--secondary);line-height:1.5">{{ n.body }}</p>
              <div style="margin-top:6px">
                <span style="font-size:11px;color:var(--outline)">{{ n.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  items   = signal<NotificationDto[]>([]);
  loading = signal(true);
  error   = signal(false);

  unreadCount = () => this.items().filter(n => !n.isRead).length;

  constructor(private notifications: NotificationService, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.notifications.list().pipe(
      catchError(() => { this.error.set(true); return of([] as NotificationDto[]); }),
      finalize(() => this.loading.set(false))
    ).subscribe(list => this.items.set(list));
  }

  markRead(n: NotificationDto) {
    if (n.isRead) return;
    this.notifications.markRead(n.id).subscribe({
      next: () => this.items.update(list => list.map(x => x.id === n.id ? { ...x, isRead: true } : x)),
      error: () => this.toast.error('Failed to mark as read.')
    });
  }

  markAllRead() {
    this.notifications.markAllRead().subscribe({
      next: () => { this.items.update(list => list.map(n => ({ ...n, isRead: true }))); this.toast.success('All notifications marked as read.'); },
      error: () => this.toast.error('Failed to mark all as read.')
    });
  }
}
