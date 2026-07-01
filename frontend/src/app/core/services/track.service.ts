import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTrackRequest, TrackDto, UpdateTrackRequest } from '../models/academic.models';

@Injectable({ providedIn: 'root' })
export class TrackService {
  private readonly base = `${environment.apiBase}`;
  constructor(private http: HttpClient) {}

  list(intakeId: number): Observable<TrackDto[]> {
    return this.http.get<TrackDto[]>(`${this.base}/intakes/${intakeId}/tracks`);
  }
  create(intakeId: number, req: CreateTrackRequest): Observable<TrackDto> {
    return this.http.post<TrackDto>(`${this.base}/intakes/${intakeId}/tracks`, req);
  }
  update(id: number, req: UpdateTrackRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/tracks/${id}`, req);
  }
  archive(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/tracks/${id}/archive`, {});
  }
}
