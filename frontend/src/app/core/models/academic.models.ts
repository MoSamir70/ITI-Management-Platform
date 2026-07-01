export enum EntityStatus { Active = 0, Archived = 1 }
export enum GradingMode { GradesOnly = 0, GradesAndAbsence = 1, LabAndAbsence = 2, ExamMode = 3 }

export const GradingModeLabels: Record<GradingMode, string> = {
  [GradingMode.GradesOnly]: 'Grades Only',
  [GradingMode.GradesAndAbsence]: 'Grades + Absence',
  [GradingMode.LabAndAbsence]: 'Lab + Absence',
  [GradingMode.ExamMode]: 'Exam Mode',
};

export interface TrackDto {
  id: number; intakeId: number; name: string; code: string; supervisorId: string;
  certificateKpiEnabled: boolean; freelanceKpiEnabled: boolean; status: EntityStatus;
}
export interface CreateTrackRequest {
  name: string; code: string; supervisorId: string;
  certificateKpiEnabled?: boolean; freelanceKpiEnabled?: boolean;
}
export interface UpdateTrackRequest {
  name: string; code: string; certificateKpiEnabled: boolean; freelanceKpiEnabled: boolean;
}

export interface CourseDto {
  id: number; trackId: number; name: string; code: string; instructorName?: string | null;
  lectureHours: number; labHours: number; selfStudyHours: number;
  gradingMode: GradingMode; certificateKpiEnabled: boolean; freelanceKpiEnabled: boolean;
  hasExam: boolean; status: EntityStatus;
}
export interface CreateCourseRequest {
  name: string; code: string; instructorName?: string | null;
  lectureHours: number; labHours: number; selfStudyHours: number;
  gradingMode: GradingMode; certificateKpiEnabled?: boolean; freelanceKpiEnabled?: boolean; hasExam?: boolean;
}
export interface UpdateCourseRequest {
  name: string; instructorName?: string | null;
  lectureHours: number; labHours: number; selfStudyHours: number;
  certificateKpiEnabled: boolean; freelanceKpiEnabled: boolean; hasExam: boolean;
}
