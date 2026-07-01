export interface GradeRowDto {
  studentId: string; studentName: string; courseId: number; groupId: number;
  labGrade?: number | null; examGrade?: number | null; totalGrade?: number | null;
  absencePercentage?: number | null; isPublished: boolean; publishedAt?: string | null;
}
export interface StudentGradeDto {
  courseId: number; courseName: string; labGrade?: number | null; examGrade?: number | null;
  totalGrade?: number | null; absencePercentage?: number | null; publishedAt?: string | null;
}
