import { z } from 'zod';

// Auth
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['CLIENT', 'FREELANCER']),
  displayName: z.string().min(2).max(100),
  companyName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Profile
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().optional(),
  companyName: z.string().max(200).optional(),
});

export const updateAccountSchema = z.object({
  phone: z.string().max(30).optional().nullable(),
});

export const updatePortfolioSchema = z.object({
  portfolioLinks: z.array(
    z.object({
      type: z.enum(['github', 'behance', 'dribbble', 'drive', 'website', 'other']),
      url: z.string().url(),
      label: z.string().max(100),
    })
  ),
});

// Project
const createProjectBaseSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  categoryId: z.string().uuid(),
  type: z.enum(['QUICK_TASK', 'WEEKLY_PROJECT']),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
  deadline: z.string().min(1, 'Deadline is required'),
  milestones: z
    .array(
      z.object({
        title: z.string().min(2).max(200),
        amount: z.number().positive(),
        dueDate: z.string().optional(),
      })
    )
    .optional(),
});

export const createProjectSchema = createProjectBaseSchema
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: 'Maximum budget must be >= minimum budget',
    path: ['budgetMax'],
  })
  .refine((data) => new Date(data.deadline) > new Date(), {
    message: 'Deadline must be in the future',
    path: ['deadline'],
  });

export const updateProjectSchema = createProjectBaseSchema.partial();

export const projectFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  type: z.enum(['QUICK_TASK', 'WEEKLY_PROJECT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']).optional(),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Bid
export const createBidSchema = z.object({
  amount: z.number().positive(),
  proposal: z.string().min(20).max(3000),
  estimatedDays: z.number().int().positive().max(365),
});

// Chat
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['TEXT', 'FILE']).default('TEXT'),
  fileUrl: z.string().url().optional(),
});

// Review
export const createReviewSchema = z.object({
  projectId: z.string().uuid(),
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

// Dispute
export const createDisputeSchema = z.object({
  projectId: z.string().uuid(),
  reason: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
});

export const resolveDisputeSchema = z.object({
  resolution: z.string().min(10).max(5000),
  outcome: z.enum(['FULL_REFUND', 'PARTIAL_REFUND', 'NO_REFUND']),
});

// Escrow
export const createEscrowSchema = z.object({
  projectId: z.string().uuid(),
});

// Project status
export const updateStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'CANCELLED']),
});

// Payout
export const requestPayoutSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
});

export const updateBankDetailsSchema = z.object({
  bankCode: z.string().min(2).max(20),
  bankName: z.string().min(2).max(100),
  accountNumber: z.string().min(5).max(30),
  accountHolderName: z.string().min(2).max(150),
});

export const failPayoutSchema = z.object({
  reason: z.string().min(5).max(500),
});

// Admin
export const suspendUserSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const tierAdjustSchema = z.object({
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'LEGEND']),
});

export const adminUpdateProjectStatusSchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'CANCELLED']),
  reason: z.string().min(5).max(500),
});

export const adminDeleteReasonSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const warnUserSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const banUserSchema = z.object({
  reason: z.string().min(5).max(500),
});
