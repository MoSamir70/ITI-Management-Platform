import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateExamRequest, ExamDto, UpdateExamRequest } from '../models/exam.models';

@Injectable({ providedIn: 'root' })
export class ExamService {
  private readonly base = `${environment.apiBase}`;
  constructor(private http: HttpClient) {}

  listForCourse(courseId: number): Observable<ExamDto[]> {
    return this.http.get<ExamDto[]>(`${this.base}/courses/${courseId}/exams`);
  }
  create(courseId: number, req: CreateExamRequest): Observable<ExamDto> {
    return this.http.post<ExamDto>(`${this.base}/courses/${courseId}/exams`, req);
  }
  update(examId: number, req: UpdateExamRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/exams/${examId}`, req);
  }
  publish(examId: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/exams/${examId}/publish`, {});
  }
  myExams(): Observable<ExamDto[]> {
    return this.http.get<ExamDto[]>(`${this.base}/students/me/exams`);
  }
}
