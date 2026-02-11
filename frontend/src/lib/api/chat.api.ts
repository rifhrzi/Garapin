import api from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  ConversationListItem,
  Conversation,
  Message,
  SendMessagePayload,
} from '@/types';

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
