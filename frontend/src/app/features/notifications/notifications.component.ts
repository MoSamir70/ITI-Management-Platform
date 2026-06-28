import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface NotificationDto {
  id: string; title: string; body: string;
  isRead: boolean; createdAt: string; recipientName: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page-header">
      <h1>Notifications</h1>
      <div style="display:flex;gap:8px">
        <button class="btn btn--ghost" (click)="markAllRead()">Mark all read</button>
        <button class="btn btn--primary">
          <span class="material-symbols-outlined">add</span>
          New Notification
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else if (items().length === 0) {
      <div class="card">
        <div class="empty-state">
          <span class="material-symbols-outlined">notifications</span>
          <p>No notifications yet.</p>
        </div>
      </div>
    } @else {
      <!-- Unread count banner -->
      @if (unreadCount() > 0) {
        <div style="background:rgba(143,29,30,.06);border-left:3px solid var(--iti-red);padding:12px 16px;border-radius:8px;margin-bottom:20px;display:flex;align-items:center;gap:8px">
          <span class="material-symbols-outlined" style="color:var(--iti-red)">info</span>
          <span style="font-size:14px;font-weight:600;color:var(--primary)">{{ unreadCount() }} unread notification{{ unreadCount() > 1 ? 's' : '' }}</span>
        </div>
      }

      <div class="card" style="padding:0;overflow:hidden">
        @for (n of items(); track n.id) {
          <div style="display:flex;align-items:flex-start;gap:16px;padding:16px 20px;border-bottom:1px solid var(--surface-gray)"
               [style.background]="n.isRead ? 'transparent' : 'rgba(176,54,51,.03)'">
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
              <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
                <span style="font-size:11px;color:var(--outline)">To: {{ n.recipientName }}</span>
                <span style="font-size:11px;color:var(--outline)">{{ n.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class NotificationsComponent implements OnInit {
  items   = signal<NotificationDto[]>([]);
  loading = signal(true);

  unreadCount = () => this.items().filter(n => !n.isRead).length;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<NotificationDto[]>(`${environment.apiBase}/notifications`).subscribe({
      next: data => { this.items.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  markAllRead() {
    this.items.update(list => list.map(n => ({ ...n, isRead: true })));
  }
}

