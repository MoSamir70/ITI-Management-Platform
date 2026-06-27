import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface NotificationDto {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe],
  styles: [`
    .toolbar { display:flex; gap:8px; margin-bottom:16px; }
    .notif-list { display:flex; flex-direction:column; gap:8px; }
    .notif {
      background: var(--color-surface);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      padding: 16px 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      transition: background 0.1s;
      &.unread { border-left: 3px solid var(--color-primary); }
      &:hover { background: var(--color-accent); }
    }
    .notif-body { flex:1; }
    .notif-title { font-weight:600; margin-bottom:4px; }
    .notif-text  { font-size:13px; color:var(--color-text-muted); }
    .notif-time  { font-size:11px; color:var(--color-text-muted); margin-top:4px; }
  `],
  template: `
    <div class="page-header">
      <h1>Notifications</h1>
    </div>

    <div class="toolbar">
      <button class="btn btn--ghost" (click)="markAll()">Mark all as read</button>
      <button class="btn btn--ghost" (click)="toggleFilter()">
        {{ showUnreadOnly() ? 'Show all' : 'Unread only' }}
      </button>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (notifications().length === 0) {
      <div class="card" style="text-align:center;color:var(--color-text-muted)">
        {{ showUnreadOnly() ? 'No unread notifications.' : 'No notifications yet.' }}
      </div>
    } @else {
      <div class="notif-list">
        @for (n of notifications(); track n.id) {
          <div class="notif" [class.unread]="!n.isRead" (click)="markRead(n)">
            <div class="notif-body">
              <div class="notif-title">{{ n.title }}</div>
              <div class="notif-text">{{ n.body }}</div>
              <div class="notif-time">{{ n.createdAt | date:'dd MMM yyyy, HH:mm' }}</div>
            </div>
            @if (!n.isRead) { <span style="color:var(--color-primary);font-size:18px">•</span> }
          </div>
        }
      </div>
    }
  `
})
export class NotificationsComponent implements OnInit {
  notifications = signal<NotificationDto[]>([]);
  loading = signal(true);
  showUnreadOnly = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    const unreadOnly = this.showUnreadOnly();
    this.http.get<NotificationDto[]>(`${environment.apiBase}/notifications?unreadOnly=${unreadOnly}`).subscribe({
      next: data => { this.notifications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  toggleFilter() { this.showUnreadOnly.update(v => !v); this.load(); }

  markRead(n: NotificationDto) {
    if (n.isRead) return;
    this.http.patch(`${environment.apiBase}/notifications/${n.id}/read`, {}).subscribe(() => {
      this.notifications.update(list => list.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    });
  }

  markAll() {
    this.http.patch(`${environment.apiBase}/notifications/read-all`, {}).subscribe(() => {
      this.notifications.update(list => list.map(x => ({ ...x, isRead: true })));
    });
  }
}
