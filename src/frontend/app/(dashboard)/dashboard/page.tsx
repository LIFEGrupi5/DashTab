'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChefHat, Clock3 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import IsometricLauncher from '@/components/IsometricLauncher';
import { useAppStore } from '@/stores/useAppStore';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { useOrders } from '@/hooks/useOrders';

const statusBadge: Record<
  'new' | 'preparing' | 'ready',
  { label: string; className: string; icon: typeof Clock3 }
> = {
  new: {
    label: 'New Order',
    className:
      'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/50',
    icon: Clock3,
  },
  preparing: {
    label: 'Preparing',
    className:
      'bg-amber-50 text-amber-800 border border-amber-100 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/45',
    icon: ChefHat,
  },
  ready: {
    label: 'Ready',
    className:
      'bg-green-50 text-green-700 border border-green-100 dark:bg-green-950/40 dark:text-green-200 dark:border-green-900/50',
    icon: CheckCircle2,
  },
};

export default function DashboardPage() {
  const hydrated = useStoreHydrated();
  const user = useAppStore(s => s.user);
  const { data: orders = [] } = useOrders();

  const isWaiter = user?.role === 'waiter';

  const waiterSummary = useMemo(() => {
    const newCount = orders.filter(o => o.status === 'new').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    return { newCount, preparing, ready };
  }, [orders]);

  const waiterRecent = useMemo(
    () =>
      orders.slice(0, 6).map(o => ({
        key: o.id,
        table: o.tableNumber,
        orderNumber: o.orderNumber,
        itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
        total: o.totalAmount,
        status: o.status === 'completed' ? ('ready' as const) : o.status,
      })),
    [orders]
  );

  if (!hydrated) {
    return (
      <div className="p-6 text-sm text-muted-foreground flex items-center justify-center min-h-[40vh]">Loading…</div>
    );
  }

  if (!isWaiter) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <IsometricLauncher />
      </div>
    );
  }

  return (
    <div className="p-6 w-[95%] mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Manage orders and serve customers"
        className="mb-6"
        action={
          <Link href="/orders/new">
            <Button className="rounded-xl px-4 py-2 text-sm">+ Create Order</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/80 dark:bg-blue-950/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-700/90 dark:text-blue-200/90">New Orders</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-0.5">{waiterSummary.newCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-200">
            <Clock3 className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-xl border border-amber-100 dark:border-amber-900/45 bg-amber-50/80 dark:bg-amber-950/25 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-800/90 dark:text-amber-200/90">Preparing</p>
            <p className="text-2xl font-bold text-amber-950 dark:text-amber-100 mt-0.5">{waiterSummary.preparing}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/45 flex items-center justify-center text-amber-700 dark:text-amber-200">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-xl border border-green-100 dark:border-green-900/50 bg-green-50/80 dark:bg-green-950/25 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-green-800/90 dark:text-green-200/90">Ready to Serve</p>
            <p className="text-2xl font-bold text-green-950 dark:text-green-100 mt-0.5">{waiterSummary.ready}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950/45 flex items-center justify-center text-green-700 dark:text-green-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      <section className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-border">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-foreground">Recent Orders</h2>
        </div>
        <ul className="divide-y divide-neutral-100 dark:divide-border">
          {waiterRecent.map(row => {
            const cfg = statusBadge[row.status];
            const Icon = cfg.icon;
            return (
              <li key={row.key} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500 dark:text-muted-foreground">Table</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-foreground">{row.table}</p>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-foreground mt-1">
                    Order #{row.orderNumber}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-0.5">
                    {row.itemCount} items · €{row.total.toFixed(2)}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
