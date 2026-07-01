import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KpiDto, SubmitKpiRequest } from '../models/kpi.models';

@Injectable({ providedIn: 'root' })
export class KpiService {
  private readonly base = `${environment.apiBase}/kpi`;
  constructor(private http: HttpClient) {}

  submit(req: SubmitKpiRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, req);
  }
  mine(): Observable<KpiDto[]> {
    return this.http.get<KpiDto[]>(`${this.base}/me`);
  }
  pending(): Observable<KpiDto[]> {
    return this.http.get<KpiDto[]>(`${this.base}/pending`);
  }
  review(id: number, approve: boolean, reviewNote?: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/review`, { approve, reviewNote });
  }
}
