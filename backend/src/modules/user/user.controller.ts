import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { userService } from './user.service';
import { sendSuccess } from '../../utils/apiResponse';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.getProfile(req.params.id as string);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const profile = await userService.updateProfile(
        user.userId,
        user.role,
        req.body
      );
      sendSuccess(res, profile, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }

  async updatePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const portfolio = await userService.updatePortfolio(user.userId, req.body);
      sendSuccess(res, portfolio, 'Portfolio updated');
    } catch (error) {
      next(error);
    }
  }

  async getFreelancer(req: Request, res: Response, next: NextFunction) {
    try {
      const freelancer = await userService.getFreelancerProfile(req.params.id as string);
      sendSuccess(res, freelancer);
    } catch (error) {
      next(error);
    }
  }

  async updateBankDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const result = await userService.updateBankDetails(user.userId, req.body);
      sendSuccess(res, result, 'Bank details updated');
    } catch (error) {
      next(error);
    }
  }

  async updateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const result = await userService.updateAccount(user.userId, req.body);
      sendSuccess(res, result, 'Account updated');
    } catch (error) {
      next(error);
    }
  }

  async getBankDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const result = await userService.getBankDetails(user.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async searchFreelancers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        tier: req.query.tier as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const result = await userService.searchFreelancers(filters);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
