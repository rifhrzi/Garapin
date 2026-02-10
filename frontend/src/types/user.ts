export type Role = 'CLIENT' | 'FREELANCER' | 'ADMIN';

export type FreelancerTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'LEGEND';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
  phoneVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  freelancerProfile: FreelancerProfile | null;
  clientProfile: ClientProfile | null;
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  portfolioLinks: PortfolioLink[];
  tier: FreelancerTier;
  expPoints: number;
  completedProjects: number;
  avgRating: number;
  completionRate: number;
  disputeRate: number;
  responseTimeAvg: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfile {
  id: string;
  userId: string;
  displayName: string;
  companyName: string | null;
  hasValidPayment: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioLink {
  type: 'github' | 'behance' | 'dribbble' | 'drive' | 'website' | 'other';
  url: string;
  label: string;
}

export interface PublicProfile extends Omit<User, 'phone' | 'isSuspended' | 'updatedAt'> {
  reviewsReceived?: Review[];
}

export interface Review {
  id: string;
  projectId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer?: {
    freelancerProfile?: { displayName: string } | null;
    clientProfile?: { displayName: string } | null;
  };
  project?: {
    id: string;
    title: string;
  };
}

export function getDisplayName(user: User | null): string {
  if (!user) return '';
  return (
    user.freelancerProfile?.displayName ||
    user.clientProfile?.displayName ||
    user.email
  );
}

export function getTierLabel(tier: FreelancerTier): string {
  const labels: Record<FreelancerTier, string> = {
    BRONZE: 'Bronze Crafter',
    SILVER: 'Silver Builder',
    GOLD: 'Gold Specialist',
    PLATINUM: 'Platinum Master',
    LEGEND: 'Legend Partner',
  };
  return labels[tier];
}

export function getTierColor(tier: FreelancerTier): string {
  const colors: Record<FreelancerTier, string> = {
    BRONZE: 'bg-orange-100 text-orange-800 border-orange-300',
    SILVER: 'bg-slate-100 text-slate-800 border-slate-300',
    GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    PLATINUM: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    LEGEND: 'bg-purple-100 text-purple-800 border-purple-300',
  };
  return colors[tier];
}
