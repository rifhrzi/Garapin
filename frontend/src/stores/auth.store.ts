import { create } from 'zustand';
import { authApi } from '@/lib/api/auth.api';
import type { AuthUser, LoginPayload, RegisterPayload, MeResponse } from '@/types';
import { getDisplayName } from '@/lib/constants';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true });
    try {
      const result = await authApi.login(payload);
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true });
    try {
      const result = await authApi.register(payload);
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authApi.logout();
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  loadFromStorage: async () => {
    if (typeof window === 'undefined') {
      set({ isHydrated: true });
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isHydrated: true });
      return;
    }

    set({ isLoading: true });
    try {
      const me: MeResponse = await authApi.me();
      const displayName = getDisplayName(me);
      set({
        user: {
          id: me.id,
          email: me.email,
          role: me.role,
          displayName,
          emailVerified: me.emailVerified,
          phoneVerified: me.phoneVerified,
        },
        isAuthenticated: true,
        isLoading: false,
        isHydrated: true,
      });
    } catch {
      authApi.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
      });
    }
  },

  setUser: (user: AuthUser | null) => {
    set({ user, isAuthenticated: !!user });
  },
}));
