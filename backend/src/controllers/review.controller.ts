import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/review.service';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';

export class ReviewController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.create(req.user!.userId, req.body);
      sendSuccess(res, review, 'Review submitted', 201);
    } catch (error) {
      next(error);
    }
  }

  async getByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await reviewService.getByUser(req.params.userId as string, page, limit);
      sendPaginated(res, result.reviews, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
