import { Role, User } from './user';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  phone?: string;
  role: 'CLIENT' | 'FREELANCER';
  displayName: string;
  companyName?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse extends Omit<User, 'passwordHash'> { }
