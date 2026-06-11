'use client';

import { useMemo } from 'react';
import { CheckCircle2, Wallet, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useOrders } from '@/hooks/useOrders';
import { useUsers } from '@/hooks/useUsers';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function weekBounds(weeksAgo = 0) {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) - weeksAgo * 7);
  mon.setHours(0, 0, 0, 0);
  const end = new Date(mon);
  end.setDate(mon.getDate() + 7);
  return { start: mon, end };
}

function trendPct(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

function euros(n: number) {
  return `€${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReportsPage() {
  const { data: orders = [], isLoading } = useOrders();
  const { data: staff = [] } = useUsers();

  const thisWeek = useMemo(() => weekBounds(0), []);
  const lastWeek = useMemo(() => weekBounds(1), []);

  const inRange = (iso: string | undefined, range: { start: Date; end: Date }) =>
    !!iso && new Date(iso) >= range.start && new Date(iso) < range.end;

  const thisWeekOrders = useMemo(
    () => orders.filter(o => inRange(o.placedAtIso, thisWeek)),
    [orders, thisWeek],
  );
  const lastWeekOrders = useMemo(
    () => orders.filter(o => inRange(o.placedAtIso, lastWeek)),
    [orders, lastWeek],
  );

  const thisCompleted = useMemo(
    () => thisWeekOrders.filter(o => o.status === 'completed'),
    [thisWeekOrders],
  );
  const lastCompleted = useMemo(
    () => lastWeekOrders.filter(o => o.status === 'completed'),
    [lastWeekOrders],
  );

  const nsm      = thisCompleted.length;
  const nsmPrev  = lastCompleted.length;
  const revenue  = thisCompleted.reduce((s, o) => s + o.totalAmount, 0);
  const revPrev  = lastCompleted.reduce((s, o) => s + o.totalAmount, 0);
  const aov      = nsm > 0 ? revenue / nsm : 0;
  const aovPrev  = nsmPrev > 0 ? revPrev / nsmPrev : 0;

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayOrders = useMemo(
    () => orders.filter(o => !!o.placedAtIso && new Date(o.placedAtIso) >= todayStart),
    [orders, todayStart],
  );
  const todayRevenue  = todayOrders
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + o.totalAmount, 0);
  const todayInKitchen = todayOrders.filter(
    o => o.status !== 'completed' && o.status !== 'cancelled',
  ).length;

  const ordersByDay = useMemo(() => {
    const buckets = DAYS.map(day => ({ day, count: 0 }));
    for (const o of thisWeekOrders) {
      if (!o.placedAtIso) continue;
      const idx = (new Date(o.placedAtIso).getDay() + 6) % 7;
      buckets[idx].count++;
    }
    return buckets;
  }, [thisWeekOrders]);

  const maxDayCount = Math.max(...ordersByDay.map(d => d.count), 1);

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

  const weekEnd = new Date(thisWeek.end.getTime() - 1);
  const weekLabel = `${thisWeek.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const kpis = [
    {
      label: 'Completed Orders This Week',
      value: isLoading ? '—' : String(nsm),
      trend: isLoading ? null : trendPct(nsm, nsmPrev),
      icon: CheckCircle2,
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300',
    },
    {
      label: 'Revenue This Week',
      value: isLoading ? '—' : euros(revenue),
      trend: isLoading ? null : trendPct(revenue, revPrev),
      icon: Wallet,
      color: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300',
    },
    {
      label: 'Average Order Value',
      value: isLoading ? '—' : euros(aov),
      trend: isLoading ? null : trendPct(aov, aovPrev),
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
    },
  ];

  return (
    <div className="p-6 w-[95%] mx-auto">
      <PageHeader
        title="Business Overview"
        subtitle={`Week of ${weekLabel}`}
        className="mb-8"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white dark:bg-card rounded-2xl border border-neutral-200 dark:border-border p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-neutral-500 dark:text-muted-foreground leading-snug pr-2">
                  {kpi.label}
                </span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight">
                {kpi.value}
              </p>
              {kpi.trend !== null ? (
                <p className={`text-sm mt-1.5 font-medium ${kpi.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {kpi.trend >= 0 ? '↑' : '↓'} {Math.abs(kpi.trend)}% vs last week
                </p>
              ) : (
                <p className="text-sm mt-1.5 text-neutral-400 dark:text-muted-foreground">
                  No data from last week
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Orders this week + Today snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl border border-neutral-200 dark:border-border p-5">
          <h2 className="font-semibold text-neutral-900 dark:text-foreground mb-5">
            Orders This Week
          </h2>
          {isLoading ? (
            <div className="h-32 rounded-lg bg-neutral-100 dark:bg-muted/30 animate-pulse" />
          ) : (
            <div className="flex items-end gap-2 h-32">
              {ordersByDay.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-foreground tabular-nums h-4">
                    {d.count > 0 ? d.count : ''}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-orange-400 dark:bg-orange-500/80 transition-all"
                    style={{
                      height: `${(d.count / maxDayCount) * 88}%`,
                      minHeight: d.count > 0 ? 6 : 2,
                    }}
                  />
                  <span className="text-xs text-neutral-500 dark:text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-card rounded-2xl border border-neutral-200 dark:border-border p-5">
          <h2 className="font-semibold text-neutral-900 dark:text-foreground mb-4">
            Today at a Glance
          </h2>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-muted-foreground">Orders placed</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-foreground">
                {isLoading ? '—' : todayOrders.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-muted-foreground">Revenue earned</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-foreground">
                {isLoading ? '—' : euros(todayRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-muted-foreground">Still in kitchen</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-foreground">
                {isLoading ? '—' : todayInKitchen}
              </span>
            </div>
            <div className="pt-3 border-t border-neutral-100 dark:border-border flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-muted-foreground">Staff on record</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-foreground">
                {staff.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Best-selling items */}
      <div className="bg-white dark:bg-card rounded-2xl border border-neutral-200 dark:border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-border">
          <h2 className="font-semibold text-neutral-900 dark:text-foreground">
            Your Best-Selling Items
          </h2>
          <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-0.5">
            All time · ranked by number of orders
          </p>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-neutral-100 dark:bg-muted/30" />
            ))}
          </div>
        ) : topItems.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-400 dark:text-muted-foreground">
            No orders yet — start serving customers to see your best-selling items here.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-border">
            {topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-7 h-7 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-300 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-neutral-800 dark:text-foreground min-w-0 truncate">
                  {item.name}
                </span>
                <span className="text-xs text-neutral-500 dark:text-muted-foreground whitespace-nowrap">
                  {item.count} {item.count === 1 ? 'order' : 'orders'}
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-foreground whitespace-nowrap">
                  {euros(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
