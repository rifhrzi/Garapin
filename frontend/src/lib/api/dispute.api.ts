import api from './client';
import type { ApiResponse, Dispute, DisputeDetail } from '@/types';

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
