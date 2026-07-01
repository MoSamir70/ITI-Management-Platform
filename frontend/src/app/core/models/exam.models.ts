export enum ExamType { Regular = 0, Corrective = 1 }

export interface ExamDto {
  id: number; courseId: number; courseName: string;
  examType: ExamType; examDate: string; examLink?: string | null; location?: string | null;
  durationMinutes: number; isPublished: boolean; publishedAt?: string | null;
  notes?: string | null; correctiveStudentIds?: string[] | null;
}
export interface CreateExamRequest {
  examType: ExamType; examDate: string; examLink?: string | null; location?: string | null;
  durationMinutes: number; notes?: string | null; correctiveStudentIds?: string[] | null;
}
export interface UpdateExamRequest {
  examDate?: string; examLink?: string | null; location?: string | null;
  durationMinutes?: number; notes?: string | null;
}
