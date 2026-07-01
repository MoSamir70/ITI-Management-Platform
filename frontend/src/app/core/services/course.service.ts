import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseDto, CreateCourseRequest, UpdateCourseRequest } from '../models/academic.models';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly base = `${environment.apiBase}`;
  constructor(private http: HttpClient) {}

  list(trackId: number): Observable<CourseDto[]> {
    return this.http.get<CourseDto[]>(`${this.base}/tracks/${trackId}/courses`);
  }
  create(trackId: number, req: CreateCourseRequest): Observable<CourseDto> {
    return this.http.post<CourseDto>(`${this.base}/tracks/${trackId}/courses`, req);
  }
  update(id: number, req: UpdateCourseRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/courses/${id}`, req);
  }
  archive(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/courses/${id}/archive`, {});
  }
}
