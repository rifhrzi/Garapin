import { Request, Response, NextFunction } from 'express';
import { payoutService } from '../services/payout.service';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';

export class PayoutController {
  async requestPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const payout = await payoutService.requestPayout(
        req.user!.userId,
        req.body.amount,
      );
      sendSuccess(res, payout, 'Payout requested successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await payoutService.getPayoutHistory(
        req.user!.userId,
        page,
        limit,
      );
      sendPaginated(res, result.payouts, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async cancelPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payoutService.cancelPayout(
        req.params.id as string,
        req.user!.userId,
      );
      sendSuccess(res, result, 'Payout cancelled');
    } catch (error) {
      next(error);
    }
  }

  async getAvailableBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const available = await payoutService.getAvailableBalance(req.user!.userId);
      sendSuccess(res, { available });
    } catch (error) {
      next(error);
    }
  }
}

export const payoutController = new PayoutController();
