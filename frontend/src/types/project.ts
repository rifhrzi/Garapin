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

export interface EarningsSummary {
  totalEarned: number;
  inEscrow: number;
  available: number;
  thisMonth: number;
}

export interface PayoutHistoryItem {
  id: string;
  amount: number;
  status: PayoutStatus;
  bankCode: string | null;
  accountNumber: string | null;
  projectTitle: string;
  projectId: string;
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

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    OPEN: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    DISPUTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  return colors[status];
}

export function getStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    DRAFT: 'Draft',
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    DISPUTED: 'Disputed',
    CANCELLED: 'Cancelled',
  };
  return labels[status];
}
