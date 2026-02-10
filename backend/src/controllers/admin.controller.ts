import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { tierService } from '../services/tier.service';
import { FreelancerTier } from '@prisma/client';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';

export class AdminController {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async flaggedMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await adminService.getFlaggedMessages(page, limit);
      sendPaginated(res, result.flags, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async chatAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const conversation = await adminService.chatAudit(req.params.conversationId as string);
      sendSuccess(res, conversation);
    } catch (error) {
      next(error);
    }
  }

  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.suspendUser(req.params.id as string, req.user!.userId, req.body.reason);
      sendSuccess(res, null, 'User suspended');
    } catch (error) {
      next(error);
    }
  }

  async unsuspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.unsuspendUser(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'User unsuspended');
    } catch (error) {
      next(error);
    }
  }

  async adjustTier(req: Request, res: Response, next: NextFunction) {
    try {
      await tierService.manualTierAdjust(
        req.params.id as string,
        req.body.tier as FreelancerTier,
        req.user!.userId
      );
      sendSuccess(res, null, 'Tier adjusted');
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listUsers(req.query as any);
      sendPaginated(res, result.users, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async listProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listProjects(req.query as any);
      sendPaginated(res, result.projects, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async listEscrows(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listEscrows(req.query as any);
      sendPaginated(res, result.escrows, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async listPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listPayouts(req.query as any);
      sendPaginated(res, result.payouts, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async activityLog(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getActivityLog(req.query as any);
      sendPaginated(res, result.actions, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async processPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.processPayout(req.params.id as string, req.user!.userId);
      sendSuccess(res, result, 'Payout marked as processing');
    } catch (error) {
      next(error);
    }
  }

  async completePayout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.completePayout(req.params.id as string, req.user!.userId);
      sendSuccess(res, result, 'Payout completed');
    } catch (error) {
      next(error);
    }
  }

  async failPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.failPayout(
        req.params.id as string,
        req.user!.userId,
        req.body.reason,
      );
      sendSuccess(res, result, 'Payout marked as failed');
    } catch (error) {
      next(error);
    }
  }

  async enhancedDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getEnhancedDashboardStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
