import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { adminService } from './admin.service';
import { tierService } from '../../services/tier.service';
import { FreelancerTier } from '@prisma/client';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';

export class AdminController {
  async dashboard(_req: Request, res: Response, next: NextFunction) {
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
      const { user } = req as AuthenticatedRequest;
      await adminService.suspendUser(req.params.id as string, user.userId, req.body.reason);
      sendSuccess(res, null, 'User suspended');
    } catch (error) {
      next(error);
    }
  }

  async unsuspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      await adminService.unsuspendUser(req.params.id as string, user.userId);
      sendSuccess(res, null, 'User unsuspended');
    } catch (error) {
      next(error);
    }
  }

  async adjustTier(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      await tierService.manualTierAdjust(
        req.params.id as string,
        req.body.tier as FreelancerTier,
        user.userId
      );
      sendSuccess(res, null, 'Tier adjusted');
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        role: req.query.role as string | undefined,
        suspended: req.query.suspended === 'true' ? true : req.query.suspended === 'false' ? false : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const result = await adminService.listUsers(filters);
      sendPaginated(res, result.users, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async listProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        type: req.query.type as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const result = await adminService.listProjects(filters);
      sendPaginated(res, result.projects, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async listEscrows(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const result = await adminService.listEscrows(filters);
      sendPaginated(res, result.escrows, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async listPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const result = await adminService.listPayouts(filters);
      sendPaginated(res, result.payouts, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async activityLog(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const result = await adminService.getActivityLog(filters);
      sendPaginated(res, result.actions, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async processPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const result = await adminService.processPayout(req.params.id as string, user.userId);
      sendSuccess(res, result, 'Payout marked as processing');
    } catch (error) {
      next(error);
    }
  }

  async completePayout(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const result = await adminService.completePayout(req.params.id as string, user.userId);
      sendSuccess(res, result, 'Payout completed');
    } catch (error) {
      next(error);
    }
  }

  async failPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const result = await adminService.failPayout(
        req.params.id as string,
        user.userId,
        req.body.reason,
      );
      sendSuccess(res, result, 'Payout marked as failed');
    } catch (error) {
      next(error);
    }
  }

  async enhancedDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getEnhancedDashboardStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  // ─── User Punishment ──────────────────────────────────

  async warnUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      await adminService.warnUser(req.params.id as string, user.userId, req.body.reason);
      sendSuccess(res, null, 'Warning issued');
    } catch (error) {
      next(error);
    }
  }

  async clearWarnings(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      await adminService.clearWarnings(req.params.id as string, user.userId);
      sendSuccess(res, null, 'Warnings cleared');
    } catch (error) {
      next(error);
    }
  }

  async banUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      await adminService.banUser(req.params.id as string, user.userId, req.body.reason);
      sendSuccess(res, null, 'User banned');
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      await adminService.unbanUser(req.params.id as string, user.userId);
      sendSuccess(res, null, 'User unbanned');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      await adminService.deleteUser(req.params.id as string, user.userId, req.body.reason);
      sendSuccess(res, null, 'User deleted');
    } catch (error) {
      next(error);
    }
  }

  // ─── Project Management ───────────────────────────────

  async updateProjectStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      await adminService.adminUpdateProjectStatus(
        req.params.id as string,
        req.body.status,
        user.userId,
        req.body.reason,
      );
      sendSuccess(res, null, 'Project status updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      await adminService.adminDeleteProject(req.params.id as string, user.userId, req.body.reason);
      sendSuccess(res, null, 'Project deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
