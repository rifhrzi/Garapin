import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    role: z.enum(['CLIENT', 'FREELANCER']),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    displayName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms & Conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterForm = z.infer<typeof registerSchema>;
