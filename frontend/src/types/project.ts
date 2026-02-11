export type ProjectType = 'QUICK_TASK' | 'WEEKLY_PROJECT';

export type ProjectStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type MilestoneStatus = 'PENDING' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED';

export type EscrowStatus = 'PENDING' | 'FUNDED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Escrow {
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
  payouts?: Payout[];
}

export interface Payout {
  id: string;
  escrowId: string;
  freelancerId: string;
  amount: number;
  status: PayoutStatus;
  bankCode: string | null;
  accountNumber: string | null;
  createdAt: string;
}

export interface BankDetails {
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
}

export interface EarningsSummary {
  totalEarned: number;
  inEscrow: number;
  available: number;
  thisMonth: number;
  pendingPayout: number;
}

export interface PayoutHistoryItem {
  id: string;
  amount: number;
  status: PayoutStatus;
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
  notes: string | null;
  failedReason: string | null;
  processedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface EarningsData {
  summary: EarningsSummary;
  payouts: PayoutHistoryItem[];
  escrows: Array<{
    id: string;
    projectId: string;
    projectTitle: string;
    totalAmount: number;
    platformFee: number;
    freelancerAmount: number;
    status: EscrowStatus;
    fundedAt: string | null;
    releasedAt: string | null;
  }>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  minPrice: number;
  isActive: boolean;
}

export interface Project {
  id: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  type: ProjectType;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  status: ProjectStatus;
  selectedFreelancerId: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    clientProfile?: { displayName: string } | null;
  };
  category?: Category;
  _count?: {
    bids: number;
  };
}

export interface ProjectReview {
  id: string;
  projectId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer?: {
    id?: string;
    freelancerProfile?: { displayName: string } | null;
    clientProfile?: { displayName: string } | null;
  };
}

export interface ProjectDetail extends Project {
  milestones?: Milestone[];
  selectedFreelancer?: {
    id: string;
    freelancerProfile?: {
      displayName: string;
      tier: string;
      avgRating: number;
      completedProjects: number;
      avatarUrl: string | null;
    } | null;
  } | null;
  escrow?: {
    id: string;
    status: string;
    totalAmount: number;
    platformFee: number;
    freelancerAmount: number;
    midtransSnapToken: string | null;
  } | null;
  reviews?: ProjectReview[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  amount: number;
  dueDate: string | null;
  status: MilestoneStatus;
  sortOrder: number;
}

export interface Bid {
  id: string;
  projectId: string;
  freelancerId: string;
  amount: number;
  proposal: string;
  estimatedDays: number;
  status: BidStatus;
  createdAt: string;
  freelancer?: {
    id: string;
    freelancerProfile?: {
      displayName: string;
      tier: string;
      avgRating: number;
      completedProjects: number;
      avatarUrl: string | null;
    } | null;
  };
}

export interface Delivery {
  id: string;
  projectId: string;
  freelancerId: string;
  description: string;
  fileUrl: string | null;
  link: string | null;
  report: string | null;
  createdAt: string;
  freelancer?: {
    id: string;
    freelancerProfile?: { displayName: string } | null;
  };
}

// Re-export utility functions from their canonical location for backward compatibility.
// New code should import from '@/lib/constants' instead.
export { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/constants';
