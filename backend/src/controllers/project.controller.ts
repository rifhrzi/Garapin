import { Request, Response, NextFunction } from 'express';
import { ProjectStatus, ProjectType } from '@prisma/client';
import { projectService } from '../services/project.service';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';

export class ProjectController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.create(req.user!.userId, req.body);
      sendSuccess(res, project, 'Project created', 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        categoryId: req.query.categoryId as string | undefined,
        type: req.query.type as ProjectType | undefined,
        status: req.query.status as ProjectStatus | undefined,
        budgetMin: req.query.budgetMin ? Number(req.query.budgetMin) : undefined,
        budgetMax: req.query.budgetMax ? Number(req.query.budgetMax) : undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const result = await projectService.list(filters);
      sendPaginated(res, result.projects, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.getById(req.params.id as string);
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.update(req.params.id as string, req.user!.userId, req.body);
      sendSuccess(res, project, 'Project updated');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.updateStatus(
        req.params.id as string,
        req.user!.userId,
        req.user!.role,
        req.body.status
      );
      sendSuccess(res, project, 'Status updated');
    } catch (error) {
      next(error);
    }
  }

  async getMyProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as ProjectStatus | undefined;
      const result = await projectService.getMyProjects(
        req.user!.userId,
        req.user!.role,
        status,
        page,
        limit
      );
      sendPaginated(res, result.projects, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async deliver(req: Request, res: Response, next: NextFunction) {
    try {
      const delivery = await projectService.deliver(
        req.params.id as string,
        req.user!.userId,
        {
          description: req.body.description,
          link: req.body.link,
          report: req.body.report,
        },
        req.file
      );
      sendSuccess(res, delivery, 'Work delivered', 201);
    } catch (error) {
      next(error);
    }
  }

  async getDeliveries(req: Request, res: Response, next: NextFunction) {
    try {
      const deliveries = await projectService.getDeliveries(req.params.id as string);
      sendSuccess(res, deliveries);
    } catch (error) {
      next(error);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await projectService.getCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
