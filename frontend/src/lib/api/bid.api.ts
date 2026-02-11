import api from './client';
import type { ApiResponse, Bid } from '@/types';

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
