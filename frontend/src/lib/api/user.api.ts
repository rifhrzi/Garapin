import api from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  PublicProfile,
  MeResponse,
  PortfolioLink,
  BankDetails,
} from '@/types';

export const userApi = {
  async getProfile(userId: string) {
    const { data } = await api.get<ApiResponse<PublicProfile>>(`/users/${userId}/profile`);
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

  async getBankDetails() {
    const { data } = await api.get<ApiResponse<BankDetails>>('/users/bank-details');
    return data.data;
  },

  async updateBankDetails(payload: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  }) {
    const { data } = await api.put<ApiResponse<BankDetails>>('/users/bank-details', payload);
    return data.data;
  },
};
