import api from './client';
import type { ApiResponse, PaginatedResponse, PayoutHistoryItem } from '@/types';

let requestInFlight = false;

export const payoutApi = {
  async requestPayout(amount: number) {
    if (requestInFlight) throw new Error('Payout request already in progress');
    requestInFlight = true;
    try {
      const { data } = await api.post<ApiResponse<PayoutHistoryItem>>('/payouts/request', { amount });
      return data.data;
    } finally {
      requestInFlight = false;
    }
  },

  async getHistory(page = 1, limit = 20) {
    const { data } = await api.get<PaginatedResponse<PayoutHistoryItem>>('/payouts/history', {
      params: { page, limit },
    });
    return data;
  },

  async getAvailableBalance() {
    const { data } = await api.get<ApiResponse<{ available: number }>>('/payouts/balance');
    return data.data;
  },

  async cancelPayout(id: string) {
    const { data } = await api.put<ApiResponse<{ message: string }>>(`/payouts/${id}/cancel`);
    return data.data;
  },
};
