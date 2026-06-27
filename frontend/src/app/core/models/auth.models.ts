export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  userId: string;
  fullName: string;
  role: string;
}

export interface RefreshResponse {
  accessToken: string;
  expiresAt: string;
}

export type UserRole =
  | 'TrainingManager'
  | 'Supervisor'
  | 'TA'
  | 'StudentAffairs'
  | 'Student';

export interface AuthState {
  accessToken: string;
  userId: string;
  fullName: string;
  role: UserRole;
  expiresAt: Date;
}
