import prisma from '../config/database';
import { env } from '../config/env';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { midtransService } from './midtrans.service';
import { tierService } from './tier.service';

interface MidtransNotificationPayload {
  order_id: string;
  transaction_status: string;
  fraud_status: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  payment_type?: string;
  transaction_time?: string;
}

export class EscrowService {
  async create(projectId: string, clientId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        escrow: true,
        bids: { where: { status: 'ACCEPTED' } },
        client: true,
      },
    });

    if (!project) throw new NotFoundError('Project');
    if (project.clientId !== clientId) throw new ForbiddenError('Not your project');
    if (project.escrow) throw new AppError('Escrow already exists for this project', 400);
    if (project.bids.length === 0) throw new AppError('No accepted bid for this project', 400);

    const acceptedBid = project.bids[0];
    const totalAmount = Number(acceptedBid.amount);
    const platformFee = totalAmount * (env.PLATFORM_FEE_PERCENT / 100);
    const freelancerAmount = totalAmount - platformFee;

    // Create Midtrans Snap transaction
    // Midtrans order_id max 50 chars: use short prefix + truncated UUID + timestamp suffix
    const shortId = projectId.replace(/-/g, '').substring(0, 12);
    const orderId = `esc-${shortId}-${Date.now()}`;
    const transaction = await midtransService.createTransaction({
      orderId,
      amount: Math.round(totalAmount), // Midtrans IDR requires integer
      customerEmail: project.client.email,
      description: project.title,
    });

    const escrow = await prisma.escrow.create({
      data: {
        projectId,
        clientId,
        freelancerId: project.selectedFreelancerId!,
        totalAmount,
        platformFee,
        freelancerAmount,
        status: 'PENDING',
        midtransOrderId: orderId,
        midtransSnapToken: transaction.token,
      },
    });

    return { escrow, snapToken: transaction.token };
  }

  async handleWebhook(payload: MidtransNotificationPayload) {
    const orderId = payload.order_id;
    if (!orderId?.startsWith('escrow-')) return;

    // Verify signature
    if (!midtransService.verifySignature(payload)) {
      logger.warn('Invalid Midtrans webhook signature', { orderId });
      return;
    }

    // Find escrow by midtransOrderId
    const escrow = await prisma.escrow.findFirst({
      where: { midtransOrderId: orderId },
    });
    if (!escrow) return;

    const { transaction_status, fraud_status } = payload;

    if (midtransService.isPaymentSuccess(transaction_status, fraud_status)) {
      await prisma.$transaction([
        prisma.escrow.update({
          where: { id: escrow.id },
          data: { status: 'FUNDED', fundedAt: new Date() },
        }),
        // Unlock full chat features
        prisma.conversation.updateMany({
          where: { projectId: escrow.projectId },
          data: { escrowActive: true },
        }),
      ]);
    } else if (midtransService.isPaymentExpiredOrCancelled(transaction_status)) {
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: { status: 'PENDING' },
      });
    }
  }

  /**
   * Polls Midtrans for the transaction status and syncs it locally.
   * This is a fallback for when webhooks can't reach the backend.
   */
  async checkPaymentStatus(escrowId: string, userId: string) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { project: true },
    });
    if (!escrow) throw new NotFoundError('Escrow');
    if (escrow.clientId !== userId && escrow.freelancerId !== userId) {
      throw new ForbiddenError('Not your escrow');
    }

    // Already funded — nothing to do
    if (escrow.status !== 'PENDING') {
      return { status: escrow.status, updated: false };
    }

    if (!escrow.midtransOrderId) {
      throw new AppError('No Midtrans order linked to this escrow', 400);
    }

    const status = await midtransService.getTransactionStatus(escrow.midtransOrderId);

    if (midtransService.isPaymentSuccess(status.transaction_status, status.fraud_status)) {
      await prisma.$transaction([
        prisma.escrow.update({
          where: { id: escrow.id },
          data: { status: 'FUNDED', fundedAt: new Date() },
        }),
        prisma.conversation.updateMany({
          where: { projectId: escrow.projectId },
          data: { escrowActive: true },
        }),
      ]);
      return { status: 'FUNDED', updated: true };
    }

    return { status: escrow.status, updated: false };
  }

  async release(escrowId: string, clientId: string) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { project: true, freelancer: true },
    });

    if (!escrow) throw new NotFoundError('Escrow');
    if (escrow.clientId !== clientId) throw new ForbiddenError('Not your escrow');
    if (escrow.status !== 'FUNDED') throw new AppError('Escrow is not funded', 400);
    if (!['DELIVERED', 'COMPLETED'].includes(escrow.project.status)) {
      throw new AppError('Work must be delivered before release', 400);
    }

    // Use interactive transaction to ensure atomicity:
    // payout creation + escrow update + project update all succeed or all fail.
    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          escrowId: escrow.id,
          freelancerId: escrow.freelancerId,
          amount: escrow.freelancerAmount,
          status: 'PENDING',
        },
      });

      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      await tx.project.update({
        where: { id: escrow.projectId },
        data: { status: 'COMPLETED' },
      });

      return { escrow, payout };
    });

    // Recalculate freelancer tier after project completion (outside transaction - non-critical)
    try {
      await tierService.recalculate(escrow.freelancerId);
    } catch (error) {
      logger.error('Tier recalculation failed after escrow release', {
        escrowId: escrow.id,
        freelancerId: escrow.freelancerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return result;
  }

  async getByProjectId(projectId: string) {
    return prisma.escrow.findUnique({
      where: { projectId },
      include: { payouts: true },
    });
  }

  async getById(escrowId: string) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { project: true, payouts: true },
    });
    if (!escrow) throw new NotFoundError('Escrow');
    return escrow;
  }

  async getFreelancerEarnings(freelancerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Use database aggregation instead of loading all records into memory
    const [totalEarnedAgg, inEscrowAgg, thisMonthAgg, escrows, payouts] = await Promise.all([
      // Total earned (released escrows)
      prisma.escrow.aggregate({
        where: { freelancerId, status: 'RELEASED' },
        _sum: { freelancerAmount: true },
      }),
      // Currently held in escrow (funded)
      prisma.escrow.aggregate({
        where: { freelancerId, status: 'FUNDED' },
        _sum: { freelancerAmount: true },
      }),
      // Earned this month
      prisma.escrow.aggregate({
        where: { freelancerId, status: 'RELEASED', releasedAt: { gte: startOfMonth } },
        _sum: { freelancerAmount: true },
      }),
      // Escrow list for detail view
      prisma.escrow.findMany({
        where: { freelancerId },
        include: {
          project: { select: { id: true, title: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Payout history
      prisma.payout.findMany({
        where: { freelancerId },
        include: {
          escrow: {
            select: {
              project: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalEarned = Number(totalEarnedAgg._sum.freelancerAmount ?? 0);
    const inEscrow = Number(inEscrowAgg._sum.freelancerAmount ?? 0);
    const thisMonth = Number(thisMonthAgg._sum.freelancerAmount ?? 0);

    return {
      summary: {
        totalEarned,
        inEscrow,
        available: totalEarned, // In MVP, all released funds are "available"
        thisMonth,
      },
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        bankCode: p.bankCode,
        accountNumber: p.accountNumber,
        projectTitle: p.escrow.project.title,
        projectId: p.escrow.project.id,
        createdAt: p.createdAt,
      })),
      escrows: escrows.map((e) => ({
        id: e.id,
        projectId: e.project.id,
        projectTitle: e.project.title,
        totalAmount: Number(e.totalAmount),
        platformFee: Number(e.platformFee),
        freelancerAmount: Number(e.freelancerAmount),
        status: e.status,
        fundedAt: e.fundedAt,
        releasedAt: e.releasedAt,
      })),
    };
  }
}

export const escrowService = new EscrowService();
