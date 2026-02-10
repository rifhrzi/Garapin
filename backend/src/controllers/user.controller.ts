import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';

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
      const profile = await userService.updateProfile(
        req.user!.userId,
        req.user!.role,
        req.body
      );
      sendSuccess(res, profile, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }

  async updatePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const portfolio = await userService.updatePortfolio(req.user!.userId, req.body);
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

  async searchFreelancers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.searchFreelancers(req.query as any);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
