export type Role = 'TrainingManager' | 'Supervisor' | 'TA' | 'StudentAffairs' | 'Student';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  groupId?: number | null;
}

export interface UserDetail extends UserSummary {
  mustChangePassword: boolean;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  nationalId?: string | null;
  photoUrl?: string | null;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: Role;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  nationalId?: string | null;
  groupId?: number | null;
}

export interface UpdateUserRequest {
  fullName: string;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  nationalId?: string | null;
  groupId?: number | null;
}

export interface UserCreatedResponse {
  id: string;
  tempPassword: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserListQuery {
  role?: string;
  branchId?: number;
  isActive?: boolean;
  q?: string;
  page: number;
  pageSize: number;
}
