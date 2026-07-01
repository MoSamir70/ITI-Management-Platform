export interface BranchDto { id: number; name: string; code: string; isActive: boolean; }
export interface IntakeDto {
  id: number; branchId: number; name: string; number: number;
  startDate: string; endDate: string; isActive: boolean;
}
