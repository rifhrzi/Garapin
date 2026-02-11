import { z } from 'zod';

export const bidFormSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  estimatedDays: z.number().int().positive('Must be at least 1 day').max(365),
  proposal: z
    .string()
    .min(20, 'Proposal must be at least 20 characters')
    .max(3000),
});

export type BidFormValues = z.infer<typeof bidFormSchema>;
