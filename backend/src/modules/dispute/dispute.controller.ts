import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { disputeService } from './dispute.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';

export class DisputeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const dispute = await disputeService.create(user.userId, req.body);
      sendSuccess(res, dispute, 'Dispute opened', 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const dispute = await disputeService.getById(req.params.id as string);
      sendSuccess(res, dispute);
    } catch (error) {
      next(error);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const dispute = await disputeService.resolve(
        req.params.id as string,
        user.userId,
        req.body
      );
      sendSuccess(res, dispute, 'Dispute resolved');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await disputeService.list(req.query.status as string | undefined, page, limit);
      sendPaginated(res, result.disputes, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }
}

export const disputeController = new DisputeController();
