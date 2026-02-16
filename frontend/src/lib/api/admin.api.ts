import api from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  Dispute,
  ResolveDisputePayload,
  AdminUser,
  FlaggedMessage,
  ChatAuditConversation,
  AdminProject,
  AdminEscrow,
  AdminPayout,
  AdminActionLog,
  EnhancedDashboardStats,
} from '@/types';

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

  async processPayout(id: string) {
    const { data } = await api.put<ApiResponse<AdminPayout>>(`/admin/payouts/${id}/process`);
    return data.data;
  },

  async completePayout(id: string) {
    const { data } = await api.put<ApiResponse<AdminPayout>>(`/admin/payouts/${id}/complete`);
    return data.data;
  },

  async failPayout(id: string, reason: string) {
    const { data } = await api.put<ApiResponse<AdminPayout>>(`/admin/payouts/${id}/fail`, { reason });
    return data.data;
  },

  async getActivityLog(params?: { page?: number; limit?: number }) {
    const { data } = await api.get<PaginatedResponse<AdminActionLog>>('/admin/activity-log', {
      params,
    });
    return data;
  },

  // ─── User Punishment ──────────────────────────────────

  async warnUser(id: string, reason: string) {
    const { data } = await api.put<ApiResponse<null>>(`/admin/users/${id}/warn`, { reason });
    return data;
  },

  async clearWarnings(id: string) {
    const { data } = await api.put<ApiResponse<null>>(`/admin/users/${id}/clear-warnings`);
    return data;
  },

  async banUser(id: string, reason: string) {
    const { data } = await api.put<ApiResponse<null>>(`/admin/users/${id}/ban`, { reason });
    return data;
  },

  async unbanUser(id: string) {
    const { data } = await api.put<ApiResponse<null>>(`/admin/users/${id}/unban`);
    return data;
  },

  async deleteUser(id: string, reason: string) {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/users/${id}`, { data: { reason } });
    return data;
  },

  // ─── Project Management ───────────────────────────────

  async updateProjectStatus(id: string, status: string, reason: string) {
    const { data } = await api.put<ApiResponse<null>>(`/admin/projects/${id}/status`, { status, reason });
    return data;
  },

  async deleteProject(id: string, reason: string) {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/projects/${id}`, { data: { reason } });
    return data;
  },
};
