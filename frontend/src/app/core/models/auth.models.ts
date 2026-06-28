export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresInSeconds: number;
  role: string;
  userId: string;
  fullName: string;
  mustChangePassword: boolean;
}

export interface RefreshResponse {
  accessToken: string;
  expiresInSeconds: number;
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
  mustChangePassword: boolean;
}
