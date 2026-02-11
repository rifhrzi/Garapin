import prisma from '../../config/database';
import { FreelancerTier, Prisma } from '@prisma/client';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors';

const BID_LIMITS: Record<FreelancerTier, number> = {
  BRONZE: 3,
  SILVER: 5,
  GOLD: 8,
  PLATINUM: 12,
  LEGEND: 999,
};

interface CreateBidInput {
  projectId: string;
  amount: number;
  proposal: string;
  estimatedDays: number;
}

export class BidService {
  async create(freelancerId: string, input: CreateBidInput) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      include: { category: true },
    });
    if (!project) throw new NotFoundError('Project');
    if (project.status !== 'OPEN') throw new AppError('Project is not accepting bids', 400);
    if (project.clientId === freelancerId) {
      throw new AppError('Cannot bid on your own project', 400);
    }

    // Check bid amount meets minimum
    if (input.amount < Number(project.category.minPrice)) {
      throw new AppError(
        `Bid must be at least Rp ${project.category.minPrice}`,
        400
      );
    }

    // Check existing bid
    const existingBid = await prisma.bid.findUnique({
      where: { projectId_freelancerId: { projectId: input.projectId, freelancerId } },
    });
    if (existingBid) throw new ConflictError('You already bid on this project');

    // Check bid limit based on tier
    const profile = await prisma.freelancerProfile.findUnique({ where: { userId: freelancerId } });
    if (!profile) throw new NotFoundError('Freelancer profile');

    const activeBids = await prisma.bid.count({
      where: { freelancerId, status: 'PENDING' },
    });

    const maxBids = BID_LIMITS[profile.tier];
    if (activeBids >= maxBids) {
      throw new AppError(
        `${profile.tier} tier limit: max ${maxBids} active bids. Upgrade your tier for more.`,
        400
      );
    }

    return prisma.bid.create({
      data: {
        projectId: input.projectId,
        freelancerId,
        amount: input.amount,
        proposal: input.proposal,
        estimatedDays: input.estimatedDays,
      },
      include: {
        freelancer: { include: { freelancerProfile: true } },
      },
    });
  }

  async getProjectBids(projectId: string, clientId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project');
    if (project.clientId !== clientId) throw new ForbiddenError('Not your project');

    return prisma.bid.findMany({
      where: { projectId },
      include: {
        freelancer: {
          include: {
            freelancerProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(bidId: string, clientId: string) {
    // Use interactive transaction to prevent race conditions
    return prisma.$transaction(async (tx) => {
      const bid = await tx.bid.findUnique({
        where: { id: bidId },
        include: { project: true },
      });
      if (!bid) throw new NotFoundError('Bid');
      if (bid.project.clientId !== clientId) throw new ForbiddenError('Not your project');
      if (bid.project.status !== 'OPEN') throw new AppError('Project is not open', 400);

      // Validate bid amount is within project budget range
      if (
        Number(bid.amount) < Number(bid.project.budgetMin) ||
        Number(bid.amount) > Number(bid.project.budgetMax)
      ) {
        throw new AppError('Bid amount is outside the project budget range', 400);
      }

      // Accept this bid and reject all others, update project
      await tx.bid.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED' },
      });
      await tx.bid.updateMany({
        where: { projectId: bid.projectId, id: { not: bidId } },
        data: { status: 'REJECTED' },
      });
      await tx.project.update({
        where: { id: bid.projectId },
        data: {
          selectedFreelancerId: bid.freelancerId,
          status: 'IN_PROGRESS',
        },
      });
      // Create conversation for the project (upsert to prevent duplicates)
      await tx.conversation.upsert({
        where: { projectId: bid.projectId },
        update: {},
        create: {
          projectId: bid.projectId,
          escrowActive: false,
        },
      });

      return tx.bid.findUnique({
        where: { id: bidId },
        include: { freelancer: { include: { freelancerProfile: true } }, project: true },
      });
    });
  }

  async withdraw(bidId: string, freelancerId: string) {
    const bid = await prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundError('Bid');
    if (bid.freelancerId !== freelancerId) throw new ForbiddenError('Not your bid');
    if (bid.status !== 'PENDING') throw new AppError('Can only withdraw pending bids', 400);

    return prisma.bid.update({
      where: { id: bidId },
      data: { status: 'WITHDRAWN' },
    });
  }

  async getMyBids(freelancerId: string, status?: string) {
    const where: Prisma.BidWhereInput = { freelancerId };
    if (status) where.status = status as Prisma.EnumBidStatusFilter['equals'];

    return prisma.bid.findMany({
      where,
      include: {
        project: {
          include: {
            category: true,
            client: { include: { clientProfile: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const bidService = new BidService();
