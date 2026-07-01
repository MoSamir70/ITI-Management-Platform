import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AbsenceRequestDto, AttendanceRowDto, RecordSessionRequest, SessionSummaryDto,
  StudentAttendanceSummaryDto
} from '../models/attendance.models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly base = `${environment.apiBase}`;
  constructor(private http: HttpClient) {}

  recordSession(courseId: number, groupId: number, req: RecordSessionRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/courses/${courseId}/groups/${groupId}/attendance`, req);
  }
  listSessions(courseId: number, groupId: number): Observable<SessionSummaryDto[]> {
    return this.http.get<SessionSummaryDto[]>(`${this.base}/courses/${courseId}/groups/${groupId}/attendance`);
  }
  getSession(courseId: number, groupId: number, date: string, ordinal: number): Observable<AttendanceRowDto[]> {
    return this.http.get<AttendanceRowDto[]>(`${this.base}/courses/${courseId}/groups/${groupId}/attendance/${date}/${ordinal}`);
  }
  myAttendance(): Observable<StudentAttendanceSummaryDto[]> {
    return this.http.get<StudentAttendanceSummaryDto[]>(`${this.base}/students/me/attendance`);
  }
  listAbsenceRequests(): Observable<AbsenceRequestDto[]> {
    return this.http.get<AbsenceRequestDto[]>(`${this.base}/absence-requests`);
  }
  submitAbsenceRequest(requestedDates: string[], reason: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.base}/absence-requests`, { requestedDates, reason });
  }
  reviewAbsenceRequest(id: number, approve: boolean, reviewNote?: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/absence-requests/${id}/review`, { approve, reviewNote });
  }
}
