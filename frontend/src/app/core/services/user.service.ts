import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateUserRequest, PagedResult, UpdateUserRequest,
  UserCreatedResponse, UserDetail, UserListQuery, UserSummary
} from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = `${environment.apiBase}/users`;

  constructor(private http: HttpClient) {}

  list(query: UserListQuery): Observable<PagedResult<UserSummary>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize);
    if (query.role) params = params.set('role', query.role);
    if (query.branchId != null) params = params.set('branchId', query.branchId);
    if (query.isActive != null) params = params.set('isActive', query.isActive);
    if (query.q) params = params.set('q', query.q);
    return this.http.get<PagedResult<UserSummary>>(this.base, { params });
  }

  get(id: string): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${this.base}/${id}`);
  }

  create(req: CreateUserRequest): Observable<UserCreatedResponse> {
    return this.http.post<UserCreatedResponse>(this.base, req);
  }

  update(id: string, req: UpdateUserRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, req);
  }

  deactivate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/deactivate`, {});
  }
}
