import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GradeRowDto, StudentGradeDto } from '../models/grade.models';

@Injectable({ providedIn: 'root' })
export class GradeService {
  private readonly base = `${environment.apiBase}`;
  constructor(private http: HttpClient) {}

  listForCourse(courseId: number): Observable<GradeRowDto[]> {
    return this.http.get<GradeRowDto[]>(`${this.base}/courses/${courseId}/grades`);
  }
  setLab(courseId: number, studentId: string, value: number): Observable<void> {
    return this.http.put<void>(`${this.base}/courses/${courseId}/grades/${studentId}/lab`, { value });
  }
  setExam(courseId: number, studentId: string, value: number): Observable<void> {
    return this.http.put<void>(`${this.base}/courses/${courseId}/grades/${studentId}/exam`, { value });
  }
  publish(courseId: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/courses/${courseId}/grades/publish`, {});
  }
  myGrades(): Observable<StudentGradeDto[]> {
    return this.http.get<StudentGradeDto[]>(`${this.base}/students/me/grades`);
  }
}
