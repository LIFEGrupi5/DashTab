import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
};

export default function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-foreground">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
