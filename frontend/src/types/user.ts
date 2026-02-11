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

// Re-export utility functions from their canonical location for backward compatibility.
// New code should import from '@/lib/constants' instead.
export { getDisplayName, getTierLabel, getTierColor } from '@/lib/constants';
