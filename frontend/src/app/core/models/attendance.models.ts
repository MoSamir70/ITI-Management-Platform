export enum SessionType { Online = 0, Offline = 1 }
export enum AbsenceRequestStatus { Pending = 0, Approved = 1, Rejected = 2 }

export interface AttendanceEntryRequest { studentId: string; isAbsent: boolean; notes?: string | null; }
export interface RecordSessionRequest {
  sessionDate: string; sessionType: SessionType; sessionOrdinal: number;
  entries: AttendanceEntryRequest[];
}
export interface SessionSummaryDto {
  sessionDate: string; sessionType: SessionType; sessionOrdinal: number;
  totalStudents: number; absentCount: number;
}
export interface AttendanceRowDto {
  studentId: string; studentName: string; sessionDate: string;
  sessionType: SessionType; sessionOrdinal: number; isAbsent: boolean; isExcused: boolean; notes?: string | null;
}
export interface StudentAttendanceSummaryDto {
  courseId: number; courseName: string; totalSessions: number;
  absentSessions: number; excusedSessions: number; absencePercentage: number;
}
export interface AbsenceRequestDto {
  id: number; studentId: string; studentName: string;
  requestedDates: string[]; reason: string; status: AbsenceRequestStatus;
  reviewedById?: string | null; reviewedAt?: string | null; reviewNote?: string | null;
  submittedAt: string;
}
