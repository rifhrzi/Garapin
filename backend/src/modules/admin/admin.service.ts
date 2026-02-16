import prisma from '../../config/database';
import { Prisma } from '@prisma/client';
import { AppError, NotFoundError } from '../../utils/errors';

export class AdminService {
  async getDashboardStats() {
    const [
      totalUsers,
      totalClients,
      totalFreelancers,
      totalProjects,
      openProjects,
      activeProjects,
      completedProjects,
      openDisputes,
      totalEscrowFunded,
      totalEscrowReleased,
      flaggedMessages,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'FREELANCER' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'OPEN' } }),
      prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.project.count({ where: { status: 'COMPLETED' } }),
      prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.escrow.aggregate({ where: { status: 'FUNDED' }, _sum: { totalAmount: true } }),
      prisma.escrow.aggregate({ where: { status: 'RELEASED' }, _sum: { platformFee: true } }),
      prisma.messageFlag.count(),
    ]);

    return {
      users: { total: totalUsers, clients: totalClients, freelancers: totalFreelancers },
      projects: {
        total: totalProjects,
        open: openProjects,
        active: activeProjects,
        completed: completedProjects,
      },
      disputes: { open: openDisputes },
      revenue: {
        escrowHeld: totalEscrowFunded._sum.totalAmount || 0,
        platformRevenue: totalEscrowReleased._sum.platformFee || 0,
      },
      flaggedMessages,
    };
  }

  async getFlaggedMessages(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [flags, total] = await Promise.all([
      prisma.messageFlag.findMany({
        include: {
          message: {
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  freelancerProfile: { select: { displayName: true } },
                  clientProfile: { select: { displayName: true } },
                },
              },
              conversation: { select: { projectId: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.messageFlag.count(),
    ]);

    return { flags, total, page, limit };
  }

  async chatAudit(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          select: { id: true, title: true, clientId: true, selectedFreelancerId: true },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
                freelancerProfile: { select: { displayName: true } },
                clientProfile: { select: { displayName: true } },
              },
            },
            flags: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) throw new NotFoundError('Conversation');
    return conversation;
  }

  async suspendUser(userId: string, adminId: string, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'SUSPEND_USER',
        targetType: 'USER',
        targetId: userId,
        details: { reason },
      },
    });
  }

  async unsuspendUser(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'UNSUSPEND_USER',
        targetType: 'USER',
        targetId: userId,
      },
    });
  }

  async listUsers(filters: { role?: string; suspended?: boolean; page?: number; limit?: number }) {
    const page = parseInt(String(filters.page)) || 1;
    const limit = Math.min(parseInt(String(filters.limit)) || 50, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = {};
    if (filters.role) where.role = filters.role as Prisma.EnumRoleFilter['equals'];
    if (filters.suspended !== undefined) where.isSuspended = filters.suspended;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          emailVerified: true,
          isSuspended: true,
          isBanned: true,
          warningCount: true,
          createdAt: true,
          freelancerProfile: true,
          clientProfile: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async listProjects(filters: {
    status?: string;
    categoryId?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = parseInt(String(filters.page)) || 1;
    const limit = Math.min(parseInt(String(filters.limit)) || 20, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.ProjectWhereInput = {};
    if (filters.status) where.status = filters.status as Prisma.EnumProjectStatusFilter['equals'];
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.type) where.type = filters.type as Prisma.EnumProjectTypeFilter['equals'];
    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              email: true,
              clientProfile: { select: { displayName: true, companyName: true } },
            },
          },
          selectedFreelancer: {
            select: {
              id: true,
              email: true,
              freelancerProfile: { select: { displayName: true, tier: true } },
            },
          },
          category: { select: { id: true, name: true, slug: true } },
          escrow: { select: { id: true, status: true, totalAmount: true, platformFee: true, freelancerAmount: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total, page, limit };
  }

  async listEscrows(filters: { status?: string; page?: number; limit?: number }) {
    const page = parseInt(String(filters.page)) || 1;
    const limit = Math.min(parseInt(String(filters.limit)) || 20, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.EscrowWhereInput = {};
    if (filters.status) where.status = filters.status as Prisma.EnumEscrowStatusFilter['equals'];

    const [escrows, total] = await Promise.all([
      prisma.escrow.findMany({
        where,
        include: {
          project: { select: { id: true, title: true } },
          client: {
            select: {
              id: true,
              email: true,
              clientProfile: { select: { displayName: true } },
            },
          },
          freelancer: {
            select: {
              id: true,
              email: true,
              freelancerProfile: { select: { displayName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.escrow.count({ where }),
    ]);

    return { escrows, total, page, limit };
  }

  async listPayouts(filters: { status?: string; page?: number; limit?: number }) {
    const page = parseInt(String(filters.page)) || 1;
    const limit = Math.min(parseInt(String(filters.limit)) || 20, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.PayoutWhereInput = {};
    if (filters.status) where.status = filters.status as Prisma.EnumPayoutStatusFilter['equals'];

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          freelancer: {
            select: {
              id: true,
              email: true,
              freelancerProfile: { select: { displayName: true } },
            },
          },
          escrow: {
            select: {
              id: true,
              project: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    return { payouts, total, page, limit };
  }

  async getActivityLog(filters: { page?: number; limit?: number }) {
    const page = parseInt(String(filters.page)) || 1;
    const limit = parseInt(String(filters.limit)) || 30;
    const skip = (page - 1) * limit;

    const [actions, total] = await Promise.all([
      prisma.adminAction.findMany({
        include: {
          admin: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminAction.count(),
    ]);

    return { actions, total, page, limit };
  }

  // ─── Payout Processing ──────────────────────────────────

  async processPayout(payoutId: string, adminId: string) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundError('Payout');
    if (payout.status !== 'PENDING') {
      throw new AppError(`Cannot process payout with status ${payout.status}`, 400);
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSING',
        processedBy: adminId,
        processedAt: new Date(),
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'PROCESS_PAYOUT',
        targetType: 'PAYOUT',
        targetId: payoutId,
        details: { amount: Number(payout.amount), freelancerId: payout.freelancerId },
      },
    });

    // Audit log
    await prisma.transactionLog.create({
      data: {
        type: 'PAYOUT_PROCESSING',
        referenceId: payoutId,
        referenceType: 'PAYOUT',
        amount: Number(payout.amount),
        fromStatus: 'PENDING',
        toStatus: 'PROCESSING',
        actorId: adminId,
        actorType: 'ADMIN',
        metadata: { freelancerId: payout.freelancerId },
      },
    });

    return updated;
  }

  async completePayout(payoutId: string, adminId: string) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundError('Payout');
    if (payout.status !== 'PROCESSING') {
      throw new AppError(`Cannot complete payout with status ${payout.status}`, 400);
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'COMPLETE_PAYOUT',
        targetType: 'PAYOUT',
        targetId: payoutId,
        details: { amount: Number(payout.amount), freelancerId: payout.freelancerId },
      },
    });

    // Audit log
    await prisma.transactionLog.create({
      data: {
        type: 'PAYOUT_COMPLETED',
        referenceId: payoutId,
        referenceType: 'PAYOUT',
        amount: Number(payout.amount),
        fromStatus: 'PROCESSING',
        toStatus: 'COMPLETED',
        actorId: adminId,
        actorType: 'ADMIN',
        metadata: { freelancerId: payout.freelancerId },
      },
    });

    return updated;
  }

  async failPayout(payoutId: string, adminId: string, reason: string) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundError('Payout');
    if (!['PENDING', 'PROCESSING'].includes(payout.status)) {
      throw new AppError(`Cannot fail payout with status ${payout.status}`, 400);
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'FAILED',
        failedReason: reason,
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'FAIL_PAYOUT',
        targetType: 'PAYOUT',
        targetId: payoutId,
        details: { amount: Number(payout.amount), freelancerId: payout.freelancerId, reason },
      },
    });

    // Audit log
    await prisma.transactionLog.create({
      data: {
        type: 'PAYOUT_FAILED',
        referenceId: payoutId,
        referenceType: 'PAYOUT',
        amount: Number(payout.amount),
        fromStatus: payout.status,
        toStatus: 'FAILED',
        actorId: adminId,
        actorType: 'ADMIN',
        metadata: { freelancerId: payout.freelancerId, reason },
      },
    });

    return updated;
  }

  async getEnhancedDashboardStats() {
    const baseStats = await this.getDashboardStats();

    // Get additional data in parallel
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      recentProjects,
      recentDisputes,
      recentEscrows,
      recentAdminActions,
      draftProjects,
      deliveredProjects,
      disputedProjects,
      cancelledProjects,
      recentUsers,
      totalEscrows,
      totalPayouts,
      pendingPayouts,
    ] = await Promise.all([
      // Recent projects
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              clientProfile: { select: { displayName: true } },
            },
          },
          category: { select: { name: true } },
        },
      }),
      // Recent disputes
      prisma.dispute.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, title: true } },
          initiator: {
            select: {
              id: true,
              email: true,
              freelancerProfile: { select: { displayName: true } },
              clientProfile: { select: { displayName: true } },
            },
          },
        },
      }),
      // Recent escrows
      prisma.escrow.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, title: true } },
          client: {
            select: {
              id: true,
              clientProfile: { select: { displayName: true } },
            },
          },
          freelancer: {
            select: {
              id: true,
              freelancerProfile: { select: { displayName: true } },
            },
          },
        },
      }),
      // Recent admin actions
      prisma.adminAction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, email: true } },
        },
      }),
      // Project status distribution extras
      prisma.project.count({ where: { status: 'DRAFT' } }),
      prisma.project.count({ where: { status: 'DELIVERED' } }),
      prisma.project.count({ where: { status: 'DISPUTED' } }),
      prisma.project.count({ where: { status: 'CANCELLED' } }),
      // Users registered in last 7 days
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      // Escrow & payout totals
      prisma.escrow.count(),
      prisma.payout.count(),
      prisma.payout.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      ...baseStats,
      projectStatusDistribution: {
        draft: draftProjects,
        open: baseStats.projects.open,
        inProgress: baseStats.projects.active,
        delivered: deliveredProjects,
        completed: baseStats.projects.completed,
        disputed: disputedProjects,
        cancelled: cancelledProjects,
      },
      recentUsersCount: recentUsers,
      totalEscrows,
      totalPayouts,
      pendingPayouts,
      recentProjects,
      recentDisputes,
      recentEscrows,
      recentAdminActions,
    };
  }
  // ─── User Punishment ──────────────────────────────────

  async warnUser(userId: string, adminId: string, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    if (user.role === 'ADMIN') throw new AppError('Cannot warn an admin', 400);

    await prisma.user.update({
      where: { id: userId },
      data: { warningCount: { increment: 1 } },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'WARN_USER',
        targetType: 'USER',
        targetId: userId,
        details: { reason, newWarningCount: user.warningCount + 1 },
      },
    });
  }

  async clearWarnings(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    await prisma.user.update({
      where: { id: userId },
      data: { warningCount: 0 },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'CLEAR_WARNINGS',
        targetType: 'USER',
        targetId: userId,
      },
    });
  }

  async banUser(userId: string, adminId: string, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    if (user.role === 'ADMIN') throw new AppError('Cannot ban an admin', 400);

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, isSuspended: true },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'BAN_USER',
        targetType: 'USER',
        targetId: userId,
        details: { reason },
      },
    });
  }

  async unbanUser(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, isSuspended: false },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'UNBAN_USER',
        targetType: 'USER',
        targetId: userId,
      },
    });
  }

  async deleteUser(userId: string, adminId: string, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    if (user.role === 'ADMIN') throw new AppError('Cannot delete an admin', 400);

    // Block if user has active escrows
    const activeEscrows = await prisma.escrow.count({
      where: {
        OR: [
          { clientId: userId, status: 'FUNDED' },
          { freelancerId: userId, status: 'FUNDED' },
        ],
      },
    });
    if (activeEscrows > 0) {
      throw new AppError('Cannot delete user with active (funded) escrows. Resolve escrows first.', 400);
    }

    // Log action before deletion
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'DELETE_USER',
        targetType: 'USER',
        targetId: userId,
        details: { reason, email: user.email, role: user.role },
      },
    });

    await prisma.user.delete({ where: { id: userId } });
  }

  // ─── Admin Project Management ──────────────────────────

  async adminUpdateProjectStatus(projectId: string, status: string, adminId: string, reason: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project');

    const oldStatus = project.status;

    await prisma.project.update({
      where: { id: projectId },
      data: { status: status as any },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'UPDATE_PROJECT_STATUS',
        targetType: 'PROJECT',
        targetId: projectId,
        details: { oldStatus, newStatus: status, reason },
      },
    });
  }

  async adminDeleteProject(projectId: string, adminId: string, reason: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { escrow: true },
    });
    if (!project) throw new NotFoundError('Project');

    if (project.escrow && project.escrow.status === 'FUNDED') {
      throw new AppError('Cannot delete project with a funded escrow. Resolve or refund the escrow first.', 400);
    }

    // Log action before deletion
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'DELETE_PROJECT',
        targetType: 'PROJECT',
        targetId: projectId,
        details: { reason, title: project.title, clientId: project.clientId },
      },
    });

    // Delete related records in order
    await prisma.$transaction([
      prisma.delivery.deleteMany({ where: { projectId } }),
      prisma.review.deleteMany({ where: { projectId } }),
      prisma.dispute.deleteMany({ where: { projectId } }),
      prisma.message.deleteMany({ where: { conversation: { projectId } } }),
      prisma.conversation.deleteMany({ where: { projectId } }),
      prisma.payout.deleteMany({ where: { escrow: { projectId } } }),
      prisma.escrow.deleteMany({ where: { projectId } }),
      prisma.bid.deleteMany({ where: { projectId } }),
      prisma.milestone.deleteMany({ where: { projectId } }),
      prisma.project.delete({ where: { id: projectId } }),
    ]);
  }
}

export const adminService = new AdminService();
