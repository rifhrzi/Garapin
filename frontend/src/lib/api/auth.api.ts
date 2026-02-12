import api, { setTokens, clearTokens, getRefreshToken } from './client';
import type {
  ApiResponse,
  AuthResponse,
  TokenResponse,
  LoginPayload,
  RegisterPayload,
  MeResponse,
} from '@/types';

export const authApi = {
  async register(payload: RegisterPayload) {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async login(payload: LoginPayload) {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async refresh() {
    const { data } = await api.post<ApiResponse<TokenResponse>>('/auth/refresh', {
      refreshToken: getRefreshToken(),
    });
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async me() {
    const { data } = await api.get<ApiResponse<MeResponse>>('/auth/me');
    return data.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.post<ApiResponse<null>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data.data;
  },

  logout() {
    clearTokens();
  },
};
