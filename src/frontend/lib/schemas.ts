import { z } from 'zod';

export const staffSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['owner', 'manager', 'waiter', 'kitchen'] as const),
  startDate: z.string().min(1, 'Start date is required'),
  bio: z.string().optional(),
});

export type StaffFormData = z.infer<typeof staffSchema>;
