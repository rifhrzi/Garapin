import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { escrowService } from './escrow.service';
import { sendSuccess } from '../../utils/apiResponse';

export class EscrowController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const result = await escrowService.create(req.body.projectId, user.userId);
      sendSuccess(res, result, 'Escrow created', 201);
    } catch (error) {
      next(error);
    }
  }

  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      await escrowService.handleWebhook(req.body);
      sendSuccess(res, null, 'Notification processed');
    } catch (error) {
      next(error);
    }
  }

  async checkPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const result = await escrowService.checkPaymentStatus(req.params.id as string, user.userId);
      sendSuccess(res, result, result.updated ? 'Payment confirmed' : 'Payment not yet received');
    } catch (error) {
      next(error);
    }
  }

  async release(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const result = await escrowService.release(req.params.id as string, user.userId);
      sendSuccess(res, result, 'Funds released');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const escrow = await escrowService.getById(req.params.id as string);
      sendSuccess(res, escrow);
    } catch (error) {
      next(error);
    }
  }

  async getByProjectId(req: Request, res: Response, next: NextFunction) {
    try {
      const escrow = await escrowService.getByProjectId(req.params.projectId as string);
      sendSuccess(res, escrow);
    } catch (error) {
      next(error);
    }
  }

  async getEarnings(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const earnings = await escrowService.getFreelancerEarnings(user.userId);
      sendSuccess(res, earnings);
    } catch (error) {
      next(error);
    }
  }
}

export const escrowController = new EscrowController();
