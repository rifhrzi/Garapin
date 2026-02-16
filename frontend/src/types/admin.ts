import type { FreelancerTier } from './user';
import type { ProjectStatus, EscrowStatus, PayoutStatus } from './project';

// ─── Dashboard Stats ─────────────────────────────────────
export interface DashboardStats {
  users: {
    total: number;
    clients: number;
    freelancers: number;
  };
  projects: {
    total: number;
    open: number;
    active: number;
    completed: number;
  };
  disputes: {
    open: number;
  };
  revenue: {
    escrowHeld: number;
    platformRevenue: number;
  };
  flaggedMessages: number;
}

// ─── Disputes ────────────────────────────────────────────
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type DisputeOutcome = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NO_REFUND';

export interface Dispute {
  id: string;
  projectId: string;
  initiatedBy: string;
  adminId: string | null;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  outcome: DisputeOutcome | null;
  createdAt: string;
  resolvedAt: string | null;
  project?: {
    id: string;
    title: string;
  };
  initiator?: {
    id: string;
    email: string;
    role: string;
    freelancerProfile?: { displayName: string } | null;
    clientProfile?: { displayName: string } | null;
  };
  admin?: {
    id: string;
    email: string;
  } | null;
}

export interface DisputeDetail extends Dispute {
  project: {
    id: string;
    title: string;
    status: string;
    client?: {
      id: string;
      clientProfile?: { displayName: string } | null;
    };
    selectedFreelancer?: {
      id: string;
      freelancerProfile?: {
        displayName: string;
        tier: FreelancerTier;
      } | null;
    };
  };
}

export interface ResolveDisputePayload {
  resolution: string;
  outcome: DisputeOutcome;
}

// ─── Admin Users ─────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  phone: string | null;
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  emailVerified: boolean;
  isSuspended: boolean;
  isBanned: boolean;
  warningCount: number;
  createdAt: string;
  freelancerProfile?: {
    displayName: string;
    tier: FreelancerTier;
    avgRating: number;
    completedProjects: number;
    completionRate: number;
    disputeRate: number;
    expPoints: number;
  } | null;
  clientProfile?: {
    displayName: string;
    companyName: string | null;
  } | null;
}

// ─── Flagged Messages ────────────────────────────────────
export type FlagType = 'PHONE' | 'EMAIL' | 'URL' | 'SOCIAL_MEDIA' | 'KEYWORD' | 'BEHAVIORAL';

export interface FlaggedMessage {
  id: string;
  messageId: string;
  flagType: FlagType;
  matchedPattern: string;
  createdAt: string;
  message: {
    id: string;
    content: string;
    originalContent: string | null;
    wasFiltered: boolean;
    createdAt: string;
    sender: {
      id: string;
      email: string;
      role: string;
      freelancerProfile?: { displayName: string } | null;
      clientProfile?: { displayName: string } | null;
    };
    conversation: {
      projectId: string;
    };
  };
}

// ─── Chat Audit ──────────────────────────────────────────
export interface ChatAuditMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  originalContent: string | null;
  type: 'TEXT' | 'FILE' | 'SYSTEM';
  fileUrl: string | null;
  wasFiltered: boolean;
  filterReason: string | null;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    role: string;
    freelancerProfile?: { displayName: string } | null;
    clientProfile?: { displayName: string } | null;
  };
  flags: Array<{
    id: string;
    flagType: FlagType;
    matchedPattern: string;
  }>;
}

export interface ChatAuditConversation {
  id: string;
  projectId: string;
  escrowActive: boolean;
  createdAt: string;
  project: {
    id: string;
    title: string;
    clientId: string;
    selectedFreelancerId: string | null;
  };
  messages: ChatAuditMessage[];
}

// ─── Admin Projects ─────────────────────────────────────
// ProjectStatus, EscrowStatus, PayoutStatus are imported from './project' to avoid duplication

export interface AdminProject {
  id: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  type: 'QUICK_TASK' | 'WEEKLY_PROJECT';
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  status: ProjectStatus;
  selectedFreelancerId: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    email: string;
    clientProfile?: { displayName: string; companyName: string | null } | null;
  };
  selectedFreelancer?: {
    id: string;
    email: string;
    freelancerProfile?: { displayName: string; tier: FreelancerTier } | null;
  } | null;
  category: { id: string; name: string; slug: string };
  escrow?: {
    id: string;
    status: string;
    totalAmount: number;
    platformFee: number;
    freelancerAmount: number;
  } | null;
  _count: { bids: number };
}

// ─── Admin Escrows ──────────────────────────────────────
export interface AdminEscrow {
  id: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  totalAmount: number;
  platformFee: number;
  freelancerAmount: number;
  status: EscrowStatus;
  midtransOrderId: string | null;
  midtransSnapToken: string | null;
  fundedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  project: { id: string; title: string };
  client: {
    id: string;
    email: string;
    clientProfile?: { displayName: string } | null;
  };
  freelancer: {
    id: string;
    email: string;
    freelancerProfile?: { displayName: string } | null;
  };
}

// ─── Admin Payouts ──────────────────────────────────────
export interface AdminPayout {
  id: string;
  escrowId: string | null;
  freelancerId: string;
  amount: number;
  midtransPayoutId: string | null;
  status: PayoutStatus;
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
  notes: string | null;
  failedReason: string | null;
  processedBy: string | null;
  processedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  freelancer: {
    id: string;
    email: string;
    freelancerProfile?: { displayName: string } | null;
  };
  escrow?: {
    id: string;
    project: { id: string; title: string };
  } | null;
}

// ─── Admin Activity Log ─────────────────────────────────
export interface AdminActionLog {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  admin: {
    id: string;
    email: string;
  };
}

// ─── Enhanced Dashboard Stats ───────────────────────────
export interface EnhancedDashboardStats extends DashboardStats {
  projectStatusDistribution: {
    draft: number;
    open: number;
    inProgress: number;
    delivered: number;
    completed: number;
    disputed: number;
    cancelled: number;
  };
  recentUsersCount: number;
  totalEscrows: number;
  totalPayouts: number;
  pendingPayouts: number;
  recentProjects: Array<{
    id: string;
    title: string;
    status: string;
    type: string;
    budgetMin: number;
    budgetMax: number;
    createdAt: string;
    client: {
      id: string;
      clientProfile?: { displayName: string } | null;
    };
    category: { name: string };
  }>;
  recentDisputes: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    project: { id: string; title: string };
    initiator: {
      id: string;
      email: string;
      freelancerProfile?: { displayName: string } | null;
      clientProfile?: { displayName: string } | null;
    };
  }>;
  recentEscrows: Array<{
    id: string;
    totalAmount: number;
    platformFee: number;
    status: string;
    createdAt: string;
    project: { id: string; title: string };
    client: {
      id: string;
      clientProfile?: { displayName: string } | null;
    };
    freelancer: {
      id: string;
      freelancerProfile?: { displayName: string } | null;
    };
  }>;
  recentAdminActions: Array<{
    id: string;
    actionType: string;
    targetType: string;
    targetId: string;
    details: Record<string, unknown> | null;
    createdAt: string;
    admin: { id: string; email: string };
  }>;
}
