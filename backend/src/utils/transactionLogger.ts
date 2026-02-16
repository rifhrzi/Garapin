import prisma from '../config/database';
import { logger } from './logger';

interface TransactionLogInput {
    type: string;
    referenceId: string;
    referenceType: 'ESCROW' | 'PAYOUT';
    amount: number;
    fromStatus?: string;
    toStatus: string;
    actorId?: string;
    actorType?: 'CLIENT' | 'FREELANCER' | 'ADMIN' | 'SYSTEM';
    metadata?: Record<string, unknown>;
    ipAddress?: string;
}

/**
 * Creates an immutable transaction log entry for financial operations.
 * Accepts an optional transaction client (tx) for atomic logging inside $transaction blocks.
 * Falls back to the default prisma client if no tx is provided.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function logTransaction(input: TransactionLogInput, tx?: any) {
    const client = tx || prisma;
    try {
        return await client.transactionLog.create({
            data: {
                type: input.type,
                referenceId: input.referenceId,
                referenceType: input.referenceType,
                amount: input.amount,
                fromStatus: input.fromStatus ?? null,
                toStatus: input.toStatus,
                actorId: input.actorId ?? null,
                actorType: input.actorType ?? null,
                metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
                ipAddress: input.ipAddress ?? null,
            },
        });
    } catch (error) {
        // Never let audit logging break the main flow — log and continue
        logger.error('Failed to write transaction log', {
            type: input.type,
            referenceId: input.referenceId,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
