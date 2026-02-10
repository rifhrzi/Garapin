import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  companyName?: string;
}

interface UpdatePortfolioInput {
  portfolioLinks: Array<{ type: string; url: string; label: string }>;
}

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        freelancerProfile: true,
        clientProfile: true,
        reviewsReceived: {
          include: {
            reviewer: { include: { freelancerProfile: true, clientProfile: true } },
            project: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) throw new NotFoundError('User');

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, role: string, input: UpdateProfileInput) {
    if (role === 'FREELANCER') {
      await prisma.freelancerProfile.update({
        where: { userId },
        data: {
          displayName: input.displayName,
          bio: input.bio,
          avatarUrl: input.avatarUrl,
        },
      });
    } else if (role === 'CLIENT') {
      await prisma.clientProfile.update({
        where: { userId },
        data: {
          displayName: input.displayName,
          companyName: input.companyName,
        },
      });
    }

    if (input.avatarUrl) {
      await prisma.user.update({ where: { id: userId }, data: { updatedAt: new Date() } });
    }

    return this.getProfile(userId);
  }

  async updatePortfolio(userId: string, input: UpdatePortfolioInput) {
    const profile = await prisma.freelancerProfile.update({
      where: { userId },
      data: { portfolioLinks: input.portfolioLinks as Prisma.InputJsonValue },
    });
    return profile;
  }

  async getFreelancerProfile(freelancerId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: freelancerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            reviewsReceived: {
              include: {
                reviewer: {
                  include: { freelancerProfile: true, clientProfile: true },
                },
                project: { select: { id: true, title: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!profile) throw new NotFoundError('Freelancer');
    return profile;
  }

  async updateBankDetails(userId: string, input: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  }) {
    const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Freelancer profile');

    return prisma.freelancerProfile.update({
      where: { userId },
      data: {
        bankCode: input.bankCode,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountHolderName: input.accountHolderName,
      },
      select: {
        bankCode: true,
        bankName: true,
        accountNumber: true,
        accountHolderName: true,
      },
    });
  }

  async getBankDetails(userId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: {
        bankCode: true,
        bankName: true,
        accountNumber: true,
        accountHolderName: true,
      },
    });
    if (!profile) throw new NotFoundError('Freelancer profile');
    return profile;
  }

  async searchFreelancers(filters: {
    tier?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FreelancerProfileWhereInput = {};
    if (filters.tier) where.tier = filters.tier as Prisma.EnumFreelancerTierFilter['equals'];
    if (filters.search) {
      where.displayName = { contains: filters.search, mode: 'insensitive' };
    }

    const [profiles, total] = await Promise.all([
      prisma.freelancerProfile.findMany({
        where,
        include: { user: { select: { id: true, email: true, createdAt: true } } },
        orderBy: [{ tier: 'desc' }, { avgRating: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.freelancerProfile.count({ where }),
    ]);

    return { profiles, total, page, limit };
  }
}

export const userService = new UserService();
