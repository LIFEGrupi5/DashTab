'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, ShoppingBag, CheckCircle2, Clock, Wallet } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useOrders } from '@/hooks/useOrders';

const OverviewCharts = dynamic(() => import('@/components/OverviewCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-[232px] rounded-xl bg-neutral-100 dark:bg-muted/30 animate-pulse" />
      <div className="h-[232px] rounded-xl bg-neutral-100 dark:bg-muted/30 animate-pulse" />
    </div>
  ),
});

const HOUR_RANGE = Array.from({ length: 15 }, (_, i) => i + 8); // 8–22

export default function OverviewPage() {
  const { data: orders = [], isLoading } = useOrders();

  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed');
    const active = orders.filter(o => o.status !== 'completed');
    const totalRevenue = completed.reduce((s, o) => s + o.totalAmount, 0);
    const expectedRevenue = active.reduce((s, o) => s + o.totalAmount, 0);
    const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;
    return { totalRevenue, expectedRevenue, completedCount: completed.length, activeCount: active.length, avgOrderValue };
  }, [orders]);

  const ordersByHour = useMemo(() => {
    const buckets: Record<number, number> = {};
    for (const h of HOUR_RANGE) buckets[h] = 0;
    for (const o of orders) {
      if (!o.placedAtIso) continue;
      const h = new Date(o.placedAtIso).getHours();
      if (h in buckets) buckets[h]++;
    }
    return HOUR_RANGE.map(h => ({ hour: String(h), count: buckets[h] }));
  }, [orders]);

  const revenueByHour = useMemo(() => {
    const buckets: Record<number, number> = {};
    for (const h of HOUR_RANGE) buckets[h] = 0;
    for (const o of orders) {
      if (!o.placedAtIso) continue;
      const h = new Date(o.placedAtIso).getHours();
      if (h in buckets) buckets[h] += o.totalAmount;
    }
    return HOUR_RANGE.map(h => ({ hour: String(h), revenue: buckets[h] }));
  }, [orders]);

  const topItems = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      for (const item of o.items) {
        if (!map[item.menuItemName]) map[item.menuItemName] = { count: 0, revenue: 0 };
        map[item.menuItemName].count += item.quantity;
        map[item.menuItemName].revenue += item.amount;
      }
    }
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  const maxCount = Math.max(...ordersByHour.map(h => h.count), 1);
  const peakRevenueHour = revenueByHour.reduce((a, b) => (b.revenue > a.revenue ? b : a));

  const statCards = [
    { label: 'Total Revenue',    value: `€${stats.totalRevenue.toFixed(2)}`,   icon: TrendingUp,  color: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-200' },
    { label: 'Expected Revenue', value: `€${stats.expectedRevenue.toFixed(2)}`, icon: Wallet,      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200' },
    { label: 'Completed Orders', value: stats.completedCount,                   icon: CheckCircle2,color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-200' },
    { label: 'Active Orders',    value: stats.activeCount,                      icon: ShoppingBag, color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-200' },
    { label: 'Avg. Order Value', value: `€${stats.avgOrderValue.toFixed(2)}`,   icon: Clock,       color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-200' },
  ];

  return (
    <div className="p-6 w-[95%] mx-auto">
      <PageHeader
        title="Overview"
        subtitle={new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })}
        className="mb-8"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-5">
          <h2 className="font-semibold text-neutral-900 dark:text-foreground mb-4">Orders by Hour</h2>
          {isLoading ? (
            <div className="h-32 rounded-lg bg-neutral-100 dark:bg-muted/30 animate-pulse" />
          ) : (
            <div className="flex items-end gap-1.5 h-32 rounded-lg bg-neutral-50/80 dark:bg-muted/20 px-1 pt-2">
              {ordersByHour.map(h => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div
                    className="w-full bg-orange-400 dark:bg-orange-500/90 rounded-t-sm transition-all"
                    style={{ height: `${(h.count / maxCount) * 100}%`, minHeight: h.count > 0 ? 4 : 0 }}
                  />
                  <span className="text-[10px] text-neutral-500 dark:text-muted-foreground tabular-nums">{h.hour}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <OverviewCharts
          revenueByHour={revenueByHour}
          peakRevenueHour={peakRevenueHour}
          isLoading={isLoading}
        />
      </div>

      <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-border">
          <h2 className="font-semibold text-neutral-900 dark:text-foreground">Top Ordered Items</h2>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-neutral-100 dark:bg-muted/30" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-border">
            {topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-muted text-neutral-500 dark:text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-neutral-800 dark:text-foreground font-medium min-w-0 truncate">
                  {item.name}
                </span>
                <span className="text-xs text-neutral-500 dark:text-muted-foreground whitespace-nowrap">{item.count} orders</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-foreground whitespace-nowrap">
                  €{item.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
