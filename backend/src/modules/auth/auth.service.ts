import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { Role } from '@prisma/client';
import { AppError, ConflictError, UnauthorizedError } from '../../utils/errors';
import { JwtPayload } from '../../middleware/auth';

interface RegisterInput {
  email: string;
  password: string;
  phone?: string;
  role: 'CLIENT' | 'FREELANCER';
  displayName: string;
  companyName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role as Role,
        ...(input.role === 'FREELANCER'
          ? {
            freelancerProfile: {
              create: {
                displayName: input.displayName,
              },
            },
          }
          : {
            clientProfile: {
              create: {
                displayName: input.displayName,
                companyName: input.companyName,
              },
            },
          }),
      },
      include: {
        freelancerProfile: true,
        clientProfile: true,
      },
    });

    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: input.displayName,
      },
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { freelancerProfile: true, clientProfile: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.isSuspended) {
      throw new AppError('Your account has been suspended', 403);
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);
    const displayName =
      user.freelancerProfile?.displayName || user.clientProfile?.displayName || user.email;

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user || user.isSuspended) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { freelancerProfile: true, clientProfile: true },
    });
    if (!user) throw new UnauthorizedError('User not found');

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async verifyEmail(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  async verifyPhone(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true },
    });
  }

  private generateTokens(userId: string, email: string, role: Role) {
    const payload: JwtPayload = { userId, email, role };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
