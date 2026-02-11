import prisma from '../../config/database';
import { Category, ProjectStatus, ProjectType, Prisma } from '@prisma/client';
import { AppError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { uploadDeliveryFile } from '../../utils/storage';

/**
 * Simple in-memory TTL cache for categories.
 * NOTE: In multi-instance deployments, replace with Redis or similar shared cache.
 */
class TTLCache<T> {
  private data: T | null = null;
  private expiresAt = 0;

  constructor(private readonly ttlMs: number) { }

  get(): T | null {
    if (this.data && Date.now() < this.expiresAt) return this.data;
    return null;
  }

  set(value: T): void {
    this.data = value;
    this.expiresAt = Date.now() + this.ttlMs;
  }

  invalidate(): void {
    this.data = null;
    this.expiresAt = 0;
  }
}

const categoriesCache = new TTLCache<Category[]>(5 * 60 * 1000); // 5 minutes

interface CreateProjectInput {
  title: string;
  description: string;
  categoryId: string;
  type: 'QUICK_TASK' | 'WEEKLY_PROJECT';
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  milestones?: Array<{ title: string; amount: number; dueDate?: string }>;
}

interface ProjectFilters {
  categoryId?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  budgetMin?: number;
  budgetMax?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export class ProjectService {
  async create(clientId: string, input: CreateProjectInput) {
    // Validate minimum price for category
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new NotFoundError('Category');

    if (input.budgetMin < Number(category.minPrice)) {
      throw new AppError(
        `Minimum budget for ${category.name} is Rp ${category.minPrice}`,
        400
      );
    }

    const project = await prisma.project.create({
      data: {
        clientId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        type: input.type as ProjectType,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        deadline: new Date(input.deadline),
        status: 'OPEN',
        ...(input.milestones && input.milestones.length > 0
          ? {
            milestones: {
              create: input.milestones.map((m, idx) => ({
                title: m.title,
                amount: m.amount,
                dueDate: m.dueDate ? new Date(m.dueDate) : null,
                sortOrder: idx,
              })),
            },
          }
          : {}),
      },
      include: {
        category: true,
        milestones: { orderBy: { sortOrder: 'asc' } },
        client: {
          include: { clientProfile: true },
        },
      },
    });

    return project;
  }

  async list(filters: ProjectFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = { status: { not: 'DRAFT' } };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.budgetMin) {
      where.budgetMax = { gte: filters.budgetMin };
    }
    if (filters.budgetMax) {
      where.budgetMin = { lte: filters.budgetMax };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          category: true,
          client: { include: { clientProfile: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total, page, limit };
  }

  async getById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        category: true,
        client: { include: { clientProfile: true } },
        selectedFreelancer: { include: { freelancerProfile: true } },
        milestones: { orderBy: { sortOrder: 'asc' } },
        escrow: true,
        reviews: {
          include: {
            reviewer: {
              include: {
                freelancerProfile: { select: { displayName: true } },
                clientProfile: { select: { displayName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { bids: true } },
      },
    });

    if (!project) throw new NotFoundError('Project');
    return project;
  }

  async update(projectId: string, clientId: string, input: Partial<CreateProjectInput>) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project');
    if (project.clientId !== clientId) throw new ForbiddenError('Not your project');
    if (!['DRAFT', 'OPEN'].includes(project.status)) {
      throw new AppError('Cannot edit a project that is already in progress', 400);
    }

    return prisma.project.update({
      where: { id: projectId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.budgetMin !== undefined && { budgetMin: input.budgetMin }),
        ...(input.budgetMax !== undefined && { budgetMax: input.budgetMax }),
        ...(input.deadline && { deadline: new Date(input.deadline) }),
      },
      include: { category: true, milestones: true },
    });
  }

  async updateStatus(
    projectId: string,
    userId: string,
    role: string,
    newStatus: ProjectStatus
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { escrow: true },
    });
    if (!project) throw new NotFoundError('Project');

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      OPEN: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['DELIVERED', 'DISPUTED', 'CANCELLED'],
      DELIVERED: ['COMPLETED', 'DISPUTED', 'IN_PROGRESS'],
      DISPUTED: ['COMPLETED', 'CANCELLED'],
    };

    if (!validTransitions[project.status]?.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from ${project.status} to ${newStatus}`,
        400
      );
    }

    // Authorization checks
    if (newStatus === 'DELIVERED' && project.selectedFreelancerId !== userId) {
      throw new ForbiddenError('Only the assigned freelancer can deliver');
    }
    if (newStatus === 'COMPLETED' && project.clientId !== userId) {
      throw new ForbiddenError('Only the client can approve completion');
    }
    if (newStatus === 'CANCELLED' && project.clientId !== userId && role !== 'ADMIN') {
      throw new ForbiddenError('Only the client or admin can cancel');
    }

    // If completing the project and escrow is funded, auto-release the escrow
    if (newStatus === 'COMPLETED' && project.escrow?.status === 'FUNDED') {
      // Create payout record
      await prisma.payout.create({
        data: {
          escrowId: project.escrow.id,
          freelancerId: project.escrow.freelancerId,
          amount: project.escrow.freelancerAmount,
          status: 'PENDING',
        },
      });

      // Atomically update escrow + project
      const [, updatedProject] = await prisma.$transaction([
        prisma.escrow.update({
          where: { id: project.escrow.id },
          data: { status: 'RELEASED', releasedAt: new Date() },
        }),
        prisma.project.update({
          where: { id: projectId },
          data: { status: newStatus },
        }),
      ]);

      return updatedProject;
    }

    return prisma.project.update({
      where: { id: projectId },
      data: { status: newStatus },
    });
  }

  async getMyProjects(userId: string, role: string, status?: ProjectStatus, page = 1, limit = 20) {
    const where: Prisma.ProjectWhereInput =
      role === 'CLIENT' ? { clientId: userId } : { selectedFreelancerId: userId };

    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          category: true,
          _count: { select: { bids: true } },
          escrow: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total, page, limit };
  }

  async deliver(
    projectId: string,
    freelancerId: string,
    input: { description: string; link?: string; report?: string },
    file?: Express.Multer.File
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { milestones: true },
    });
    if (!project) throw new NotFoundError('Project');
    if (project.selectedFreelancerId !== freelancerId) {
      throw new ForbiddenError('Only the assigned freelancer can deliver');
    }
    if (project.status !== 'IN_PROGRESS') {
      throw new AppError('Project must be in progress to deliver', 400);
    }

    // Validate at least link or file is provided
    if (!input.link && !file) {
      throw new AppError('You must provide a link or upload a file', 400);
    }

    // Validate report for milestone projects
    if (project.type === 'WEEKLY_PROJECT' && project.milestones.length > 0 && !input.report) {
      throw new AppError('Project report is required for milestone-based projects', 400);
    }

    // Upload file if provided
    let fileUrl: string | undefined;
    if (file) {
      fileUrl = await uploadDeliveryFile(file, projectId);
    }

    // Create delivery record and update project status in a transaction
    const [delivery] = await prisma.$transaction([
      prisma.delivery.create({
        data: {
          projectId,
          freelancerId,
          description: input.description,
          link: input.link || null,
          fileUrl: fileUrl || null,
          report: input.report || null,
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { status: 'DELIVERED' },
      }),
    ]);

    return delivery;
  }

  async getDeliveries(projectId: string) {
    return prisma.delivery.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        freelancer: {
          include: { freelancerProfile: { select: { displayName: true } } },
        },
      },
    });
  }

  async getCategories() {
    const cached = categoriesCache.get();
    if (cached) return cached;

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    categoriesCache.set(categories);
    return categories;
  }
}

export const projectService = new ProjectService();
