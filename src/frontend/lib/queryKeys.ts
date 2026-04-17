export const queryKeys = {
  orders: { all: ['orders'] as const },
  menu: { all: ['menu'] as const },
  users: { all: ['users'] as const },
  auth: { me: (token: string | null) => ['auth', 'me', token] as const },
} as const;
