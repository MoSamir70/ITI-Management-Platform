import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationDto {
  id: number; title: string; body: string; type: number;
  relatedEntityId?: string | null; isRead: boolean; readAt?: string | null; createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiBase}/notifications`;
  constructor(private http: HttpClient) {}

  list(unreadOnly = false): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(this.base, { params: { unreadOnly } });
  }
  markRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/read`, {});
  }
  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.base}/read-all`, {});
  }
}
