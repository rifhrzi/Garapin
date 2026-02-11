import api from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Project,
  ProjectDetail,
  Category,
  ProjectType,
  ProjectStatus,
  Delivery,
} from '@/types';

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
    const { data } = await api.post<ApiResponse<Delivery>>(`/projects/${id}/deliver`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async getDeliveries(id: string) {
    const { data } = await api.get<ApiResponse<Delivery[]>>(`/projects/${id}/deliveries`);
    return data.data;
  },

  async getCategories() {
    const { data } = await api.get<ApiResponse<Category[]>>('/projects/categories');
    return data.data;
  },
};
