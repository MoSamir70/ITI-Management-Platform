export enum KpiType { Certificate = 0, Freelance = 1 }
export enum KpiStatus { Pending = 0, Approved = 1, Rejected = 2 }

export interface KpiDto {
  id: number; studentId: string; studentName: string;
  kpiType: KpiType; title: string; trackId?: number | null; courseId?: number | null;
  issuingBody?: string | null; issueDate?: string | null; expiryDate?: string | null;
  platform?: string | null; clientContact?: string | null; projectDescription?: string | null; amountEarned?: number | null;
  fileUrl: string; status: KpiStatus; reviewedById?: string | null; reviewedAt?: string | null; reviewNote?: string | null;
  submittedAt: string;
}
export interface SubmitKpiRequest {
  kpiType: KpiType; title: string; trackId?: number | null; courseId?: number | null;
  issuingBody?: string | null; issueDate?: string | null; expiryDate?: string | null;
  platform?: string | null; clientContact?: string | null; projectDescription?: string | null; amountEarned?: number | null;
  fileUrl: string;
}
