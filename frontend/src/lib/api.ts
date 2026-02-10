import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  AuthResponse,
  TokenResponse,
  LoginPayload,
  RegisterPayload,
  MeResponse,
  PortfolioLink,
  Project,
  ProjectDetail,
  Category,
  Bid,
  ProjectType,
  ProjectStatus,
  Escrow,
  EarningsData,
  ConversationListItem,
  Conversation,
  Message,
  SendMessagePayload,
  DashboardStats,
  Dispute,
  DisputeDetail,
  ResolveDisputePayload,
  AdminUser,
  FlaggedMessage,
  ChatAuditConversation,
  Review,
  AdminProject,
  AdminEscrow,
  AdminPayout,
  AdminActionLog,
  EnhancedDashboardStats,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Token helpers ──────────────────────────────────────
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// ─── Request interceptor ────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor (auto-refresh) ────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refresh = getRefreshToken();
      if (!refresh) {
        clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<ApiResponse<TokenResponse>>(
          `${API_URL}/auth/refresh`,
          { refreshToken: refresh }
        );
        const { accessToken, refreshToken } = data.data;
        setTokens(accessToken, refreshToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ───────────────────────────────────────────
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
    const refresh = getRefreshToken();
    const { data } = await api.post<ApiResponse<TokenResponse>>('/auth/refresh', {
      refreshToken: refresh,
    });
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async me() {
    const { data } = await api.get<ApiResponse<MeResponse>>('/auth/me');
    return data.data;
  },

  logout() {
    clearTokens();
  },
};

// ─── User API ───────────────────────────────────────────
export const userApi = {
  async getProfile(userId: string) {
    const { data } = await api.get<ApiResponse<MeResponse>>(`/users/${userId}/profile`);
    return data.data;
  },

  async updateProfile(payload: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    companyName?: string;
  }) {
    const { data } = await api.put<ApiResponse<MeResponse>>('/users/profile', payload);
    return data.data;
  },

  async updatePortfolio(portfolioLinks: PortfolioLink[]) {
    const { data } = await api.put<ApiResponse<unknown>>('/users/freelancer/portfolio', {
      portfolioLinks,
    });
    return data.data;
  },

  async getFreelancer(userId: string) {
    const { data } = await api.get<ApiResponse<unknown>>(`/users/freelancer/${userId}`);
    return data.data;
  },

  async searchFreelancers(params?: {
    tier?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { data } = await api.get<PaginatedResponse<unknown>>('/users/freelancers', { params });
    return data;
  },
};

// ─── Project API ─────────────────────────────────────────
export interface ProjectListParams {
  categoryId?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  budgetMin?: number;
  budgetMax?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  categoryId: string;
  type: ProjectType;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  milestones?: Array<{ title: string; amount: number; dueDate?: string }>;
}

export const projectApi = {
  async list(params?: ProjectListParams) {
    const { data } = await api.get<PaginatedResponse<Project>>('/projects', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<ProjectDetail>>(`/projects/${id}`);
    return data.data;
  },

  async create(payload: CreateProjectPayload) {
    const { data } = await api.post<ApiResponse<ProjectDetail>>('/projects', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CreateProjectPayload>) {
    const { data } = await api.put<ApiResponse<ProjectDetail>>(`/projects/${id}`, payload);
    return data.data;
  },

  async updateStatus(id: string, status: ProjectStatus) {
    const { data } = await api.put<ApiResponse<Project>>(`/projects/${id}/status`, { status });
    return data.data;
  },

  async getMyProjects(status?: ProjectStatus) {
    const { data } = await api.get<ApiResponse<Project[]>>('/projects/my', {
      params: status ? { status } : undefined,
    });
    return data.data;
  },

  async deliver(id: string, payload: { description: string; link?: string; report?: string; file?: File }) {
    const formData = new FormData();
    formData.append('description', payload.description);
    if (payload.link) formData.append('link', payload.link);
    if (payload.report) formData.append('report', payload.report);
    if (payload.file) formData.append('file', payload.file);
    const { data } = await api.post<ApiResponse<any>>(`/projects/${id}/deliver`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async getDeliveries(id: string) {
    const { data } = await api.get<ApiResponse<any[]>>(`/projects/${id}/deliveries`);
    return data.data;
  },

  async getCategories() {
    const { data } = await api.get<ApiResponse<Category[]>>('/projects/categories');
    return data.data;
  },
};

// ─── Bid API ─────────────────────────────────────────────
export interface CreateBidPayload {
  amount: number;
  proposal: string;
  estimatedDays: number;
}

export const bidApi = {
  async create(projectId: string, payload: CreateBidPayload) {
    const { data } = await api.post<ApiResponse<Bid>>(`/bids/projects/${projectId}`, payload);
    return data.data;
  },

  async getProjectBids(projectId: string) {
    const { data } = await api.get<ApiResponse<Bid[]>>(`/bids/projects/${projectId}`);
    return data.data;
  },

  async getMyBids(status?: string) {
    const { data } = await api.get<ApiResponse<Bid[]>>('/bids/my', {
      params: status ? { status } : undefined,
    });
    return data.data;
  },

  async accept(bidId: string) {
    const { data } = await api.put<ApiResponse<Bid>>(`/bids/${bidId}/accept`);
    return data.data;
  },

  async withdraw(bidId: string) {
    const { data } = await api.put<ApiResponse<Bid>>(`/bids/${bidId}/withdraw`);
    return data.data;
  },
};

// ─── Escrow API ──────────────────────────────────────────
export const escrowApi = {
  async create(projectId: string) {
    const { data } = await api.post<ApiResponse<{ escrow: Escrow; snapToken: string }>>(
      '/escrow/create',
      { projectId }
    );
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<Escrow>>(`/escrow/${id}`);
    return data.data;
  },

  async getByProjectId(projectId: string) {
    const { data } = await api.get<ApiResponse<Escrow | null>>(`/escrow/project/${projectId}`);
    return data.data;
  },

  async checkPaymentStatus(id: string) {
    const { data } = await api.get<ApiResponse<{ status: string; updated: boolean }>>(`/escrow/${id}/check-status`);
    return data.data;
  },

  async release(id: string) {
    const { data } = await api.post<ApiResponse<{ escrow: Escrow }>>(`/escrow/${id}/release`);
    return data.data;
  },

  async getEarnings() {
    const { data } = await api.get<ApiResponse<EarningsData>>('/escrow/earnings');
    return data.data;
  },
};

// ─── Chat API ────────────────────────────────────────────
export const chatApi = {
  async getConversations() {
    const { data } = await api.get<ApiResponse<ConversationListItem[]>>('/chat/conversations');
    return data.data;
  },

  async getConversation(projectId: string) {
    const { data } = await api.get<ApiResponse<Conversation>>(`/chat/conversations/${projectId}`);
    return data.data;
  },

  async getMessages(conversationId: string, page = 1) {
    const { data } = await api.get<PaginatedResponse<Message>>(`/chat/messages/${conversationId}`, {
      params: { page },
    });
    return data;
  },

  async sendMessage(payload: SendMessagePayload) {
    const { data } = await api.post<ApiResponse<Message>>('/chat/messages', payload);
    return data.data;
  },

  async uploadFile(file: File, conversationId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    const { data } = await api.post<ApiResponse<{ fileUrl: string; message: Message }>>(
      '/chat/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },
};

// ─── Review API ──────────────────────────────────────────
export const reviewApi = {
  async create(payload: {
    projectId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
  }) {
    const { data } = await api.post<ApiResponse<Review>>('/reviews', payload);
    return data.data;
  },

  async getByUser(userId: string, page = 1) {
    const { data } = await api.get<PaginatedResponse<Review>>(`/reviews/user/${userId}`, {
      params: { page },
    });
    return data;
  },
};

// ─── Dispute API ─────────────────────────────────────────
export const disputeApi = {
  async create(payload: { projectId: string; reason: string; description: string }) {
    const { data } = await api.post<ApiResponse<Dispute>>('/disputes', payload);
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<DisputeDetail>>(`/disputes/${id}`);
    return data.data;
  },
};

// ─── Admin API ───────────────────────────────────────────
export const adminApi = {
  async getDashboardStats() {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return data.data;
  },

  async getDisputes(params?: { status?: string; page?: number; limit?: number }) {
    const { data } = await api.get<PaginatedResponse<Dispute>>('/admin/disputes', { params });
    return data;
  },

  async resolveDispute(id: string, payload: ResolveDisputePayload) {
    const { data } = await api.put<ApiResponse<Dispute>>(`/admin/disputes/${id}/resolve`, payload);
    return data.data;
  },

  async getChatAudit(conversationId: string) {
    const { data } = await api.get<ApiResponse<ChatAuditConversation>>(
      `/admin/chat-audit/${conversationId}`
    );
    return data.data;
  },

  async getFlaggedMessages(page = 1, limit = 50) {
    const { data } = await api.get<PaginatedResponse<FlaggedMessage>>('/admin/message-flags', {
      params: { page, limit },
    });
    return data;
  },

  async listUsers(params?: {
    role?: string;
    suspended?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { data } = await api.get<PaginatedResponse<AdminUser>>('/admin/users', { params });
    return data;
  },

  async suspendUser(id: string, reason: string) {
    const { data } = await api.put<ApiResponse<null>>(`/admin/users/${id}/suspend`, { reason });
    return data;
  },

  async unsuspendUser(id: string) {
    const { data } = await api.put<ApiResponse<null>>(`/admin/users/${id}/unsuspend`);
    return data;
  },

  async adjustTier(freelancerId: string, tier: string) {
    const { data } = await api.put<ApiResponse<null>>(`/admin/freelancers/${freelancerId}/tier`, {
      tier,
    });
    return data;
  },

  async getEnhancedStats() {
    const { data } = await api.get<ApiResponse<EnhancedDashboardStats>>('/admin/dashboard/enhanced');
    return data.data;
  },

  async listProjects(params?: {
    status?: string;
    categoryId?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { data } = await api.get<PaginatedResponse<AdminProject>>('/admin/projects', { params });
    return data;
  },

  async listEscrows(params?: { status?: string; page?: number; limit?: number }) {
    const { data } = await api.get<PaginatedResponse<AdminEscrow>>('/admin/escrows', { params });
    return data;
  },

  async listPayouts(params?: { status?: string; page?: number; limit?: number }) {
    const { data } = await api.get<PaginatedResponse<AdminPayout>>('/admin/payouts', { params });
    return data;
  },

  async getActivityLog(params?: { page?: number; limit?: number }) {
    const { data } = await api.get<PaginatedResponse<AdminActionLog>>('/admin/activity-log', {
      params,
    });
    return data;
  },
};

export default api;
