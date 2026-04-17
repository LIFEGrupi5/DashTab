import { TrendingUp, ShoppingBag, CheckCircle2, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';

const stats = [
  {
    label: 'Total Revenue',
    value: '€142.00',
    icon: TrendingUp,
    color: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-200',
  },
  {
    label: 'Completed Orders',
    value: 5,
    icon: CheckCircle2,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-200',
  },
  {
    label: 'Active Orders',
    value: 3,
    icon: ShoppingBag,
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-200',
  },
  {
    label: 'Avg. Order Value',
    value: '€28.40',
    icon: Clock,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-200',
  },
];

const peakHours = [
  { hour: '8', count: 2 },
  { hour: '9', count: 3 },
  { hour: '10', count: 1 },
  { hour: '11', count: 4 },
  { hour: '12', count: 8 },
  { hour: '13', count: 10 },
  { hour: '14', count: 7 },
  { hour: '15', count: 5 },
  { hour: '16', count: 3 },
  { hour: '17', count: 4 },
  { hour: '18', count: 9 },
  { hour: '19', count: 11 },
  { hour: '20', count: 8 },
  { hour: '21', count: 6 },
  { hour: '22', count: 2 },
];

const maxCount = Math.max(...peakHours.map(h => h.count));

const topItems = [
  { name: 'Qebapa', count: 12, revenue: 54.0 },
  { name: 'Pljeskavica', count: 9, revenue: 45.0 },
  { name: 'Tave Kosi', count: 7, revenue: 45.5 },
  { name: 'Byrek', count: 6, revenue: 7.2 },
  { name: 'Baklava', count: 5, revenue: 10.0 },
];

export default function OverviewPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Overview"
        subtitle={new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        className="mb-8"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-5 mb-6">
        <h2 className="font-semibold text-neutral-900 dark:text-foreground mb-4">Orders by Hour</h2>
        <div className="flex items-end gap-1.5 h-32 rounded-lg bg-neutral-50/80 dark:bg-muted/20 px-1 pt-2">
          {peakHours.map(h => (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div
                className="w-full bg-orange-400 dark:bg-orange-500/90 rounded-t-sm transition-all"
                style={{ height: `${(h.count / maxCount) * 100}%`, minHeight: h.count > 0 ? 4 : 0 }}
              />
              <span className="text-[10px] text-neutral-500 dark:text-muted-foreground tabular-nums">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-border">
          <h2 className="font-semibold text-neutral-900 dark:text-foreground">Top Ordered Items</h2>
        </div>
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
      </div>
    </div>
  );
}
