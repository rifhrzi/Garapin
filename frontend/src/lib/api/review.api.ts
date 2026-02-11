import api from './client';
import type { ApiResponse, PaginatedResponse, Review } from '@/types';

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
