import type { ProjectStatus } from '@/types/project';
import type { FreelancerTier, User } from '@/types/user';

// ─── Currency formatting ─────────────────────────────────
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Project status helpers ──────────────────────────────
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

// ─── User helpers ────────────────────────────────────────
export function getDisplayName(user: User | null): string {
  if (!user) return '';
  return (
    user.freelancerProfile?.displayName ||
    user.clientProfile?.displayName ||
    user.email
  );
}

// ─── Tier helpers ────────────────────────────────────────
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
