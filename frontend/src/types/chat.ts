export type MessageType = 'TEXT' | 'FILE' | 'SYSTEM';

export interface MessageSender {
  id: string;
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  freelancerProfile?: { displayName: string; avatarUrl: string | null } | null;
  clientProfile?: { displayName: string } | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  originalContent?: string | null;
  type: MessageType;
  fileUrl?: string | null;
  wasFiltered: boolean;
  filterReason?: string | null;
  createdAt: string;
  sender: MessageSender;
}

export interface ConversationProject {
  id: string;
  title: string;
  status: string;
  clientId: string;
  selectedFreelancerId: string | null;
  client: {
    id: string;
    clientProfile?: { displayName: string } | null;
  };
  selectedFreelancer?: {
    id: string;
    freelancerProfile?: { displayName: string; avatarUrl: string | null } | null;
  } | null;
}

export interface ConversationListItem {
  id: string;
  projectId: string;
  escrowActive: boolean;
  project: ConversationProject;
  lastMessage: {
    id: string;
    content: string;
    type: MessageType;
    createdAt: string;
    senderId: string;
  } | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  escrowActive: boolean;
  createdAt: string;
  messages: Message[];
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageType;
  fileUrl?: string;
}
