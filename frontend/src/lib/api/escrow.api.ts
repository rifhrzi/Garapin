import api from './client';
import type { ApiResponse, Escrow, EarningsData } from '@/types';

let createInFlight = false;
let releaseInFlight = false;

export const escrowApi = {
  async create(projectId: string) {
    if (createInFlight) throw new Error('Payment already in progress');
    createInFlight = true;
    try {
      const { data } = await api.post<ApiResponse<{ escrow: Escrow; snapToken: string }>>(
        '/escrow/create',
        { projectId }
      );
      return data.data;
    } finally {
      createInFlight = false;
    }
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
    if (releaseInFlight) throw new Error('Release already in progress');
    releaseInFlight = true;
    try {
      const { data } = await api.post<ApiResponse<{ escrow: Escrow }>>(`/escrow/${id}/release`);
      return data.data;
    } finally {
      releaseInFlight = false;
    }
  },

  async getEarnings() {
    const { data } = await api.get<ApiResponse<EarningsData>>('/escrow/earnings');
    return data.data;
  },
};
