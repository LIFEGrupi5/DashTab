import { apiGet, apiPost } from './client';

export type Subscription = {
  plan: string;
  status: string;
  isActive: boolean;
  currentPeriodEnd: string | null;
  staffUsed: number;
  staffLimit: number;
};

export const createCheckout = (plan: string) =>
  apiPost<{ url: string }>('/subscriptions/checkout', { plan });

export const confirmCheckout = (sessionId: string) =>
  apiPost<Subscription>('/subscriptions/confirm', { sessionId });

export const fetchSubscription = () => apiGet<Subscription>('/subscriptions/me');
