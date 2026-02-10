import { Request, Response, NextFunction } from 'express';
import { bidService } from '../services/bid.service';
import { sendSuccess } from '../utils/apiResponse';

export class BidController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const bid = await bidService.create(req.user!.userId, {
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
      const bids = await bidService.getProjectBids(req.params.projectId as string, req.user!.userId);
      sendSuccess(res, bids);
    } catch (error) {
      next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const bid = await bidService.accept(req.params.id as string, req.user!.userId);
      sendSuccess(res, bid, 'Bid accepted');
    } catch (error) {
      next(error);
    }
  }

  async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const bid = await bidService.withdraw(req.params.id as string, req.user!.userId);
      sendSuccess(res, bid, 'Bid withdrawn');
    } catch (error) {
      next(error);
    }
  }

  async getMyBids(req: Request, res: Response, next: NextFunction) {
    try {
      const bids = await bidService.getMyBids(req.user!.userId, req.query.status as string);
      sendSuccess(res, bids);
    } catch (error) {
      next(error);
    }
  }
}

export const bidController = new BidController();
