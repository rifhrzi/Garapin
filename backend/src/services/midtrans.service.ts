import crypto from 'crypto';
import midtransClient from 'midtrans-client';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

interface CreateTransactionInput {
  orderId: string;
  amount: number;
  customerEmail: string;
  description: string;
}

export class MidtransService {
  private snap: midtransClient.Snap;
  private coreApi: midtransClient.CoreApi;

  constructor() {
    this.snap = new midtransClient.Snap({
      isProduction: env.MIDTRANS_IS_PRODUCTION,
      serverKey: env.MIDTRANS_SERVER_KEY,
      clientKey: env.MIDTRANS_CLIENT_KEY,
    });

    this.coreApi = new midtransClient.CoreApi({
      isProduction: env.MIDTRANS_IS_PRODUCTION,
      serverKey: env.MIDTRANS_SERVER_KEY,
      clientKey: env.MIDTRANS_CLIENT_KEY,
    });
  }

  async createTransaction(input: CreateTransactionInput): Promise<{ token: string; redirectUrl: string }> {
    try {
      const amount = Math.round(input.amount); // Midtrans IDR requires integer
      const parameter = {
        transaction_details: {
          order_id: input.orderId,
          gross_amount: amount,
        },
        customer_details: {
          email: input.customerEmail,
        },
        item_details: [
          {
            id: 'escrow-payment',
            price: amount,
            quantity: 1,
            name: input.description.substring(0, 50),
          },
        ],
        expiry: {
          unit: 'hours',
          duration: 24,
        },
      };

      const transaction = await this.snap.createTransaction(parameter);
      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
      };
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'Payment service unavailable';
      throw new AppError(`Midtrans transaction creation failed: ${message}`, 502);
    }
  }

  async getTransactionStatus(orderId: string): Promise<{ transaction_status: string; fraud_status: string }> {
    try {
      const status = await this.coreApi.transaction.status(orderId);
      return {
        transaction_status: status.transaction_status,
        fraud_status: status.fraud_status || 'accept',
      };
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'Payment service unavailable';
      throw new AppError(`Midtrans status check failed: ${message}`, 502);
    }
  }

  /**
   * Verifies a Midtrans webhook notification using SHA512 signature.
   * Signature = SHA512(order_id + status_code + gross_amount + serverKey)
   */
  verifySignature(notification: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): boolean {
    const { order_id, status_code, gross_amount, signature_key } = notification;
    if (!order_id || !status_code || !gross_amount || !signature_key) return false;

    const payload = order_id + status_code + gross_amount + env.MIDTRANS_SERVER_KEY;
    const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');

    return expectedSignature === signature_key;
  }

  /**
   * Returns true if the transaction status indicates a successful payment.
   */
  isPaymentSuccess(transactionStatus: string, fraudStatus: string): boolean {
    if (transactionStatus === 'capture') {
      return fraudStatus === 'accept';
    }
    return transactionStatus === 'settlement';
  }

  /**
   * Returns true if the transaction status indicates expiry/cancellation.
   */
  isPaymentExpiredOrCancelled(transactionStatus: string): boolean {
    return ['expire', 'cancel', 'deny'].includes(transactionStatus);
  }
}

export const midtransService = new MidtransService();
