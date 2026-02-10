import prisma from '../config/database';
import { FreelancerTier } from '@prisma/client';

interface TierRequirements {
  minCompleted: number;
  minRating: number;
  minCompletionRate: number;
  maxDisputeRate: number;
  minResponseRate?: number;
}

const TIER_REQUIREMENTS: Record<FreelancerTier, TierRequirements> = {
  BRONZE: { minCompleted: 0, minRating: 0, minCompletionRate: 0, maxDisputeRate: 100 },
  SILVER: { minCompleted: 5, minRating: 4.0, minCompletionRate: 80, maxDisputeRate: 100 },
  GOLD: { minCompleted: 15, minRating: 4.3, minCompletionRate: 85, maxDisputeRate: 10 },
  PLATINUM: { minCompleted: 30, minRating: 4.5, minCompletionRate: 90, maxDisputeRate: 5 },
  LEGEND: {
    minCompleted: 50,
    minRating: 4.7,
    minCompletionRate: 95,
    maxDisputeRate: 3,
    // minResponseRate removed: response rate tracking is not yet implemented
  },
};

const TIER_ORDER: FreelancerTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'LEGEND'];

// EXP points awarded per action
const EXP_REWARDS = {
  PROJECT_COMPLETED: 100,
  FIVE_STAR_REVIEW: 50,
  ON_TIME_DELIVERY: 25,
  DISPUTE_PENALTY: -75,
};

export class TierService {
  /**
   * Recalculates a freelancer's tier and stats after a project completion.
   * Called after project status transitions to COMPLETED.
   */
  async recalculate(freelancerId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: freelancerId },
    });
    if (!profile) return;

    // Gather stats
    const totalProjects = await prisma.project.count({
      where: {
        selectedFreelancerId: freelancerId,
        status: { in: ['COMPLETED', 'CANCELLED', 'DISPUTED'] },
      },
    });

    const completedProjects = await prisma.project.count({
      where: { selectedFreelancerId: freelancerId, status: 'COMPLETED' },
    });

    const disputedProjects = await prisma.dispute.count({
      where: { project: { selectedFreelancerId: freelancerId } },
    });

    const reviews = await prisma.review.findMany({
      where: { revieweeId: freelancerId },
      select: { rating: true },
    });

    const avgRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 100;
    const disputeRate = totalProjects > 0 ? (disputedProjects / totalProjects) * 100 : 0;

    // Determine highest qualifying tier
    let newTier: FreelancerTier = 'BRONZE';
    for (const tier of TIER_ORDER) {
      const req = TIER_REQUIREMENTS[tier];
      if (
        completedProjects >= req.minCompleted &&
        avgRating >= req.minRating &&
        completionRate >= req.minCompletionRate &&
        disputeRate <= req.maxDisputeRate
      ) {
        newTier = tier;
      }
    }

    // Calculate EXP
    const expPoints =
      completedProjects * EXP_REWARDS.PROJECT_COMPLETED +
      reviews.filter((r) => r.rating === 5).length * EXP_REWARDS.FIVE_STAR_REVIEW +
      disputedProjects * EXP_REWARDS.DISPUTE_PENALTY;

    await prisma.freelancerProfile.update({
      where: { userId: freelancerId },
      data: {
        tier: newTier,
        completedProjects,
        avgRating: Math.round(avgRating * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        disputeRate: Math.round(disputeRate * 100) / 100,
        expPoints: Math.max(0, expPoints),
      },
    });

    return { newTier, completedProjects, avgRating, completionRate, disputeRate, expPoints };
  }

  async manualTierAdjust(freelancerId: string, tier: FreelancerTier, adminId: string) {
    await prisma.freelancerProfile.update({
      where: { userId: freelancerId },
      data: { tier },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'TIER_ADJUST',
        targetType: 'FREELANCER',
        targetId: freelancerId,
        details: { newTier: tier },
      },
    });
  }
}

export const tierService = new TierService();
