export interface GroupDto { id: number; trackId: number; name: string; code?: string | null; isActive: boolean; }
export interface CreateGroupRequest { name: string; code?: string | null; }
export interface UpdateGroupRequest { name: string; code?: string | null; }
export interface GroupTaDto { groupId: number; userId: string; taName: string; assignedAt: string; }
export interface StudentSummaryDto { id: string; fullName: string; email: string; }
