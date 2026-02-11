import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be under 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000),
  categoryId: z.string().min(1, 'Please select a category'),
  type: z.enum(['QUICK_TASK', 'WEEKLY_PROJECT']),
  budgetMin: z.number().positive('Budget must be positive'),
  budgetMax: z.number().positive('Budget must be positive'),
  deadline: z.string().min(1, 'Please select a deadline'),
  milestones: z
    .array(
      z.object({
        title: z.string().min(2, 'Milestone title required'),
        amount: z.number().positive('Amount must be positive'),
        dueDate: z.string().optional(),
      }),
    )
    .optional(),
});

export type CreateProjectValues = z.infer<typeof createProjectSchema>;
