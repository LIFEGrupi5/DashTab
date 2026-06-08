// Single source of truth for subscription plan definitions.
// Imported by both the in-app /subscribe page and the marketing /pricing page
// so prices, features, and tier names are always in sync.

export type Plan = {
  key: string;
  name: string;
  price: string;
  staff: string;
  features: readonly string[];
  highlight?: boolean;
};

export const PLANS: readonly Plan[] = [
  {
    key: 'basic',
    name: 'Basic',
    price: '€29',
    staff: 'Up to 10 staff members',
    features: ['Orders & kitchen display', 'Menu management', 'Up to 10 staff', 'Email support'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '€79',
    staff: 'Up to 25 staff members',
    features: ['Everything in Basic', 'Up to 25 staff', 'Analytics & reports', 'Priority support'],
    highlight: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '€199',
    staff: 'Up to 100 staff members',
    features: ['Everything in Pro', 'Up to 100 staff', 'Dedicated support', 'Custom onboarding'],
  },
] as const;
