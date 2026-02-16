import prisma from '../../config/database';
import { AppError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { logTransaction } from '../../utils/transactionLogger';

export class PayoutService {
  /**
   * Calculate the freelancer's available balance for withdrawal.
   * Available = sum(released escrow freelancerAmount) - sum(non-FAILED payout amounts)
   */
  async getAvailableBalance(freelancerId: string): Promise<number> {
    const [releasedAgg, payoutsAgg] = await Promise.all([
      prisma.escrow.aggregate({
        where: { freelancerId, status: 'RELEASED' },
        _sum: { freelancerAmount: true },
      }),
      prisma.payout.aggregate({
        where: {
          freelancerId,
          status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalReleased = Number(releasedAgg._sum.freelancerAmount ?? 0);
    const totalPayouts = Number(payoutsAgg._sum.amount ?? 0);

    return Math.max(0, totalReleased - totalPayouts);
  }

  /**
   * Freelancer requests a payout from available balance.
   * Bank details are copied from their profile at the time of request.
   *
   * SAFETY: The entire balance check + payout creation is wrapped in a
   * serializable transaction to prevent race conditions from concurrent requests.
   */
  async requestPayout(freelancerId: string, amount: number) {
    // Amount boundary validation (defense-in-depth, also validated by Zod schema)
    if (amount <= 0) {
      throw new AppError('Payout amount must be greater than zero', 400);
    }
    if (amount < 10000) {
      throw new AppError('Minimum payout amount is Rp 10,000', 400);
    }
    if (amount > 50000000) {
      throw new AppError('Maximum payout amount is Rp 50,000,000', 400);
    }

    // Verify freelancer profile exists and has bank details (outside tx — read-only)
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: freelancerId },
    });

    if (!profile) throw new NotFoundError('Freelancer profile');

    if (!profile.bankCode || !profile.accountNumber || !profile.accountHolderName) {
      throw new AppError('Please set up your bank account details before requesting a payout', 400);
    }

    // Atomic balance check + payout creation to prevent concurrent overdraw
    const payout = await prisma.$transaction(async (tx) => {
      // Calculate available balance inside the transaction
      const [releasedAgg, payoutsAgg] = await Promise.all([
        tx.escrow.aggregate({
          where: { freelancerId, status: 'RELEASED' },
          _sum: { freelancerAmount: true },
        }),
        tx.payout.aggregate({
          where: {
            freelancerId,
            status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
          },
          _sum: { amount: true },
        }),
      ]);

      const totalReleased = Number(releasedAgg._sum.freelancerAmount ?? 0);
      const totalPayouts = Number(payoutsAgg._sum.amount ?? 0);
      const available = Math.max(0, totalReleased - totalPayouts);

      if (amount > available) {
        throw new AppError(
          `Insufficient balance. Available: ${available}, Requested: ${amount}`,
          400,
        );
      }

      // Create payout with bank details snapshot
      const newPayout = await tx.payout.create({
        data: {
          freelancerId,
          amount,
          status: 'PENDING',
          bankCode: profile.bankCode,
          bankName: profile.bankName,
          accountNumber: profile.accountNumber,
          accountHolderName: profile.accountHolderName,
        },
      });

      // Audit log inside the same transaction
      await tx.transactionLog.create({
        data: {
          type: 'PAYOUT_REQUESTED',
          referenceId: newPayout.id,
          referenceType: 'PAYOUT',
          amount,
          toStatus: 'PENDING',
          actorId: freelancerId,
          actorType: 'FREELANCER',
          metadata: {
            bankCode: profile.bankCode,
            bankName: profile.bankName,
            available,
          },
        },
      });

      return newPayout;
    }, {
      isolationLevel: 'Serializable',
    });

    logger.info('Payout requested', {
      payoutId: payout.id,
      freelancerId,
      amount,
    });

    return payout;
  }

  /**
   * Get paginated payout history for a freelancer.
   */
  async getPayoutHistory(freelancerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where: { freelancerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where: { freelancerId } }),
    ]);

    return {
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        bankCode: p.bankCode,
        bankName: p.bankName,
        accountNumber: p.accountNumber,
        accountHolderName: p.accountHolderName,
        notes: p.notes,
        failedReason: p.failedReason,
        processedAt: p.processedAt,
        completedAt: p.completedAt,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Cancel a pending payout (freelancer only, only PENDING status).
   */
  async cancelPayout(payoutId: string, freelancerId: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) throw new NotFoundError('Payout');
    if (payout.freelancerId !== freelancerId) {
      throw new ForbiddenError('Not your payout');
    }
    if (payout.status !== 'PENDING') {
      throw new AppError('Only pending payouts can be cancelled', 400);
    }

    await prisma.payout.delete({
      where: { id: payoutId },
    });

    // Audit log
    await logTransaction({
      type: 'PAYOUT_CANCELLED',
      referenceId: payoutId,
      referenceType: 'PAYOUT',
      amount: Number(payout.amount),
      fromStatus: 'PENDING',
      toStatus: 'CANCELLED',
      actorId: freelancerId,
      actorType: 'FREELANCER',
    });

    logger.info('Payout cancelled', { payoutId, freelancerId });

    return { message: 'Payout cancelled successfully' };
  }
}

export const payoutService = new PayoutService();
