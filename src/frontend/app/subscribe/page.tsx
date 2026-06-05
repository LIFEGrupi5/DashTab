'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Check, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import { useAppStore } from '@/stores/useAppStore';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { createCheckout } from '@/lib/api/subscriptions';
import { toast } from 'sonner';

// Display copy only — the actual amount charged comes from the Stripe price IDs.
// Adjust these numbers to match what you configured in the Stripe dashboard.
const PLANS = [
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

export default function SubscribePage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const user = useAppStore(s => s.user);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !user) router.replace('/login');
  }, [hydrated, user, router]);

  const choose = async (plan: string) => {
    setLoading(plan);
    try {
      const { url } = await createCheckout(plan);
      window.location.href = url; // hand off to Stripe-hosted Checkout
    } catch {
      toast.error('Could not start checkout. Please try again.');
      setLoading(null);
    }
  };

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-background px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight">
            Choose your plan
          </h1>
          <p className="text-neutral-500 dark:text-muted-foreground mt-2 max-w-md">
            Pick a plan to activate your restaurant. You can change it later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border bg-white dark:bg-card p-6 flex flex-col ${
                'highlight' in plan && plan.highlight
                  ? 'border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500'
                  : 'border-neutral-200 dark:border-border'
              }`}
            >
              {'highlight' in plan && plan.highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most popular
                </span>
              ) : null}

              <h2 className="text-lg font-bold text-neutral-900 dark:text-foreground">{plan.name}</h2>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-extrabold text-neutral-900 dark:text-foreground">{plan.price}</span>
                <span className="text-sm text-neutral-500 dark:text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-muted-foreground mb-5">{plan.staff}</p>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-foreground">
                    <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                fullWidth
                variant={'highlight' in plan && plan.highlight ? 'primary' : 'secondary'}
                className="rounded-xl py-3"
                onClick={() => choose(plan.key)}
                disabled={loading !== null}
              >
                {loading === plan.key ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                ) : (
                  `Choose ${plan.name}`
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-neutral-400 dark:text-muted-foreground mt-8">
          Test mode — use card 4242 4242 4242 4242, any future expiry and any CVC.
        </p>
      </div>
    </div>
  );
}
