import prisma from '../config/database';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { tierService } from './tier.service';

interface CreateReviewInput {
  projectId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

export class ReviewService {
  async create(reviewerId: string, input: CreateReviewInput) {
    const project = await prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project) throw new NotFoundError('Project');
    if (project.status !== 'COMPLETED') {
      throw new AppError('Can only review completed projects', 400);
    }

    // Verify reviewer is participant
    if (project.clientId !== reviewerId && project.selectedFreelancerId !== reviewerId) {
      throw new ForbiddenError('You are not a participant in this project');
    }

    // Verify reviewee is the other participant
    if (input.revieweeId === reviewerId) {
      throw new AppError('Cannot review yourself', 400);
    }

    if (input.revieweeId !== project.clientId && input.revieweeId !== project.selectedFreelancerId) {
      throw new AppError('Reviewee is not a participant in this project', 400);
    }

    // Check existing review
    const existing = await prisma.review.findUnique({
      where: { projectId_reviewerId: { projectId: input.projectId, reviewerId } },
    });
    if (existing) throw new ConflictError('You already reviewed this project');

    // Validate rating
    if (input.rating < 1 || input.rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    const review = await prisma.review.create({
      data: {
        projectId: input.projectId,
        reviewerId,
        revieweeId: input.revieweeId,
        rating: input.rating,
        comment: input.comment,
      },
      include: {
        reviewer: {
          include: {
            freelancerProfile: { select: { displayName: true } },
            clientProfile: { select: { displayName: true } },
          },
        },
      },
    });

    // Recalculate tier if reviewee is a freelancer
    const reviewee = await prisma.user.findUnique({ where: { id: input.revieweeId } });
    if (reviewee?.role === 'FREELANCER') {
      await tierService.recalculate(input.revieweeId);
    }

    return review;
  }

  async getByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId },
        include: {
          reviewer: {
            include: {
              freelancerProfile: { select: { displayName: true, avatarUrl: true } },
              clientProfile: { select: { displayName: true } },
            },
          },
          project: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { revieweeId: userId } }),
    ]);

    return { reviews, total, page, limit };
  }
}

export const reviewService = new ReviewService();
