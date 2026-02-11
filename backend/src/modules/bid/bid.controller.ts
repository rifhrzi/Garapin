import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { bidService } from './bid.service';
import { sendSuccess } from '../../utils/apiResponse';

export class BidController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const bid = await bidService.create(user.userId, {
        projectId: req.params.projectId as string,
        ...req.body,
      });
      sendSuccess(res, bid, 'Bid submitted', 201);
    } catch (error) {
      next(error);
    }
  }

  async getProjectBids(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const bids = await bidService.getProjectBids(req.params.projectId as string, user.userId);
      sendSuccess(res, bids);
    } catch (error) {
      next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const bid = await bidService.accept(req.params.id as string, user.userId);
      sendSuccess(res, bid, 'Bid accepted');
    } catch (error) {
      next(error);
    }
  }

  async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const bid = await bidService.withdraw(req.params.id as string, user.userId);
      sendSuccess(res, bid, 'Bid withdrawn');
    } catch (error) {
      next(error);
    }
  }

  async getMyBids(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const bids = await bidService.getMyBids(user.userId, req.query.status as string | undefined);
      sendSuccess(res, bids);
    } catch (error) {
      next(error);
    }
  }
}

export const bidController = new BidController();
