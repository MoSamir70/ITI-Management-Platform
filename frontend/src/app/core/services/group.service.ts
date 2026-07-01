import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateGroupRequest, GroupDto, GroupTaDto, StudentSummaryDto, UpdateGroupRequest
} from '../models/group.models';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly base = `${environment.apiBase}`;
  constructor(private http: HttpClient) {}

  list(trackId: number): Observable<GroupDto[]> {
    return this.http.get<GroupDto[]>(`${this.base}/tracks/${trackId}/groups`);
  }
  create(trackId: number, req: CreateGroupRequest): Observable<GroupDto> {
    return this.http.post<GroupDto>(`${this.base}/tracks/${trackId}/groups`, req);
  }
  update(id: number, req: UpdateGroupRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/groups/${id}`, req);
  }
  archive(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/groups/${id}/archive`, {});
  }
  listTas(id: number): Observable<GroupTaDto[]> {
    return this.http.get<GroupTaDto[]>(`${this.base}/groups/${id}/tas`);
  }
  assignTa(id: number, userId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/groups/${id}/tas`, { userId });
  }
  removeTa(id: number, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/groups/${id}/tas/${userId}`);
  }
  listStudents(id: number): Observable<StudentSummaryDto[]> {
    return this.http.get<StudentSummaryDto[]>(`${this.base}/groups/${id}/students`);
  }
}
