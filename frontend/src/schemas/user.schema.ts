import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  companyName: z.string().max(200).optional(),
});

export type ProfileForm = z.infer<typeof profileSchema>;

export const portfolioSchema = z.object({
  links: z.array(
    z.object({
      type: z.enum(['github', 'behance', 'dribbble', 'drive', 'website', 'other']),
      url: z.string().url('Must be a valid URL'),
      label: z.string().max(100),
    }),
  ),
});

export type PortfolioForm = z.infer<typeof portfolioSchema>;
