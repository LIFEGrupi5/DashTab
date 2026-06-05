'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, CreditCard, Users, ArrowUpRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import StatusBadge from '@/components/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { useRestaurant, useUpdateRestaurant, useSubscription } from '@/hooks/useRestaurant';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const STATUS_TONE: Record<string, string> = {
  active: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-200',
  incomplete: 'bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-200',
  canceled: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300',
};

export default function SettingsPage() {
  const router = useRouter();
  const user = useAppStore(s => s.user);
  const canEdit = user?.role === 'owner' || user?.role === 'manager';

  const { data: restaurant, isLoading } = useRestaurant();
  const { data: subscription } = useSubscription();
  const updateRestaurant = useUpdateRestaurant();

  const [name, setName] = useState('');
  useEffect(() => {
    if (restaurant) setName(restaurant.name);
  }, [restaurant]);

  const dirty = restaurant && name.trim() !== '' && name.trim() !== restaurant.name;

  const staffPct =
    subscription && subscription.staffLimit > 0
      ? Math.min(100, Math.round((subscription.staffUsed / subscription.staffLimit) * 100))
      : 0;

  return (
    <div className="p-6 w-[95%] max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your restaurant and subscription" className="mb-8" />

      {/* Restaurant details */}
      <section className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Store className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-neutral-900 dark:text-foreground">Restaurant</h2>
        </div>

        {isLoading ? (
          <div className="h-12 rounded-lg bg-neutral-100 dark:bg-muted/30 animate-pulse" />
        ) : (
          <div className="space-y-4">
            <TextField
              label="Restaurant name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!canEdit}
            />
            {restaurant ? (
              <p className="text-xs text-neutral-400 dark:text-muted-foreground">
                Created {new Date(restaurant.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            ) : null}
            {canEdit ? (
              <Button
                onClick={() => updateRestaurant.mutate(name.trim())}
                disabled={!dirty || updateRestaurant.isPending}
                className="rounded-xl"
              >
                {updateRestaurant.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            ) : (
              <p className="text-xs text-neutral-400 dark:text-muted-foreground">
                Only owners and managers can edit restaurant details.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Subscription */}
      <section className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-neutral-900 dark:text-foreground">Subscription</h2>
        </div>

        {subscription ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-foreground">
                  {PLAN_LABEL[subscription.plan] ?? subscription.plan}
                </p>
                {subscription.currentPeriodEnd ? (
                  <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-0.5">
                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                ) : null}
              </div>
              <StatusBadge
                label={subscription.status}
                toneClassName={STATUS_TONE[subscription.status] ?? STATUS_TONE.incomplete}
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="flex items-center gap-1.5 text-neutral-600 dark:text-muted-foreground">
                  <Users className="w-4 h-4" /> Staff
                </span>
                <span className="font-medium text-neutral-900 dark:text-foreground">
                  {subscription.staffUsed} / {subscription.staffLimit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 dark:bg-muted/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${staffPct >= 100 ? 'bg-red-500' : 'bg-orange-500'}`}
                  style={{ width: `${staffPct}%` }}
                />
              </div>
            </div>

            {canEdit ? (
              <Button variant="secondary" className="rounded-xl" onClick={() => router.push('/subscribe')}>
                Change plan <ArrowUpRight className="w-4 h-4" />
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-neutral-500 dark:text-muted-foreground">
            No active subscription.{' '}
            {canEdit ? (
              <button onClick={() => router.push('/subscribe')} className="text-orange-500 font-medium hover:text-orange-600">
                Choose a plan
              </button>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
