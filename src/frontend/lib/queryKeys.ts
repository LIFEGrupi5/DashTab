export const queryKeys = {
  orders: { all: ['orders'] as const },
  menu: { all: ['menu'] as const },
  categories: { all: ['categories'] as const },
  users: { all: ['users'] as const },
  auth: { me: (token: string | null) => ['auth', 'me', token] as const },
  schedule: {
    shifts: (weekStart: string) => ['schedule', 'shifts', weekStart] as const,
    requests: ['schedule', 'requests'] as const,
  },
} as const;
