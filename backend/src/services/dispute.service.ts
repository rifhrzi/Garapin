import prisma from '../config/database';
import { DisputeOutcome, Prisma } from '@prisma/client';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';

interface CreateDisputeInput {
  projectId: string;
  reason: string;
  description: string;
}

interface ResolveDisputeInput {
  resolution: string;
  outcome: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NO_REFUND';
}

export class DisputeService {
  async create(userId: string, input: CreateDisputeInput) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      include: { escrow: true },
    });
    if (!project) throw new NotFoundError('Project');

    if (project.clientId !== userId && project.selectedFreelancerId !== userId) {
      throw new ForbiddenError('Not a participant in this project');
    }

    if (!['IN_PROGRESS', 'DELIVERED'].includes(project.status)) {
      throw new AppError('Cannot open dispute for this project status', 400);
    }

    // Check existing open dispute
    const existing = await prisma.dispute.findFirst({
      where: { projectId: input.projectId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    });
    if (existing) throw new AppError('An active dispute already exists for this project', 400);

    const dispute = await prisma.$transaction(async (tx) => {
      const d = await tx.dispute.create({
        data: {
          projectId: input.projectId,
          initiatedBy: userId,
          reason: input.reason,
          description: input.description,
        },
      });

      await tx.project.update({
        where: { id: input.projectId },
        data: { status: 'DISPUTED' },
      });

      if (project.escrow) {
        await tx.escrow.update({
          where: { id: project.escrow.id },
          data: { status: 'DISPUTED' },
        });
      }

      return d;
    });

    return dispute;
  }

  async resolve(disputeId: string, adminId: string, input: ResolveDisputeInput) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { project: { include: { escrow: true } } },
    });
    if (!dispute) throw new NotFoundError('Dispute');
    if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
      throw new AppError('Dispute is already resolved', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          adminId,
          resolution: input.resolution,
          outcome: input.outcome as DisputeOutcome,
          resolvedAt: new Date(),
        },
      });

      // Handle escrow based on outcome
      if (dispute.project.escrow) {
        if (input.outcome === 'FULL_REFUND') {
          await tx.escrow.update({
            where: { id: dispute.project.escrow.id },
            data: { status: 'REFUNDED' },
          });
          await tx.project.update({
            where: { id: dispute.projectId },
            data: { status: 'CANCELLED' },
          });
        } else if (input.outcome === 'NO_REFUND') {
          await tx.escrow.update({
            where: { id: dispute.project.escrow.id },
            data: { status: 'RELEASED', releasedAt: new Date() },
          });
          await tx.project.update({
            where: { id: dispute.projectId },
            data: { status: 'COMPLETED' },
          });
        } else {
          // PARTIAL_REFUND - mark as released, admin handles manually
          await tx.escrow.update({
            where: { id: dispute.project.escrow.id },
            data: { status: 'RELEASED', releasedAt: new Date() },
          });
          await tx.project.update({
            where: { id: dispute.projectId },
            data: { status: 'COMPLETED' },
          });
        }
      }

      // Log admin action
      await tx.adminAction.create({
        data: {
          adminId,
          actionType: 'DISPUTE_RESOLVE',
          targetType: 'DISPUTE',
          targetId: disputeId,
          details: { outcome: input.outcome, resolution: input.resolution },
        },
      });

      return updated;
    });

    return result;
  }

  async getById(disputeId: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        project: {
          include: {
            client: { include: { clientProfile: true } },
            selectedFreelancer: { include: { freelancerProfile: true } },
          },
        },
        initiator: {
          include: { freelancerProfile: true, clientProfile: true },
        },
        admin: true,
      },
    });
    if (!dispute) throw new NotFoundError('Dispute');
    return dispute;
  }

  async list(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.DisputeWhereInput = {};
    if (status) where.status = status as Prisma.EnumDisputeStatusFilter['equals'];

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          project: { select: { id: true, title: true } },
          initiator: {
            include: { freelancerProfile: true, clientProfile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    return { disputes, total, page, limit };
  }

  /**
   * Auto-dispute check: finds projects that may need auto-disputes
   * (ghosting or missed deadlines)
   */
  async checkAutoDisputes() {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Find projects with funded escrow but no messages in 5+ days
    const ghostedProjects = await prisma.project.findMany({
      where: {
        status: 'IN_PROGRESS',
        escrow: { status: 'FUNDED', fundedAt: { lt: fiveDaysAgo } },
        conversation: {
          messages: { none: { createdAt: { gt: fiveDaysAgo } } },
        },
        disputes: { none: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } },
      },
      select: { id: true, clientId: true },
    });

    // Find projects past deadline with no delivery
    const overdueProjects = await prisma.project.findMany({
      where: {
        status: 'IN_PROGRESS',
        deadline: { lt: now },
        disputes: { none: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } },
      },
      select: { id: true, clientId: true },
    });

    const autoDisputes = [];

    for (const project of ghostedProjects) {
      const dispute = await prisma.$transaction(async (tx) => {
        const d = await tx.dispute.create({
          data: {
            projectId: project.id,
            initiatedBy: project.clientId,
            reason: 'Freelancer ghosting (auto-detected)',
            description: 'No communication for 5+ days after escrow was funded.',
          },
        });
        await tx.project.update({
          where: { id: project.id },
          data: { status: 'DISPUTED' },
        });
        // Also mark escrow as disputed (consistent with manual disputes)
        await tx.escrow.updateMany({
          where: { projectId: project.id, status: 'FUNDED' },
          data: { status: 'DISPUTED' },
        });
        return d;
      });
      autoDisputes.push(dispute);
    }

    for (const project of overdueProjects) {
      const dispute = await prisma.$transaction(async (tx) => {
        const d = await tx.dispute.create({
          data: {
            projectId: project.id,
            initiatedBy: project.clientId,
            reason: 'Missed deadline (auto-detected)',
            description: 'Project deadline has passed without delivery.',
          },
        });
        await tx.project.update({
          where: { id: project.id },
          data: { status: 'DISPUTED' },
        });
        // Also mark escrow as disputed (consistent with manual disputes)
        await tx.escrow.updateMany({
          where: { projectId: project.id, status: 'FUNDED' },
          data: { status: 'DISPUTED' },
        });
        return d;
      });
      autoDisputes.push(dispute);
    }

    return autoDisputes;
  }
}

export const disputeService = new DisputeService();
